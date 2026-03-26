import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import passwordIcon from "@/assets/login-password-icon.png"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { useChangePassword } from "../mutations/changePassword"
import { changePasswordSchema } from "../schemas"
import type {
  ChangePasswordFormModalProps,
  ChangePasswordFormValues,
  PasswordFieldProps,
  PasswordVisibilityState,
} from "../types"

const labelClassName = "mb-1 block text-[14px] leading-[22px] font-normal text-[#000000e0]"
const inputClassName =
  "h-[50px] w-[420px] rounded-[7px] border border-[#e4e7ef] bg-white px-[11px] py-[4px] pr-10 text-[14px] leading-[22px] text-[#1f2937] shadow-none placeholder:text-[14px] placeholder:leading-[22px] placeholder:font-normal placeholder:text-[#c2c7d3] hover:border-[#8f86f0] focus-visible:border-[#8f86f0] focus-visible:ring-1 focus-visible:ring-[#8f86f033] max-w-[calc(100vw-80px)]"

const PasswordField = ({
  name,
  label,
  placeholder,
  error,
  control,
  visible,
  onToggleVisible,
}: PasswordFieldProps) => (
  <div className="w-[420px] max-w-[calc(100vw-80px)]">
    <label className={labelClassName}>
      {label.trimStart().startsWith("*") ? (
        <>
          <span className="text-[#ef4444]">*</span>
          {label.trimStart().slice(1)}
        </>
      ) : (
        label
      )}
    </label>
    <div className="relative w-full">
      <img
        src={passwordIcon}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 object-contain opacity-90"
      />
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            value={field.value ?? ""}
            type={visible ? "text" : "password"}
            placeholder={placeholder}
            className={error ? `${inputClassName} border-[#ef4444] pl-9` : `${inputClassName} pl-9`}
          />
        )}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6]"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-[16px]" /> : <Eye className="size-[16px]" />}
      </button>
    </div>
    {error ? (
      <p className="mt-3 w-full break-words text-[14px] font-semibold leading-[20px] text-[#ef4444]">
        {error}
      </p>
    ) : null}
  </div>
)

export function ChangePasswordFormModal({ open, onOpenChange }: ChangePasswordFormModalProps) {
  const mutation = useChangePassword()
  const [visibility, setVisibility] = useState<PasswordVisibilityState>({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = form

  const closeModal = () => {
    reset()
    setVisibility({ oldPassword: false, newPassword: false, confirmPassword: false })
    onOpenChange(false)
  }

  const onValid = (v: ChangePasswordFormValues) => {
    mutation.mutate(
      { oldPassword: v.oldPassword, newPassword: v.newPassword },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Password changed successfully.", { position: "top-center" })
          closeModal()
        },
        onError: (err) => {
          toast.error(err.message, { position: "top-center" })
        },
      }
    )
  }


  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeModal()
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        showClose={false}
        overlayClassName="bg-black/40"
        className="left-1/2 top-[41%] min-h-[490px] w-[510px] max-w-[calc(100vw-40px)] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-[4px] border border-[#f4f6fb] bg-white p-0 text-[#0f172a] subpixel-antialiased shadow-[0_10px_25px_rgba(22,29,45,0.18)]"
      >
        <form
          onSubmit={handleSubmit(onValid)}
          className="select-none bg-white px-6 py-5"
        >
          <DialogHeader className="items-center pb-6">
            <DialogTitle className="text-[18px] font-semibold text-[#111827]">
              Change Password
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-5">
            <PasswordField
              name="oldPassword"
              label="*Enter Old Password"
              placeholder="Enter Old Password"
              error={errors.oldPassword?.message}
              control={control}
              visible={visibility.oldPassword}
              onToggleVisible={() =>
                setVisibility((prev) => ({ ...prev, oldPassword: !prev.oldPassword }))
              }
            />
            <PasswordField
              name="newPassword"
              label="*Enter New Password"
              placeholder="Enter New Password (min 11 chars, 1 capital letter, 1 small letter, 1 number, 1 special char)"
              error={errors.newPassword?.message}
              control={control}
              visible={visibility.newPassword}
              onToggleVisible={() =>
                setVisibility((prev) => ({ ...prev, newPassword: !prev.newPassword }))
              }
            />
            <PasswordField
              name="confirmPassword"
              label="*Re - Enter New Password"
              placeholder="Re - Enter New Password"
              error={errors.confirmPassword?.message}
              control={control}
              visible={visibility.confirmPassword}
              onToggleVisible={() =>
                setVisibility((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))
              }
            />
          </div>

          <div className="mt-7 flex w-full items-center justify-end gap-[16.99px] pr-4">
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="h-[50px] w-[130px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-[21.2344px] text-[16px] font-medium text-white hover:bg-[#6C5DD3] disabled:opacity-60"
            >
              Submit
            </Button>
            <Button
              type="button"
              onClick={closeModal}
              className="h-[50px] w-[130px] cursor-pointer rounded-[10px] bg-[#DADADA] px-[21.2344px] text-[16px] font-medium text-[#111827] hover:bg-[#DADADA]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
