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

interface Category {
    id: number
    name: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [searchTerm, setSearchTerm] = useState("") // Filter input state
    const [formData, setFormData] = useState({ name: "" })
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const fetchCategories = useCallback(async (filterParams: { name?: string }) => {
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Kateqoriyalar yüklənmədi.")
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/product-categories/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Kateqoriyaları çəkərkən xəta:", response.status, errorData)
                await Swal.fire({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Kateqoriyalar yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
                setCategories([])
                return
            }
            const data = await response.json()
            console.log("Kateqoriya API cavabı:", data)
            setCategories(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Kateqoriyaları çəkərkən bağlantı xətası:", error)
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
            setCategories([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories({})
    }, [fetchCategories])

    const handleFilter = () => {
        fetchCategories({ name: searchTerm })
    }

    const resetFilters = () => {
        setSearchTerm("")
        fetchCategories({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token) return
        setIsSubmittingForm(true)
        try {
            const url = editingCategory
                ? `http://localhost:8080/api/product-categories/${editingCategory.id}`
                : "http://localhost:8080/api/product-categories"
            const method = editingCategory ? "PUT" : "POST"
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
                    text: editingCategory ? "Kateqoriya uğurla yeniləndi" : "Kateqoriya uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false)
                resetForm()
                fetchCategories({})
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

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name })
        setDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Əminsiniz?",
            text: "Bu kateqoriyanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
            const response = await fetch(`http://localhost:8080/api/product-categories/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                await Swal.fire({
                    title: "Silindi!",
                    text: "Kateqoriya uğurla silindi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                fetchCategories({})
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
        setEditingCategory(null)
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
                    <h1 className="text-3xl font-bold text-gray-900">Kateqoriyalar</h1>
                    <p className="mt-2 text-gray-600">Məhsul kateqoriyalarını idarə edin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni kateqoriya
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya əlavə et"}</DialogTitle>
                            <DialogDescription>Kateqoriya məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="name"
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
                                    {editingCategory ? "Yenilə" : "Əlavə et"}
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
                            id="category-search" // Unikal ID əlavə edildi
                            label="Kateqoriya axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>{category.id}</TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(category)}
                                                    disabled={deletingId !== null}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(category.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    disabled={deletingId === category.id}
                                                >
                                                    {deletingId === category.id ? (
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
