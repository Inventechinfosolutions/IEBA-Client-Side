type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

export async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<string> {
  const response = await fetch(imageSrc)
  const blob = await response.blob()
  const image = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get 2D canvas context")
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )
  return canvas.toDataURL("image/jpeg")
}

