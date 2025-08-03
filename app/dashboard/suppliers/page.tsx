"use client"
import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { Eye, Search, RotateCcw, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Swal from "sweetalert2"
import { Skeleton } from "@/components/ui/skeleton"

// SweetAlert konfiqurasiyası
const swalConfig = {
    customClass: {
        container: "swal-container",
        popup: "swal-popup",
        header: "swal-header",
        title: "swal-title",
        closeButton: "swal-close-button",
        icon: "swal-icon",
        image: "swal-image",
        content: "swal-content",
        htmlContainer: "swal-html-container",
        input: "swal-input",
        inputLabel: "swal-input-label",
        validationMessage: "swal-validation-message",
        actions: "swal-actions",
        confirmButton: "swal-confirm-button",
        denyButton: "swal-deny-button",
        cancelButton: "swal-cancel-button",
        loader: "swal-loader",
        footer: "swal-footer",
        timerProgressBar: "swal-timer-progress-bar",
    },
    backdrop: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    stopKeydownPropagation: true,
    keydownListenerCapture: false,
    showConfirmButton: true,
    showDenyButton: false,
    showCancelButton: false,
    confirmButtonText: "OK",
    returnFocus: true,
    focusConfirm: true,
    focusDeny: true,
    focusCancel: true,
    heightAuto: true,
    padding: "1.25rem",
    width: "32rem",
    position: "center",
}

// SweetAlert helper funksiyası
const showSwal = (options: any) => {
    return Swal.fire({
        ...swalConfig,
        ...options,
        didOpen: () => {
            const confirmButton = document.querySelector(".swal2-confirm") as HTMLElement
            if (confirmButton) {
                confirmButton.focus()
            }
            if (options.didOpenCustom) {
                options.didOpenCustom()
            }
        },
        willClose: () => {
            if (options.willCloseCustom) {
                options.willCloseCustom()
            }
        },
    })
}

import { FloatingLabelInput } from "@/components/floating-label-input"

interface Supplier {
    id: number
    email: string
    fullName: string | null
    phone: string | null
    tin: string | null
    address: string | null
    gender: string | null
    birthDate: string | null
    active: boolean
    ctype: string
    contactType?: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
    errors?: { [key: string]: string }
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [ignoreDialogClose, setIgnoreDialogClose] = useState(false)

    // Filter states
    const [filterEmail, setFilterEmail] = useState("")
    const [filterFullName, setFilterFullName] = useState("")
    const [filterPhone, setFilterPhone] = useState("")
    const [filterTin, setFilterTin] = useState("")
    const [filterActive, setFilterActive] = useState<string>("all")
    const [filterGender, setFilterGender] = useState<string>("all")
    const [filterBirthDate, setFilterBirthDate] = useState("")
    const [filterCtype, setFilterCtype] = useState<string>("all")

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        phone: "",
        tin: "",
        address: "",
        gender: "",
        birthDate: "",
        active: true,
        ctype: "",
    })

    const [isClient, setIsClient] = useState(false)
    const [hasToken, setHasToken] = useState(false)

    // Helper function to format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Təyin edilməyib"
        try {
            const [year, month, day] = dateString.split("-")
            return `${day}.${month}.${year}`
        } catch (e) {
            console.error("Doğum tarixi formatında xəta:", e)
            return dateString
        }
    }

    const fetchData = useCallback(async (filterParams: Record<string, any> = {}) => {
        if (typeof window === "undefined") {
            setLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Məlumatlar yüklənmədi.")
            setHasToken(false)
            setLoading(false)
            return
        }
        setHasToken(true)
        setLoading(true)
        try {
            console.log("Sending filter params:", filterParams)
            const response = await fetch(`http://localhost:8080/api/suppliers/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Təchizatçıları çəkərkən xəta:", response.status, errorData)
                showSwal({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Təchizatçılar yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                setSuppliers([])
                return
            }
            const data = await response.json()
            console.log("Təchizatçı API cavabı:", data)
            console.log("First supplier data:", data[0])
            setSuppliers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Məlumatları çəkərkən bağlantı xətası:", error)
            showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            setSuppliers([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setIsClient(true)
        const token = localStorage.getItem("token")
        setHasToken(!!token)
    }, [])

    useEffect(() => {
        if (isClient && hasToken) {
            fetchData({})
        }
    }, [isClient, hasToken, fetchData])

    const handleFilter = () => {
        const filterParams: Record<string, any> = {}
        if (filterEmail) filterParams.email = filterEmail
        if (filterFullName) filterParams.fullName = filterFullName
        if (filterPhone) filterParams.phone = filterPhone
        if (filterTin) filterParams.tin = filterTin
        if (filterActive === "true") filterParams.active = true
        if (filterActive === "false") filterParams.active = false
        if (filterGender !== "all") filterParams.gender = filterGender
        if (filterBirthDate) filterParams.birthDate = filterBirthDate
        if (filterCtype !== "all") filterParams.contactType = filterCtype
        console.log("Filtering with params:", filterParams)
        fetchData(filterParams)
    }

    const resetFilters = () => {
        setFilterEmail("")
        setFilterFullName("")
        setFilterPhone("")
        setFilterTin("")
        setFilterActive("all")
        setFilterGender("all")
        setFilterBirthDate("")
        setFilterCtype("all")
        fetchData({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        console.log("Form data before validation:", formData)
        console.log("Editing supplier:", editingSupplier)

        // Validate that fullName is provided
        if (!formData.fullName.trim()) {
            showSwal({
                title: "Xəta!",
                text: "Tam ad daxil edilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        // Validate that phone is provided
        if (!formData.phone.trim()) {
            showSwal({
                title: "Xəta!",
                text: "Telefon nömrəsi daxil edilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        // Validate that ctype is selected
        if (!formData.ctype || formData.ctype.trim() === "") {
            console.log("ContactType validation failed. Current value:", formData.ctype)
            showSwal({
                title: "Xəta!",
                text: "Təchizatçı növü seçilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        setIsSubmittingForm(true)
        try {
            const url = editingSupplier
                ? `http://localhost:8080/api/suppliers/${editingSupplier.id}`
                : "http://localhost:8080/api/suppliers"
            const method = editingSupplier ? "PUT" : "POST"

            // Prepare request body
            const requestBody: any = {
                email: formData.email.trim(),
                fullName: formData.fullName.trim(),
                phone: formData.phone.trim(),
                active: formData.active,
                contactType: formData.ctype,
            }

            // Only include optional fields if they have values
            if (formData.tin && formData.tin.trim()) {
                requestBody.tin = formData.tin.trim()
            }
            if (formData.address && formData.address.trim()) {
                requestBody.address = formData.address.trim()
            }
            if (formData.gender && formData.gender.trim()) {
                requestBody.gender = formData.gender.trim()
            }
            if (formData.birthDate && formData.birthDate.trim()) {
                requestBody.birthDate = formData.birthDate.trim()
            }

            console.log("Request URL:", url)
            console.log("Request method:", method)
            console.log("Request body being sent:", requestBody)

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            })

            let responseData: ApiResponse = {}
            try {
                responseData = await response.json()
            } catch (e) {
                responseData = {}
            }

            console.log("API Response:", response.status, responseData)

            if (response.ok) {
                await showSwal({
                    title: "Uğurlu!",
                    text: editingSupplier ? "Təchizatçı uğurla yeniləndi" : "Təchizatçı uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false)
                resetForm()
                await fetchData({})
            } else {
                let errorMessage = responseData.message || responseData.error || "Əməliyyat uğursuz oldu"
                if (responseData.errors) {
                    const errorMessages = Object.entries(responseData.errors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n")
                    errorMessage = `Aşağıdakı xətalar baş verdi:\n${errorMessages}`
                }
                showSwal({
                    title: "Xəta!",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
            }
        } catch (error) {
            console.error("Network error:", error)
            showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        } finally {
            setIsSubmittingForm(false)
        }
    }

    const fetchSupplierById = useCallback(async (id: number): Promise<Supplier | null> => {
        if (typeof window === "undefined") return null
        const token = localStorage.getItem("token")
        if (!token) return null
        try {
            console.log(`Fetching supplier with ID: ${id}`)
            const response = await fetch(`http://localhost:8080/api/suppliers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const supplier = await response.json()
                console.log("Fetched supplier data:", supplier)
                return supplier
            } else {
                console.error(`Failed to fetch supplier with ID ${id}:`, response.status)
                return null
            }
        } catch (error) {
            console.error(`Error fetching supplier with ID ${id}:`, error)
            return null
        }
    }, [])

    const handleEdit = async (supplier: Supplier) => {
        console.log("Starting edit for supplier:", supplier)
        const fetchedSupplier = await fetchSupplierById(supplier.id)
        if (fetchedSupplier) {
            console.log("Setting editing supplier:", fetchedSupplier)
            setEditingSupplier(fetchedSupplier)

            const newFormData = {
                email: fetchedSupplier.email || "",
                fullName: fetchedSupplier.fullName || "",
                phone: fetchedSupplier.phone || "",
                tin: fetchedSupplier.tin || "",
                address: fetchedSupplier.address || "",
                gender: fetchedSupplier.gender || "",
                birthDate: fetchedSupplier.birthDate || "",
                active: fetchedSupplier.active,
                ctype: fetchedSupplier.ctype || fetchedSupplier.contactType || "",
            }

            console.log("Setting form data:", newFormData)
            setFormData(newFormData)
            setDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "Təchizatçı məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleViewDetails = async (supplier: Supplier) => {
        const fetchedSupplier = await fetchSupplierById(supplier.id)
        if (fetchedSupplier) {
            setSelectedSupplier(fetchedSupplier)
            setDetailsDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "Təchizatçı məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleDelete = async (id: number) => {
        const result = await showSwal({
            title: "Əminsiniz?",
            text: "Bu təchizatçını silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Bəli, sil!",
            cancelButtonText: "Ləğv et",
            reverseButtons: true,
        })
        if (!result.isConfirmed) return
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        setDeletingId(id)
        try {
            const response = await fetch(`http://localhost:8080/api/suppliers/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                await showSwal({
                    title: "Silindi!",
                    text: "Təchizatçı uğurla silindi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                fetchData({})
            } else {
                let responseData: ApiResponse = {}
                try {
                    responseData = await response.json()
                } catch (e) {
                    responseData = { message: "Silmə əməliyyatı uğursuz oldu" }
                }
                showSwal({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Silmə əməliyyatı uğursuz oldu",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
            }
        } catch (error) {
            showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        } finally {
            setDeletingId(null)
        }
    }

    const resetForm = () => {
        console.log("Resetting form")
        setFormData({
            email: "",
            fullName: "",
            phone: "",
            tin: "",
            address: "",
            gender: "",
            birthDate: "",
            active: true,
            ctype: "",
        })
        setEditingSupplier(null)
    }

    useEffect(() => {
        const style = document.createElement("style")
        style.textContent = `
    .swal-container, .swal2-container {
        z-index: 10000 !important;
        position: fixed !important;
    }
    .swal-popup, .swal2-popup {
        z-index: 10001 !important;
        position: relative !important;
    }
    .swal2-backdrop-show {
        z-index: 9999 !important;
    }
    .swal2-confirm, .swal2-cancel, .swal2-deny {
        pointer-events: auto !important;
        cursor: pointer !important;
    }
    .swal2-modal {
        pointer-events: auto !important;
    }
    .swal2-container.swal2-backdrop-show {
        background: rgba(0, 0, 0, 0.4) !important;
    }
`
        document.head.appendChild(style)

        return () => {
            document.head.removeChild(style)
        }
    }, [])

    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Yüklənir...</span>
            </div>
        )
    }

    if (!hasToken) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-96">
                    <CardContent className="p-6 text-center">
                        <h2 className="text-xl font-semibold mb-2">Giriş Tələb Olunur</h2>
                        <p className="mt-2 text-gray-600">Bu səhifəyə daxil olmaq üçün giriş etməlisiniz.</p>
                        <Button onClick={() => (window.location.href = "/login")}>Giriş et</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
                <span className="ml-2">Məlumatlar yüklənir...</span>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Təchizatçılar</h1>
                    <p className="mt-2 text-gray-600">Təchizatçı məlumatlarını idarə edin</p>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(openState) => {
                        if (ignoreDialogClose && !openState) {
                            return
                        }
                        setDialogOpen(openState)
                    }}
                >
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni təchizatçı
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingSupplier ? "Təchizatçını redaktə et" : "Yeni təchizatçı əlavə et"}</DialogTitle>
                            <DialogDescription>Təchizatçı məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="supplier-email"
                                            label="Email *"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="supplier-fullName"
                                            label="Tam ad *"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="supplier-phone"
                                            label="Telefon *"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="supplier-tin"
                                            label="VÖEN"
                                            value={formData.tin}
                                            onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="supplier-address"
                                            label="Ünvan"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-gender">Cins</Label>
                                        <select
                                            id="supplier-gender"
                                            value={formData.gender || ""}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Cins seçin...</option>
                                            <option value="MALE">Kişi</option>
                                            <option value="FEMALE">Qadın</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-birthDate">Doğum tarixi</Label>
                                        <input
                                            id="supplier-birthDate"
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier-ctype">Təchizatçı növü *</Label>
                                        <select
                                            id="supplier-ctype"
                                            value={formData.ctype || ""}
                                            onChange={(e) => {
                                                console.log("ContactType changed to:", e.target.value)
                                                setFormData({ ...formData, ctype: e.target.value })
                                            }}
                                            disabled={isSubmittingForm}
                                            required
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                Təchizatçı növü seçin...
                                            </option>
                                            <option value="INDIVIDUAL">Fərdi</option>
                                            <option value="COMPANY">Şirkət</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={formData.active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        disabled={isSubmittingForm}
                                    />
                                    <Label htmlFor="active">Aktiv</Label>
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
                                    {editingSupplier ? "Yenilə" : "Əlavə et"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Supplier Details Modal */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Təchizatçı Təfərrüatları</DialogTitle>
                        <DialogDescription>{selectedSupplier?.fullName || selectedSupplier?.email}</DialogDescription>
                    </DialogHeader>
                    {selectedSupplier && (
                        <div className="grid gap-6 py-4">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Əsas Məlumatlar</h3>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">ID</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Tam ad</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.fullName || "Təyin edilməyib"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Telefon</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.phone || "Təyin edilməyib"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">VÖEN</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.tin || "Təyin edilməyib"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Ünvan</Label>
                                        <p className="text-sm font-medium">{selectedSupplier.address || "Təyin edilməyib"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Cins</Label>
                                        <p className="text-sm font-medium">
                                            {selectedSupplier.gender === "MALE"
                                                ? "Kişi"
                                                : selectedSupplier.gender === "FEMALE"
                                                    ? "Qadın"
                                                    : "Təyin edilməyib"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Doğum tarixi</Label>
                                        <p className="text-sm font-medium">{formatDate(selectedSupplier.birthDate)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Təchizatçı növü</Label>
                                        <p className="text-sm font-medium">
                                            {selectedSupplier.ctype === "INDIVIDUAL"
                                                ? "Fərdi"
                                                : selectedSupplier.ctype === "COMPANY"
                                                    ? "Şirkət"
                                                    : selectedSupplier.contactType === "INDIVIDUAL"
                                                        ? "Fərdi"
                                                        : selectedSupplier.contactType === "COMPANY"
                                                            ? "Şirkət"
                                                            : "Təyin edilməyib"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                                        <div className="mt-1">
                                            <Badge variant={selectedSupplier.active ? "default" : "secondary"} className="w-fit">
                                                {selectedSupplier.active ? "Aktiv" : "Deaktiv"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                            Bağla
                        </Button>
                        {selectedSupplier && (
                            <Button
                                onClick={() => {
                                    setDetailsDialogOpen(false)
                                    handleEdit(selectedSupplier)
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Redaktə et
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterEmail"
                                    label="Email"
                                    value={filterEmail}
                                    onChange={(e) => setFilterEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterFullName"
                                    label="Tam ad"
                                    value={filterFullName}
                                    onChange={(e) => setFilterFullName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterPhone"
                                    label="Telefon"
                                    value={filterPhone}
                                    onChange={(e) => setFilterPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterTin"
                                    label="VÖEN"
                                    value={filterTin}
                                    onChange={(e) => setFilterTin(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-active">Status</Label>
                                <Select value={filterActive} onValueChange={setFilterActive}>
                                    <SelectTrigger id="filter-active" className="w-full">
                                        <SelectValue placeholder="Status seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        <SelectItem value="true">Aktiv</SelectItem>
                                        <SelectItem value="false">Deaktiv</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-gender">Cins</Label>
                                <select
                                    id="filter-gender"
                                    value={filterGender}
                                    onChange={(e) => setFilterGender(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="all">Hamısı</option>
                                    <option value="MALE">Kişi</option>
                                    <option value="FEMALE">Qadın</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-birthDate">Doğum tarixi</Label>
                                <input
                                    id="filter-birthDate"
                                    type="date"
                                    value={filterBirthDate}
                                    onChange={(e) => setFilterBirthDate(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-ctype">Təchizatçı növü</Label>
                                <select
                                    id="filter-ctype"
                                    value={filterCtype}
                                    onChange={(e) => setFilterCtype(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="all">Hamısı</option>
                                    <option value="INDIVIDUAL">Fərdi</option>
                                    <option value="COMPANY">Şirkət</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={handleFilter} size="icon" title="Filterlə">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button onClick={resetFilters} size="icon" variant="outline" title="Filterləri sıfırla">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Tam ad</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>VÖEN</TableHead>
                                    <TableHead>Təchizatçı növü</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[180px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[150px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[120px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[100px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[80px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[60px]" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-sm text-gray-500">Heç bir təchizatçı tapılmadı</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">{supplier.email}</TableCell>
                                            <TableCell>{supplier.fullName || "Təyin edilməyib"}</TableCell>
                                            <TableCell>{supplier.phone || "Təyin edilməyib"}</TableCell>
                                            <TableCell>{supplier.tin || "Təyin edilməyib"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {supplier.ctype === "INDIVIDUAL"
                                                        ? "Fərdi"
                                                        : supplier.ctype === "COMPANY"
                                                            ? "Şirkət"
                                                            : supplier.contactType === "INDIVIDUAL"
                                                                ? "Fərdi"
                                                                : supplier.contactType === "COMPANY"
                                                                    ? "Şirkət"
                                                                    : "Təyin edilməyib"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={supplier.active ? "default" : "secondary"}>
                                                    {supplier.active ? "Aktiv" : "Deaktiv"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(supplier)}
                                                        disabled={deletingId !== null}
                                                        title="Təfərrüatları gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(supplier)}
                                                        disabled={deletingId !== null}
                                                        title="Redaktə et"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(supplier.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={deletingId === supplier.id}
                                                        title="Sil"
                                                    >
                                                        {deletingId === supplier.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
