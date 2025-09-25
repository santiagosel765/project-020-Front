"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

const DialogPortalContainerContext = React.createContext<HTMLElement | null>(null)

export const useDialogPortalContainer = () =>
  React.useContext(DialogPortalContainerContext)

export const Dialog = DialogPrimitive.Root

export const DialogTrigger = DialogPrimitive.Trigger

export const DialogPortal = DialogPrimitive.Portal

export const DialogClose = DialogPrimitive.Close

export type DialogCloseButtonProps = ButtonProps

export const DialogCloseButton = React.forwardRef<
  HTMLButtonElement,
  DialogCloseButtonProps
>(function DialogCloseButton(props, ref) {
  return (
    <DialogClose asChild>
      <Button ref={ref} {...props} />
    </DialogClose>
  )
})

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[100]",
        "bg-background/40 backdrop-blur-sm",
        "md:bg-black/75 md:backdrop-blur-0 md:no-blur-desktop",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
})

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Ajusta el ancho máximo del contenedor interno (px) */
    maxWidthPx?: number
    size?: "sm" | "md" | "lg" | "xl"
  }
>(function DialogContent(
  { className, children, maxWidthPx = 640, size, ...props },
  ref
) {
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
  const handleOpenAutoFocus = React.useCallback(
    (e: Event) => {
      if (isIOS) {
        e.preventDefault()
      }
    },
    [isIOS]
  )

  const sizeToPx: Record<"sm" | "md" | "lg" | "xl", number> = {
    sm: 480,
    md: 640,
    lg: 800,
    xl: 960,
  }

  const widthLimit = size ? sizeToPx[size] ?? maxWidthPx : maxWidthPx

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        onOpenAutoFocus={handleOpenAutoFocus}
        className={cn(
          "fixed inset-0 z-[100] m-0 p-0",
          "flex items-center justify-center",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          "overflow-x-hidden",
          className
        )}
        {...props}
      >
        <div
          ref={contentRef}
          data-dialog-content
          className={cn(
            "relative overflow-y-auto overflow-x-hidden",
            "rounded-2xl bg-background",
            "shadow-2xl ring-1 ring-border/50",
            "box-border",
            "p-6",
            "mx-auto"
          )}
          style={{
            width: `min(${widthLimit}px, calc(100vw - 32px))`,
            maxHeight: "min(calc(100dvh - 32px), 700px)",
          }}
        >
          <DialogPortalContainerContext.Provider value={contentRef.current}>
            {children}
          </DialogPortalContainerContext.Provider>

          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-3 space-y-1", className)} {...props} />
)

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
)

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
})

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
