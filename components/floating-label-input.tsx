"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FloatingLabelInputProps extends React.ComponentProps<typeof Input> {
    label: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
    ({ label, id, className, onFocus, onBlur, value, defaultValue, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false)
        const hasValue = !!value || !!defaultValue

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true)
            onFocus?.(e)
        }

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false)
            onBlur?.(e)
        }

        // Inputun yuxarı hissəsində etiket üçün yer açmaq
        const inputPaddingTop = "pt-6"

        return (
            <div className="relative">
                <Input
                    id={id}
                    ref={ref}
                    className={cn(inputPaddingTop, className)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={value}
                    defaultValue={defaultValue}
                    {...props}
                />
                <Label
                    htmlFor={id}
                    className={cn(
                        "absolute left-3 text-sm text-muted-foreground transition-all duration-200 ease-in-out",
                        isFocused || hasValue
                            ? "-top-2 left-2 text-xs bg-background px-1" // Yuxarıya hərəkət edir, kiçilir və arxa plan alır
                            : "top-1/2 -translate-y-1/2", // Şaquli mərkəzdə qalır
                    )}
                >
                    {label}
                </Label>
            </div>
        )
    },
)

FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
