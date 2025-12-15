import * as React from "react"

import { cn } from "../../lib/utils"

// A simply styled native checkbox that mimics shadcn's look
export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                type="checkbox"
                className={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground",
                    // Native checkbox styling to remove default look and use custom if feasible,
                    // but for true shadcn look with Radix Primitive it's better.
                    // Since I want to avoid massive dependencies, I will just use standard accent-color or simple Tailwind form plugin style if available.
                    // BUT, to make it look like shadcn without Radix, one often uses appearance-none and svg background.
                    // For now, I'll stick to a decent native look with 'accent-primary'.
                    "accent-primary",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
