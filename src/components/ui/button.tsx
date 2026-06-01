import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline"
  size?: "default" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variantStyles = variant === "default" 
      ? "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
      : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-300"
    
    const sizeStyles = size === "default" 
      ? "h-10 px-4 py-2 text-sm"
      : "h-12 px-8 py-2 text-base"

    const styles = cn(baseStyles, variantStyles, sizeStyles, className)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(styles, (children.props as any).className),
        ...props,
        ref,
      } as any)
    }

    return (
      <button
        className={styles}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
