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
import { Plus, Edit, Trash2, Search, Loader2, RotateCcw } from "lucide-react" // RotateCcw icon added
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input"

interface Brand {
    id: number
    name: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
}

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [filterName, setFilterName] = useState("") // Filter input state
    const [formData, setFormData] = useState({ name: "" })
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const fetchBrands = useCallback(async (filterParams: { name?: string }) => {
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Brendlər yüklənmədi.")
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/product-brands/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Brendləri çəkərkən xəta:", response.status, errorData)
                await Swal.fire({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Brendlər yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
                setBrands([])
                return
            }
            const data = await response.json()
            console.log("Brend API cavabı:", data)
            setBrands(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Brendləri çəkərkən bağlantı xətası:", error)
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
            setBrands([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBrands({})
    }, [fetchBrands])

    const handleFilter = () => {
        fetchBrands({ name: filterName })
    }

    const resetFilters = () => {
        setFilterName("")
        fetchBrands({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token) return
        setIsSubmittingForm(true)
        try {
            const url = editingBrand
                ? `http://localhost:8080/api/product-brands/${editingBrand.id}`
                : "http://localhost:8080/api/product-brands"
            const method = editingBrand ? "PUT" : "POST"
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
                    text: editingBrand ? "Brend uğurla yeniləndi" : "Brend uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false)
                resetForm()
                fetchBrands({})
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

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand)
        setFormData({ name: brand.name })
        setDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Əminsiniz?",
            text: "Bu brendi silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
            const response = await fetch(`http://localhost:8080/api/product-brands/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                await Swal.fire({
                    title: "Silindi!",
                    text: "Brend uğurla silindi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                fetchBrands({})
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
        setFormData({ name: "" })
        setEditingBrand(null)
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
                    <h1 className="text-3xl font-bold text-gray-900">Brendlər</h1>
                    <p className="mt-2 text-gray-600">Məhsul brendlərini idarə edin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni brend
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingBrand ? "Brendi redaktə et" : "Yeni brend əlavə et"}</DialogTitle>
                            <DialogDescription>Brend məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="brand-name"
                                        label="Ad *"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
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
                                    {editingBrand ? "Yenilə" : "Əlavə et"}
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
                            id="brand-search" // Unikal ID əlavə edildi
                            label="Brend axtar..."
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
                                    <TableHead>Ad</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brands.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell>{brand.id}</TableCell>
                                        <TableCell className="font-medium">{brand.name}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(brand)}
                                                    disabled={deletingId !== null}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(brand.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    disabled={deletingId === brand.id}
                                                >
                                                    {deletingId === brand.id ? (
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
