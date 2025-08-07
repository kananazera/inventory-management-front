"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, Receipt } from 'lucide-react'

interface Tax {
    id: number
    name: string
    rate: number
}

export default function TaxesPage() {
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingTax, setEditingTax] = useState<Tax | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        rate: "",
    })

    useEffect(() => {
        fetchTaxes()
    }, [])

    const fetchTaxes = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:8080/api/taxes", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setTaxes(data)
            } else {
                toast({
                    title: "Xəta",
                    description: "Vergilər yüklənə bilmədi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error fetching taxes:", error)
            toast({
                title: "Xəta",
                description: "Vergilər yüklənə bilmədi",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast({
                title: "Xəta",
                description: "Vergi adı daxil edilməlidir",
                variant: "destructive",
            })
            return false
        }

        const rate = parseFloat(formData.rate)
        if (isNaN(rate) || rate < 0 || rate > 100) {
            toast({
                title: "Xəta",
                description: "Vergi dərəcəsi 0-100 arasında olmalıdır",
                variant: "destructive",
            })
            return false
        }

        return true
    }

    const handleCreate = async () => {
        if (!validateForm()) return

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:8080/api/taxes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    rate: parseFloat(formData.rate),
                }),
            })

            if (response.ok) {
                toast({
                    title: "Uğurlu",
                    description: "Vergi yaradıldı",
                })
                setIsCreateDialogOpen(false)
                resetForm()
                fetchTaxes()
            } else {
                const errorData = await response.json()
                toast({
                    title: "Xəta",
                    description: errorData.message || "Vergi yaradıla bilmədi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error creating tax:", error)
            toast({
                title: "Xəta",
                description: "Vergi yaradıla bilmədi",
                variant: "destructive",
            })
        }
    }

    const handleEdit = async () => {
        if (!editingTax || !validateForm()) return

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`http://localhost:8080/api/taxes/${editingTax.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    rate: parseFloat(formData.rate),
                }),
            })

            if (response.ok) {
                toast({
                    title: "Uğurlu",
                    description: "Vergi yeniləndi",
                })
                setIsEditDialogOpen(false)
                setEditingTax(null)
                resetForm()
                fetchTaxes()
            } else {
                const errorData = await response.json()
                toast({
                    title: "Xəta",
                    description: errorData.message || "Vergi yenilənə bilmədi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error updating tax:", error)
            toast({
                title: "Xəta",
                description: "Vergi yenilənə bilmədi",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`http://localhost:8080/api/taxes/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast({
                    title: "Uğurlu",
                    description: "Vergi silindi",
                })
                fetchTaxes()
            } else {
                const errorData = await response.json()
                toast({
                    title: "Xəta",
                    description: errorData.message || "Vergi silinə bilmədi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error deleting tax:", error)
            toast({
                title: "Xəta",
                description: "Vergi silinə bilmədi",
                variant: "destructive",
            })
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            rate: "",
        })
    }

    const openEditDialog = (tax: Tax) => {
        setEditingTax(tax)
        setFormData({
            name: tax.name,
            rate: tax.rate.toString(),
        })
        setIsEditDialogOpen(true)
    }

    const filteredTaxes = taxes.filter((tax) =>
        tax.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Yüklənir...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Vergilər</h1>
                <p className="mt-2 text-gray-600">Vergi dərəcələrini idarə edin</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Vergi axtar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Vergi
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Vergi Yarat</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Vergi Adı *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Məsələn: ƏDV"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="rate">Vergi Dərəcəsi (%) *</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.rate}
                                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                    placeholder="18.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Ləğv et
                            </Button>
                            <Button onClick={handleCreate}>Yarat</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Vergilər ({filteredTaxes.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredTaxes.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? "Axtarış nəticəsi tapılmadı" : "Hələ vergi əlavə edilməyib"}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm ? "Başqa açar sözlə axtarış edin" : "İlk vergi növünüzü yaradın"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTaxes.map((tax) => (
                                <div
                                    key={tax.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <Receipt className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <h3 className="font-medium text-gray-900">{tax.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Dərəcə: <span className="font-medium">{tax.rate}%</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(tax)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Vergi silinsin?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu əməliyyat geri qaytarıla bilməz. "{tax.name}" vergi növü tamamilə silinəcək.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(tax.id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Sil
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vergi Redaktə Et</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Vergi Adı *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Məsələn: ƏDV"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-rate">Vergi Dərəcəsi (%) *</Label>
                            <Input
                                id="edit-rate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                placeholder="18.00"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Ləğv et
                        </Button>
                        <Button onClick={handleEdit}>Yenilə</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
