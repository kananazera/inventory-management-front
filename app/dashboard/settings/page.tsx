"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Save, CheckCircle } from "lucide-react"

interface Setting {
    key: string
    value: string
    description: string
}

interface Currency {
    id: number
    name: string
    code: string
    symbol: string
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([])
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        fetchSettings()
        fetchCurrencies()
    }, [])

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:8080/api/settings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setSettings(data)

                // Initialize form data with current values
                const initialFormData: Record<string, string> = {}
                data.forEach((setting: Setting) => {
                    initialFormData[setting.key] = setting.value
                })
                setFormData(initialFormData)
            } else {
                toast({
                    title: "Xəta",
                    description: "Tənzimləmələr yüklənə bilmədi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Settings fetch error:", error)
            toast({
                title: "Xəta",
                description: "Tənzimləmələr yüklənə bilmədi",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCurrencies = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:8080/api/currencies", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setCurrencies(data)
            } else {
                console.error("Failed to fetch currencies")
            }
        } catch (error) {
            console.error("Currencies fetch error:", error)
        }
    }

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }))
        // Hide success message when user starts editing
        if (showSuccess) {
            setShowSuccess(false)
        }
    }

    const handleCurrencyChange = (currencyCode: string) => {
        // Find the selected currency to get its symbol
        const selectedCurrency = currencies.find((currency) => currency.code === currencyCode)
        if (selectedCurrency) {
            // Store the symbol instead of code
            handleInputChange("default_currency", selectedCurrency.symbol)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setShowSuccess(false)

        try {
            const token = localStorage.getItem("token")

            // Prepare array of settings to update
            const settingsToUpdate = settings.map((setting) => ({
                key: setting.key,
                value: formData[setting.key] || setting.value,
                description: setting.description,
            }))

            console.log("Updating settings array:", settingsToUpdate)

            const response = await fetch("http://localhost:8080/api/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settingsToUpdate),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Failed to update settings:", response.status, errorText)
                throw new Error(`Tənzimləmələr yenilənə bilmədi: ${response.status}`)
            }

            const result = await response.json()
            console.log("Successfully updated settings:", result)

            // Show success message
            setShowSuccess(true)

            toast({
                title: "Uğurlu",
                description: "Bütün tənzimləmələr yeniləndi",
            })

            // Refresh settings
            await fetchSettings()

            // Hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false)
            }, 5000)
        } catch (error) {
            console.error("Settings update error:", error)
            toast({
                title: "Xəta",
                description: "Tənzimləmələr yenilənə bilmədi",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const renderSettingField = (setting: Setting) => {
        // Special handling for default_currency
        if (setting.key === "default_currency") {
            // Find current currency by symbol to show correct selection
            const currentCurrency = currencies.find(
                (currency) => currency.symbol === (formData[setting.key] || setting.value),
            )

            return (
                <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key}>{setting.description}</Label>
                    <Select value={currentCurrency?.code || ""} onValueChange={handleCurrencyChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Valyuta seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map((currency) => (
                                <SelectItem key={currency.id} value={currency.code}>
                                    {currency.code} - {currency.name} ({currency.symbol})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )
        }

        // Default input field for other settings
        return (
            <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <Input
                    id={setting.key}
                    value={formData[setting.key] || ""}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                    placeholder={setting.description}
                />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2" />
                </div>

                <Card>
                    <CardHeader>
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tənzimləmələr</h1>
                <p className="text-muted-foreground">Sistem tənzimləmələrini idarə edin</p>
            </div>

            {showSuccess && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Tənzimləmələr uğurla yeniləndi! Dəyişikliklər yadda saxlanıldı.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Sistem Tənzimləmələri</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {settings.map((setting) => renderSettingField(setting))}

                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yenilənir...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Yadda saxla
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
