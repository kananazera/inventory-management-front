"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Search, Loader2, RotateCcw } from "lucide-react"
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input"

interface Currency {
    id: number
    code: string
    name: string
    symbol: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
}

export default function CurrenciesPage() {
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
    const [filterCode, setFilterCode] = useState("") // Filter input state for code
    const [filterName, setFilterName] = useState("") // Filter input state for name
    const [formData, setFormData] = useState({ code: "", name: "", symbol: "" })
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const fetchCurrencies = useCallback(async (filterParams: { code?: string; name?: string }) => {
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Valyutalar yüklənmədi.")
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/currencies/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Valyutaları çəkərkən xəta:", response.status, errorData)
                await Swal.fire({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Valyutalar yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
                setCurrencies([])
                return
            }
            const data = await response.json()
            console.log("Valyuta API cavabı:", data)
            setCurrencies(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Valyutaları çəkərkən bağlantı xətası:", error)
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
            setCurrencies([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCurrencies({})
    }, [fetchCurrencies])

    const handleFilter = () => {
        fetchCurrencies({ code: filterCode, name: filterName })
    }

    const resetFilters = () => {
        setFilterCode("")
        setFilterName("")
        fetchCurrencies({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token) return
        setIsSubmittingForm(true)
        try {
            const url = editingCurrency
                ? `http://localhost:8080/api/currencies/${editingCurrency.id}`
                : "http://localhost:8080/api/currencies"
            const method = editingCurrency ? "PUT" : "POST"
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })
            let responseData: ApiResponse = {}
            try {
                responseData = await response.json()
            } catch (e) {
                responseData = {}
            }
            if (response.ok) {
                await Swal.fire({
                    title: "Uğurlu!",
                    text: editingCurrency ? "Valyuta uğurla yeniləndi" : "Valyuta uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false)
                resetForm()
                fetchCurrencies({})
            } else {
                await Swal.fire({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Əməliyyat uğursuz oldu",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
            }
        } catch (error) {
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
        } finally {
            setIsSubmittingForm(false)
        }
    }

    const handleEdit = (currency: Currency) => {
        setEditingCurrency(currency)
        setFormData({ code: currency.code, name: currency.name, symbol: currency.symbol })
        setDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Əminsiniz?",
            text: "Bu valyutanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Bəli, sil!",
            cancelButtonText: "Ləğv et",
            reverseButtons: true,
        })
        if (!result.isConfirmed) return
        const token = localStorage.getItem("token")
        if (!token) return
        setDeletingId(id)
        try {
            const response = await fetch(`http://localhost:8080/api/currencies/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                await Swal.fire({
                    title: "Silindi!",
                    text: "Valyuta uğurla silindi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                fetchCurrencies({})
            } else {
                let responseData: ApiResponse = {}
                try {
                    responseData = await response.json()
                } catch (e) {
                    responseData = { message: "Silmə əməliyyatı uğursuz oldu" }
                }
                await Swal.fire({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Silmə əməliyyatı uğursuz oldu",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
            }
        } catch (error) {
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
        } finally {
            setDeletingId(null)
        }
    }

    const resetForm = () => {
        setFormData({ code: "", name: "", symbol: "" })
        setEditingCurrency(null)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Valyutalar</h1>
                    <p className="mt-2 text-gray-600">Valyuta məlumatlarını idarə edin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni valyuta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCurrency ? "Valyutanı redaktə et" : "Yeni valyuta əlavə et"}</DialogTitle>
                            <DialogDescription>Valyuta məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="currency-code"
                                        label="Kod *"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        maxLength={3} // Max length for code
                                        disabled={isSubmittingForm}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="currency-name"
                                        label="Ad *"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isSubmittingForm}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="currency-symbol"
                                        label="Simvol *"
                                        value={formData.symbol}
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                        required
                                        maxLength={1} // Max length for symbol
                                        disabled={isSubmittingForm}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    disabled={isSubmittingForm}
                                >
                                    Ləğv et
                                </Button>
                                <Button type="submit" disabled={isSubmittingForm}>
                                    {isSubmittingForm && <Loader2 className="mr-2 h-6 w-6 animate-spin text-black" />}
                                    {editingCurrency ? "Yenilə" : "Əlavə et"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <FloatingLabelInput
                            id="currency-code-search"
                            label="Kod axtar..."
                            value={filterCode}
                            onChange={(e) => setFilterCode(e.target.value)}
                            className="max-w-sm"
                        />
                        <FloatingLabelInput
                            id="currency-name-search"
                            label="Ad axtar..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button onClick={handleFilter} size="icon" title="Filterlə">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Filter</span>
                        </Button>
                        <Button onClick={resetFilters} size="icon" variant="outline" title="Filterləri sıfırla">
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Filterləri sıfırla</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Kod</TableHead>
                                    <TableHead>Ad</TableHead>
                                    <TableHead>Simvol</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currencies.map((currency) => (
                                    <TableRow key={currency.id}>
                                        <TableCell>{currency.id}</TableCell>
                                        <TableCell className="font-medium">{currency.code}</TableCell>
                                        <TableCell>{currency.name}</TableCell>
                                        <TableCell>{currency.symbol}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(currency)}
                                                    disabled={deletingId !== null}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(currency.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    disabled={deletingId === currency.id}
                                                >
                                                    {deletingId === currency.id ? (
                                                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
