import { useRef, useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Crop utility ─────────────────────────────────────────────────────────────
// Extracts the circular region from the source image using canvas.
// The image is rendered with objectFit:cover + scale + translate, so we
// reverse that transform to find the source pixel region.
async function getCroppedImg(
  imageSrc: string,
  cirX: number,      // circle centre x in container px
  cirY: number,      // circle centre y in container px
  diameter: number,  // crop circle diameter in container px
  contW: number,
  contH: number,
  offset: { x: number; y: number }, // image pan offset (container-relative translate)
  scale: number,                     // extra zoom scale
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const nW = image.naturalWidth
  const nH = image.naturalHeight
  // CSS objectFit:cover base scale
  const baseScale  = Math.max(contW / nW, contH / nH)
  const totalScale = baseScale * scale
  // Circle bounding-box top-left in container px
  const boxLeft = cirX - diameter / 2
  const boxTop  = cirY - diameter / 2
  // Map container px → source image px
  // screenX = contW/2 + offset.x + (srcX - nW/2) * totalScale
  // → srcX  = (screenX - contW/2 - offset.x) / totalScale + nW/2
  const srcX    = (boxLeft - contW / 2 - offset.x) / totalScale + nW / 2
  const srcY    = (boxTop  - contH / 2 - offset.y) / totalScale + nH / 2
  const srcSize = diameter / totalScale

  const out = Math.round(diameter)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = out
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No canvas context")
  ctx.beginPath()
  ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, out, out)
  return canvas.toDataURL("image/png")
}
// ─────────────────────────────────────────────────────────────────────────────

const MIN_SIZE   = 80
const MAX_SIZE   = 440
const RING_WIDTH = 18   // px thick grab zone on the circle edge

type DragMode = "none" | "move-circle" | "resize-circle" | "pan-image"

type ImageCropUploadDialogProps = {
  title: string
  onImageCropped: (dataUrl: string) => void
  onCropError?: () => void
  onConfirmWithoutImage?: () => void
  renderTrigger: (actions: { openDialog: () => void }) => React.ReactNode
}

export function ImageCropUploadDialog({
  title,
  onImageCropped,
  onCropError,
  onConfirmWithoutImage,
  renderTrigger,
}: ImageCropUploadDialogProps) {
  const [open, setOpen]         = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Circle position (px from container top-left) & size
  const [cirX, setCirX]         = useState(234)
  const [cirY, setCirY]         = useState(230)
  const [cropSize, setCropSize] = useState(240)

  // Image pan / zoom
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [imgScale, setImgScale]   = useState(1)

  // Cursor shown on the SVG layer
  const [cursor, setCursor] = useState("default")

  const containerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Drag state in refs (pointer capture delivers move/up without useEffect)
  const dragMode  = useRef<DragMode>("none")
  const dragStart = useRef<{
    clientX: number; clientY: number
    cx: number; cy: number
    ox: number; oy: number
    cs: number
  } | null>(null)
  const activePointerId = useRef<number | null>(null)

  const centerCircleInContainer = () => {
    requestAnimationFrame(() => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      setCirX(rect.width / 2)
      setCirY(rect.height / 2)
    })
  }

  // ── Reset all state ───────────────────────────────────────────────────────
  const resetAll = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
    setImgOffset({ x: 0, y: 0 })
    setImgScale(1)
    setCropSize(240)
    setCirX(234); setCirY(230)
    activePointerId.current = null
    dragMode.current = "none"
    dragStart.current = null
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Pick image ────────────────────────────────────────────────────────────
  const handlePickImage = (file: File | null) => {
    if (!file) return
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(URL.createObjectURL(file))
    setImgOffset({ x: 0, y: 0 })
    setImgScale(1)
    setCropSize(240)
  }

  // ── Helpers: hit zone ─────────────────────────────────────────────────────
  const getDist = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return Infinity
    return Math.sqrt((clientX - rect.left - cirX) ** 2 + (clientY - rect.top - cirY) ** 2)
  }

  const classifyHit = (clientX: number, clientY: number): DragMode => {
    const dist = getDist(clientX, clientY)
    const r    = cropSize / 2
    if (Math.abs(dist - r) <= RING_WIDTH) return "resize-circle"
    if (dist < r - RING_WIDTH)            return "move-circle"
    return "pan-image"
  }

  const beginDragFromHit = (clientX: number, clientY: number) => {
    dragMode.current  = classifyHit(clientX, clientY)
    dragStart.current = {
      clientX, clientY,
      cx: cirX, cy: cirY,
      ox: imgOffset.x, oy: imgOffset.y,
      cs: cropSize,
    }
  }

  const applyDragMove = (clientX: number, clientY: number) => {
    const mode = dragMode.current
    const ds   = dragStart.current
    if (mode === "none" || !ds) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const dx = clientX - ds.clientX
    const dy = clientY - ds.clientY

    if (mode === "move-circle") {
      const r = ds.cs / 2
      setCirX(Math.max(r, Math.min(rect.width  - r, ds.cx + dx)))
      setCirY(Math.max(r, Math.min(rect.height - r, ds.cy + dy)))
    } else if (mode === "resize-circle") {
      const screenCx = rect.left + ds.cx
      const screenCy = rect.top  + ds.cy
      const dist = Math.sqrt((clientX - screenCx) ** 2 + (clientY - screenCy) ** 2)
      setCropSize(Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, dist * 2))))
    } else {
      setImgOffset({ x: ds.ox + dx, y: ds.oy + dy })
    }
  }

  const updateHoverCursor = (clientX: number, clientY: number) => {
    const dist = getDist(clientX, clientY)
    const rr   = cropSize / 2
    if (Math.abs(dist - rr) <= RING_WIDTH) setCursor("nwse-resize")
    else if (dist < rr - RING_WIDTH)       setCursor("grab")
    else                                    setCursor("default")
  }

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    e.preventDefault()
    beginDragFromHit(e.clientX, e.clientY)
    activePointerId.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    applyDragMove(e.clientX, e.clientY)
    if (dragMode.current === "none") updateHoverCursor(e.clientX, e.clientY)
  }

  const endActivePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== e.pointerId) return
    activePointerId.current = null
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* already released */
    }
    dragMode.current = "none"
    dragStart.current = null
  }

  // ── Scroll to zoom ────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setImgScale(s => Math.min(5, Math.max(0.2, s - e.deltaY * 0.001)))
  }

  // ── Confirm / crop ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!imageSrc) { onConfirmWithoutImage?.(); return }
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) { onCropError?.(); return }
    try {
      const dataUrl = await getCroppedImg(
        imageSrc, cirX, cirY, cropSize,
        rect.width, rect.height,
        imgOffset, imgScale,
      )
      onImageCropped(dataUrl)
      resetAll()
      setOpen(false)
    } catch { onCropError?.() }
  }

  // ── SVG geometry ──────────────────────────────────────────────────────────
  const r = cropSize / 2

  return (
    <>
      {renderTrigger({ openDialog: () => setOpen(true) })}

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetAll() }}>
        <DialogContent
          showClose={false}
          className="flex h-[529px] w-[520px] max-w-none flex-col gap-0 rounded-[8px] border-0 bg-white p-0"
        >
          <DialogHeader className="px-6 pt-5">
            <DialogTitle className="text-[16px] font-semibold text-[#111827]">
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col px-6 pb-5 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
            />

            {!imageSrc ? (
              /* ── empty state ── */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center rounded-[6px] border border-dashed border-[#c9ccd6] bg-white text-[16px] font-semibold text-[#111827]"
              >
                Choose a file
              </button>
            ) : (
              <div className="flex min-h-0 w-full flex-1 flex-col">
                {/* ── crop area ── */}
                <div
                  ref={containerRef}
                  className="relative h-[460px] w-full overflow-hidden rounded-[6px] bg-[#6b6b6b]"
                  onWheel={handleWheel}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => { resetAll(); setOpen(false) }}
                    className="absolute left-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-[#2f2f2f]/70 text-white hover:bg-[#2f2f2f]/80"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>

                  {/* ── Image (pan + zoom via CSS transform) ── */}
                  <img
                    src={imageSrc}
                    alt=""
                    draggable={false}
                    onLoad={centerCircleInContainer}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${imgScale})`,
                      transformOrigin: "center",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />

                  {/* ── SVG overlay: dark mask + dashed circle + interaction ── */}
                  <svg
                    className="absolute inset-0 z-10 h-full w-full touch-none"
                    style={{ cursor }}
                    onPointerMove={handleSvgPointerMove}
                    onPointerLeave={() => setCursor("default")}
                    onPointerDown={handleSvgPointerDown}
                    onPointerUp={endActivePointer}
                    onPointerCancel={endActivePointer}
                  >
                    <defs>
                      {/* Mask: white everywhere, black hole where the circle is */}
                      <mask id="crop-hole-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx={cirX} cy={cirY} r={r} fill="black" />
                      </mask>
                    </defs>

                    {/* Dark backdrop with circle cut out */}
                    <rect
                      width="100%"
                      height="100%"
                      fill="rgba(0,0,0,0.55)"
                      mask="url(#crop-hole-mask)"
                      style={{ pointerEvents: "none" }}
                    />

                    {/* Dashed circle border */}
                    <circle
                      cx={cirX} cy={cirY} r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      style={{ pointerEvents: "none" }}
                    />
                  </svg>
                </div>

                {/* ── bottom row ── */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer text-[12px] font-medium text-[#6C5DD3]"
                  >
                    Choose another file
                  </button>
                </div>
              </div>
            )}

            {/* ── action buttons ── */}
            <div className="mt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={() => { resetAll(); setOpen(false) }}
                className="h-12 min-w-[92px] rounded-[10px] bg-[#d2d4d9] px-6 text-[12px] text-[#111827] hover:bg-[#d2d4d9] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!imageSrc}
                className="h-12 min-w-[92px] rounded-[10px] bg-[#6C5DD3] px-6 text-[12px] text-white hover:bg-[#6C5DD3] cursor-pointer disabled:opacity-60"
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

