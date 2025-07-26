"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

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
                                     disabled,
                                     maxSelection = 5,
                                     placeholder = "Rollar seçin...",
                                 }: MultiSelectRolesProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleSelect = (optionId: number) => {
        const isSelected = selected.includes(optionId)
        let newSelected: number[]

        if (isSelected) {
            newSelected = selected.filter((id) => id !== optionId)
        } else {
            if (selected.length < maxSelection) {
                newSelected = [...selected, optionId]
            } else {
                // Optionally, show a toast or message that max selection limit is reached
                return
            }
        }
        onSelect(newSelected)
    }

    const selectedNames = selected
        .map((id) => options.find((option) => option.id === id)?.name)
        .filter((name): name is string => name !== undefined)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10 px-3 py-2 bg-transparent"
                    disabled={disabled}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedNames.length > 0 ? (
                            selectedNames.map((name, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {name}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const option = options.find((opt) => opt.name === name)
                                            if (option) handleSelect(option.id)
                                        }}
                                    />
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Rol axtar..." value={inputValue} onValueChange={setInputValue} />
                    <CommandList>
                        <CommandEmpty>Rol tapılmadı.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.name}
                                    onSelect={() => {
                                        handleSelect(option.id)
                                        setInputValue("") // Clear input after selection
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    {option.name}
                                    <Check
                                        className={cn("ml-auto h-4 w-4", selected.includes(option.id) ? "opacity-100" : "opacity-0")}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
