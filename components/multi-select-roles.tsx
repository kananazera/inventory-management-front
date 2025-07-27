"use client"

import * as React from "react"
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Option {
    id: number
    name: string
}

interface MultiSelectRolesProps {
    options: Option[]
    selected: number[]
    onSelect: (selectedIds: number[]) => void
    disabled?: boolean
    maxSelection?: number
    placeholder?: string
}

export function MultiSelectRoles({
                                     options,
                                     selected,
                                     onSelect,
                                     disabled = false,
                                     maxSelection = 5,
                                     placeholder = "Rollar seçin...",
                                 }: MultiSelectRolesProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleToggleOption = (optionId: number) => {
        const isSelected = selected.includes(optionId)
        let newSelected: number[]

        if (isSelected) {
            newSelected = selected.filter((id) => id !== optionId)
        } else {
            if (selected.length < maxSelection) {
                newSelected = [...selected, optionId]
            } else {
                return // Max selection reached
            }
        }

        onSelect(newSelected)
    }

    const handleRemoveOption = (optionId: number) => {
        const newSelected = selected.filter((id) => id !== optionId)
        onSelect(newSelected)
    }

    const selectedOptions = selected
        .map((id) => options.find((option) => option.id === id))
        .filter((option): option is Option => option !== undefined)

    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <Button
                type="button"
                variant="outline"
                className={cn(
                    "w-full justify-between h-auto min-h-[40px] px-3 py-2 text-left font-normal",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map((option) => (
                            <Badge
                                key={option.id}
                                variant="secondary"
                                className="flex items-center gap-1 text-xs"
                            >
                                <span className="truncate max-w-[100px]">{option.name}</span>
                                <X
                                    className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveOption(option.id)
                                    }}
                                />
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                        <Input
                            type="text"
                            placeholder="Rol axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                Rol tapılmadı
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = selected.includes(option.id)
                                const isMaxReached = selected.length >= maxSelection && !isSelected

                                return (
                                    <div
                                        key={option.id}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                                            isSelected && "bg-blue-50 text-blue-700",
                                            isMaxReached && "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={() => !isMaxReached && handleToggleOption(option.id)}
                                    >
                                        <span className="flex-1 text-sm">{option.name}</span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer Info */}
                    {selected.length > 0 && (
                        <div className="p-2 border-t bg-gray-50 text-xs text-gray-600 text-center">
                            {selected.length} / {maxSelection} seçildi
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
