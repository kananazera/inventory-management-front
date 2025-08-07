"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Warehouse, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface WarehouseData {
    id: number
    name: string
    phone?: string
    email?: string
    address?: string
    createdAt: string
    updatedAt: string
}

interface WarehouseFormData {
    name: string
    phone: string
    email: string
    address: string
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null)
    const [formData, setFormData] = useState<WarehouseFormData>({
        name: "",
        phone: "",
        email: "",
        address: "",
    })
    const [formErrors, setFormErrors] = useState<Partial<WarehouseFormData>>({})
    const { toast } = useToast()

    useEffect(() => {
        fetchWarehouses()
    }, [])

    const fetchWarehouses = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:8080/api/warehouses", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setWarehouses(data)
            } else {
                toast({
                    title: "Xəta",
                    description: "Anbarlar yüklənərkən xəta baş verdi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Xəta",
                description: "Anbarlar yüklənərkən xəta baş verdi",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const validateForm = (data: WarehouseFormData): boolean => {
        const errors: Partial<WarehouseFormData> = {}

        if (!data.name.trim()) {
            errors.name = "Anbar adı tələb olunur"
        }

        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = "Düzgün email formatı daxil edin"
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm(formData)) {
            return
        }

        try {
            const token = localStorage.getItem("token")
            const url = editingWarehouse
                ? `http://localhost:8080/api/warehouses/${editingWarehouse.id}`
                : "http://localhost:8080/api/warehouses"

            const response = await fetch(url, {
                method: editingWarehouse ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast({
                    title: "Uğurlu",
                    description: editingWarehouse
                        ? "Anbar uğurla yeniləndi"
                        : "Anbar uğurla əlavə edildi",
                })
                fetchWarehouses()
                resetForm()
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
            } else {
                const errorData = await response.json()
                toast({
                    title: "Xəta",
                    description: errorData.message || "Əməliyyat zamanı xəta baş verdi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Xəta",
                description: "Əməliyyat zamanı xəta baş verdi",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`http://localhost:8080/api/warehouses/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast({
                    title: "Uğurlu",
                    description: "Anbar uğurla silindi",
                })
                fetchWarehouses()
            } else {
                toast({
                    title: "Xəta",
                    description: "Anbar silinərkən xəta baş verdi",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Xəta",
                description: "Anbar silinərkən xəta baş verdi",
                variant: "destructive",
            })
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            address: "",
        })
        setFormErrors({})
        setEditingWarehouse(null)
    }

    const openEditDialog = (warehouse: WarehouseData) => {
        setEditingWarehouse(warehouse)
        setFormData({
            name: warehouse.name,
            phone: warehouse.phone || "",
            email: warehouse.email || "",
            address: warehouse.address || "",
        })
        setIsEditDialogOpen(true)
    }

    const openCreateDialog = () => {
        resetForm()
        setIsCreateDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded">
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Anbarlar</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Anbar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Yeni Anbar Əlavə Et</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Anbar Adı <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Anbar adını daxil edin"
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-red-500">{formErrors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    placeholder="Telefon nömrəsini daxil edin"
                                />
                                {formErrors.phone && (
                                    <p className="text-sm text-red-500">{formErrors.phone}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="Email ünvanını daxil edin"
                                />
                                {formErrors.email && (
                                    <p className="text-sm text-red-500">{formErrors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Ünvan</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData({ ...formData, address: e.target.value })
                                    }
                                    placeholder="Ünvanı daxil edin"
                                />
                                {formErrors.address && (
                                    <p className="text-sm text-red-500">{formErrors.address}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Ləğv et
                                </Button>
                                <Button type="submit">Əlavə et</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Warehouse className="mr-2 h-5 w-5" />
                        Anbarlar Siyahısı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {warehouses.length === 0 ? (
                        <div className="text-center py-8">
                            <Warehouse className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Anbar tapılmadı
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                İlk anbarınızı əlavə etməklə başlayın.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {warehouses.map((warehouse) => (
                                <div
                                    key={warehouse.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <Warehouse className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {warehouse.name}
                                                </h3>
                                                <div className="mt-1 space-y-1">
                                                    {warehouse.phone && (
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Phone className="mr-1 h-3 w-3" />
                                                            {warehouse.phone}
                                                        </div>
                                                    )}
                                                    {warehouse.email && (
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Mail className="mr-1 h-3 w-3" />
                                                            {warehouse.email}
                                                        </div>
                                                    )}
                                                    {warehouse.address && (
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <MapPin className="mr-1 h-3 w-3" />
                                                            {warehouse.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(warehouse)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Anbarı Redaktə Et</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-name">
                                                            Anbar Adı <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="edit-name"
                                                            value={formData.name}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, name: e.target.value })
                                                            }
                                                            placeholder="Anbar adını daxil edin"
                                                        />
                                                        {formErrors.name && (
                                                            <p className="text-sm text-red-500">{formErrors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-phone">Telefon</Label>
                                                        <Input
                                                            id="edit-phone"
                                                            value={formData.phone}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, phone: e.target.value })
                                                            }
                                                            placeholder="Telefon nömrəsini daxil edin"
                                                        />
                                                        {formErrors.phone && (
                                                            <p className="text-sm text-red-500">{formErrors.phone}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-email">Email</Label>
                                                        <Input
                                                            id="edit-email"
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, email: e.target.value })
                                                            }
                                                            placeholder="Email ünvanını daxil edin"
                                                        />
                                                        {formErrors.email && (
                                                            <p className="text-sm text-red-500">{formErrors.email}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="edit-address">Ünvan</Label>
                                                        <Input
                                                            id="edit-address"
                                                            value={formData.address}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, address: e.target.value })
                                                            }
                                                            placeholder="Ünvanı daxil edin"
                                                        />
                                                        {formErrors.address && (
                                                            <p className="text-sm text-red-500">{formErrors.address}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setIsEditDialogOpen(false)}
                                                        >
                                                            Ləğv et
                                                        </Button>
                                                        <Button type="submit">Yenilə</Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Anbarı sil</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Bu anbarı silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(warehouse.id)}
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
        </div>
    )
}
