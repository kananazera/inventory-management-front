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
import { Skeleton } from "@/components/ui/skeleton" // Skeleton komponenti import edildi

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
            // Ensure the modal is properly focused
            const confirmButton = document.querySelector(".swal2-confirm") as HTMLElement
            if (confirmButton) {
                confirmButton.focus()
            }
            // Call custom didOpen if provided
            if (options.didOpenCustom) {
                options.didOpenCustom()
            }
        },
        willClose: () => {
            // Call custom willClose if provided
            if (options.willCloseCustom) {
                options.willCloseCustom()
            }
        },
    })
}

import { FloatingLabelInput } from "@/components/floating-label-input"
import { MultiSelectRoles } from "@/components/multi-select-roles"

interface User {
    id: number
    username: string
    email: string
    fullName: string | null
    phone: string | null
    address: string | null
    gender: string | null
    birthDate: string | null
    active: boolean
    photoUrl: string | null
    roles: string[]
}

interface UserRole {
    id: number
    name: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
    errors?: { [key: string]: string }
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<UserRole[]>([])
    const [loading, setLoading] = useState(true)
    const [rolesLoading, setRolesLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [ignoreDialogClose, setIgnoreDialogClose] = useState(false) // New state for ignoring dialog close

    // Filter states
    const [filterUsername, setFilterUsername] = useState("")
    const [filterEmail, setFilterEmail] = useState("")
    const [filterFullName, setFilterFullName] = useState("")
    const [filterPhone, setFilterPhone] = useState("")
    const [filterActive, setFilterActive] = useState<string>("all")
    const [filterGender, setFilterGender] = useState<string>("all")
    const [filterBirthDate, setFilterBirthDate] = useState("")
    const [filterRoles, setFilterRoles] = useState<number[]>([])

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        fullName: "",
        phone: "",
        address: "",
        gender: "",
        birthDate: "",
        active: true,
        photoUrl: "",
        roles: [] as number[], // Changed from roleIds to roles
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

    const fetchRoles = useCallback(async () => {
        if (typeof window === "undefined") {
            setRolesLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Rollar yüklənmədi.")
            setRolesLoading(false)
            return
        }
        setRolesLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/roles/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Rollar çəkərkən xəta:", response.status, errorData)
                setRoles([])
                return
            }
            const data = await response.json()
            console.log("Rollar API cavabı:", data)
            setRoles(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Rollar çəkərkən bağlantı xətası:", error)
            setRoles([])
        } finally {
            setRolesLoading(false)
        }
    }, [])

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
            const response = await fetch(`http://localhost:8080/api/users/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("İstifadəçiləri çəkərkən xəta:", response.status, errorData)
                showSwal({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `İstifadəçilər yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false, // Override default for errors
                    allowEscapeKey: false, // Override default for errors
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                setUsers([])
                return
            }
            const data = await response.json()
            console.log("İstifadəçi API cavabı:", data)
            setUsers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Məlumatları çəkərkən bağlantı xətası:", error)
            showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            setUsers([])
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
            fetchRoles()
        }
    }, [isClient, hasToken, fetchData, fetchRoles])

    const handleFilter = () => {
        const filterParams: Record<string, any> = {}
        if (filterUsername) filterParams.username = filterUsername
        if (filterEmail) filterParams.email = filterEmail
        if (filterFullName) filterParams.fullName = filterFullName
        if (filterPhone) filterParams.phone = filterPhone
        if (filterActive === "true") filterParams.active = true
        if (filterActive === "false") filterParams.active = false
        if (filterGender !== "all") filterParams.gender = filterGender
        if (filterBirthDate) filterParams.birthDate = filterBirthDate
        if (filterRoles.length > 0) filterParams.roles = filterRoles
        console.log("Filtering with params:", filterParams)
        fetchData(filterParams)
    }

    const resetFilters = () => {
        setFilterUsername("")
        setFilterEmail("")
        setFilterFullName("")
        setFilterPhone("")
        setFilterActive("all")
        setFilterGender("all")
        setFilterBirthDate("")
        setFilterRoles([])
        fetchData({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        // Validate that at least one role is selected
        if (formData.roles.length === 0) {
            showSwal({
                title: "Xəta!",
                text: "Ən azı bir rol seçilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        setIsSubmittingForm(true)
        try {
            const url = editingUser ? `http://localhost:8080/api/users/${editingUser.id}` : "http://localhost:8080/api/users"
            const method = editingUser ? "PUT" : "POST"
            const data = new FormData()

            data.append("username", formData.username)
            data.append("email", formData.email)
            data.append("active", String(formData.active))

            if (formData.password) data.append("password", formData.password)
            if (formData.fullName) data.append("fullName", formData.fullName)
            if (formData.phone) data.append("phone", formData.phone)
            if (formData.address) data.append("address", formData.address)
            if (formData.gender) data.append("gender", formData.gender)
            if (formData.birthDate) data.append("birthDate", formData.birthDate)

            // Changed from roleIds to roles
            formData.roles.forEach((roleId) => {
                data.append("roles", String(roleId))
            })

            if (imageFile) {
                data.append("photo", imageFile)
            } else if (editingUser && formData.photoUrl) {
                data.append("photoUrl", formData.photoUrl)
            } else if (editingUser && !formData.photoUrl && !imageFile) {
                data.append("photoUrl", "")
            }

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data,
            })

            let responseData: ApiResponse = {}
            try {
                responseData = await response.json()
            } catch (e) {
                responseData = {}
            }

            if (response.ok) {
                await showSwal({
                    title: "Uğurlu!",
                    text: editingUser ? "İstifadəçi uğurla yeniləndi" : "İstifadəçi uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false) // This closes the main dialog ONLY on success
                resetForm()
                await fetchData({})
            } else {
                let errorMessage = responseData.message || responseData.error || "Əməliyyat uğursuz oldu"
                if (responseData.errors) {
                    const errorMessages = Object.entries(responseData.errors)
                        .map(([key, value]) => {
                            // Updated to handle "roles" instead of "roleIds"
                            if (key === "roles") {
                                return `Rollar: ${value}`
                            }
                            return `${key}: ${value}`
                        })
                        .join("\n")
                    errorMessage = `Aşağıdakı xətalar baş verdi:\n${errorMessages}`
                }
                showSwal({
                    title: "Xəta!",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false, // Override default for errors
                    allowEscapeKey: false, // Override default for errors
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
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        } finally {
            setIsSubmittingForm(false)
        }
    }

    const fetchUserById = useCallback(async (id: number): Promise<User | null> => {
        if (typeof window === "undefined") return null
        const token = localStorage.getItem("token")
        if (!token) return null
        try {
            const response = await fetch(`http://localhost:8080/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                return await response.json()
            } else {
                console.error(`Failed to fetch user with ID ${id}:`, response.status)
                return null
            }
        } catch (error) {
            console.error(`Error fetching user with ID ${id}:`, error)
            return null
        }
    }, [])

    const handleEdit = async (user: User) => {
        const fetchedUser = await fetchUserById(user.id)
        if (fetchedUser) {
            const selectedRoles = fetchedUser.roles
                .map((roleName) => roles.find((r) => r.name === roleName)?.id)
                .filter((id): id is number => id !== undefined)

            console.log("Fetched user roles:", fetchedUser.roles)
            console.log("Available roles:", roles)
            console.log("Selected role IDs:", selectedRoles)

            setEditingUser(fetchedUser)
            setFormData({
                username: fetchedUser.username,
                password: "",
                email: fetchedUser.email,
                fullName: fetchedUser.fullName || "",
                phone: fetchedUser.phone || "",
                address: fetchedUser.address || "",
                gender: fetchedUser.gender || "",
                birthDate: fetchedUser.birthDate || "",
                active: fetchedUser.active,
                photoUrl: fetchedUser.photoUrl || "",
                roles: selectedRoles, // Changed from roleIds to roles
            })
            setImageFile(null)
            setDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "İstifadəçi məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleViewDetails = async (user: User) => {
        const fetchedUser = await fetchUserById(user.id)
        if (fetchedUser) {
            console.log("User details - roles:", fetchedUser.roles)
            setSelectedUser(fetchedUser)
            setDetailsDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "İstifadəçi məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleDelete = async (id: number) => {
        const result = await showSwal({
            title: "Əminsiniz?",
            text: "Bu istifadəçini silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
            const response = await fetch(`http://localhost:8080/api/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                await showSwal({
                    title: "Silindi!",
                    text: "İstifadəçi uğurla silindi",
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
                    allowOutsideClick: false, // Override default for errors
                    allowEscapeKey: false, // Override default for errors
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
                allowOutsideClick: false, // Override default for errors
                allowEscapeKey: false, // Override default for errors
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        } finally {
            setDeletingId(null)
        }
    }

    const resetForm = () => {
        setFormData({
            username: "",
            password: "",
            email: "",
            fullName: "",
            phone: "",
            address: "",
            gender: "",
            birthDate: "",
            active: true,
            photoUrl: "",
            roles: [], // Changed from roleIds to roles
        })
        setImageFile(null)
        setEditingUser(null)
    }

    useEffect(() => {
        // SweetAlert CSS stilləri
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

    // Initial full-page loading for data and roles
    if (loading && rolesLoading) {
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
                    <h1 className="text-3xl font-bold text-gray-900">İstifadəçilər</h1>
                    <p className="mt-2 text-gray-600">İstifadəçi məlumatlarını idarə edin</p>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(openState) => {
                        // Only update dialogOpen if we are not ignoring a close event
                        if (ignoreDialogClose && !openState) {
                            return // Ignore this close event
                        }
                        setDialogOpen(openState)
                    }}
                >
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni istifadəçi
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingUser ? "İstifadəçini redaktə et" : "Yeni istifadəçi əlavə et"}</DialogTitle>
                            <DialogDescription>İstifadəçi məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="user-username"
                                            label="İstifadəçi adı *"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="user-email"
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
                                            id="user-password"
                                            label={editingUser ? "Şifrə (dəyişmək üçün daxil edin)" : "Şifrə *"}
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="user-fullName"
                                            label="Tam ad"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="user-phone"
                                            label="Telefon"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FloatingLabelInput
                                            id="user-address"
                                            label="Ünvan"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user-gender">Cins</Label>
                                        <select
                                            id="user-gender"
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
                                        <Label htmlFor="user-birthDate">Doğum tarixi</Label>
                                        <input
                                            id="user-birthDate"
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rollar *</Label>
                                    <MultiSelectRoles
                                        options={roles}
                                        selected={formData.roles} // Changed from roleIds to roles
                                        onSelect={(selectedIds) => setFormData({ ...formData, roles: selectedIds })} // Changed from roleIds to roles
                                        disabled={isSubmittingForm || rolesLoading}
                                        maxSelection={5}
                                        placeholder="Rollar seçin (Ən az 1, Ən çox 5)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-photo">Şəkil</Label>
                                    <input
                                        id="user-photo"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setImageFile(e.target.files[0])
                                            } else {
                                                setImageFile(null)
                                            }
                                        }}
                                        disabled={isSubmittingForm}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {(imageFile || formData.photoUrl) && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground mb-1">Cari Şəkil:</p>
                                            <img
                                                src={
                                                    imageFile ? URL.createObjectURL(imageFile) : formData.photoUrl || "/images/no-user-photo.png"
                                                }
                                                alt="User Photo Preview"
                                                className="w-24 h-24 object-cover rounded-md border"
                                            />
                                            {imageFile && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setImageFile(null)}
                                                    className="mt-1 text-red-500 hover:text-red-600"
                                                >
                                                    Şəkli sil
                                                </Button>
                                            )}
                                        </div>
                                    )}
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
                                    {editingUser ? "Yenilə" : "Əlavə et"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* User Details Modal */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>İstifadəçi Təfərrüatları</DialogTitle>
                        <DialogDescription>{selectedUser?.fullName || selectedUser?.username} məlumatları</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Əsas Məlumatlar</h3>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">ID</Label>
                                            <p className="text-sm font-medium">{selectedUser.id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">İstifadəçi adı</Label>
                                            <p className="text-sm font-medium">{selectedUser.username}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Email</Label>
                                            <p className="text-sm font-medium">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Tam ad</Label>
                                            <p className="text-sm font-medium">{selectedUser.fullName || "Təyin edilməyib"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Telefon</Label>
                                            <p className="text-sm font-medium">{selectedUser.phone || "Təyin edilməyib"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ünvan</Label>
                                            <p className="text-sm font-medium">{selectedUser.address || "Təyin edilməyib"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Cins</Label>
                                            <p className="text-sm font-medium">
                                                {selectedUser.gender === "MALE"
                                                    ? "Kişi"
                                                    : selectedUser.gender === "FEMALE"
                                                        ? "Qadın"
                                                        : "Təyin edilməyib"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Doğum tarixi</Label>
                                            <p className="text-sm font-medium">{formatDate(selectedUser.birthDate)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                                            <div className="mt-1">
                                                <Badge variant={selectedUser.active ? "default" : "secondary"} className="w-fit">
                                                    {selectedUser.active ? "Aktiv" : "Deaktiv"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-gray-500">Rollar</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                                                    selectedUser.roles.map((role, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {role}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline">Rol təyin edilməyib</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Şəkil</h3>
                                    </CardHeader>
                                    <CardContent>
                                        <img
                                            src={selectedUser.photoUrl || "/images/no-user-photo.png"}
                                            alt={selectedUser.fullName || selectedUser.username}
                                            width={200}
                                            height={200}
                                            className="w-full h-48 object-contain rounded-md border"
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                            Bağla
                        </Button>
                        {selectedUser && (
                            <Button
                                onClick={() => {
                                    setDetailsDialogOpen(false)
                                    handleEdit(selectedUser)
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
                                    id="filterUsername"
                                    label="İstifadəçi adı"
                                    value={filterUsername}
                                    onChange={(e) => setFilterUsername(e.target.value)}
                                />
                            </div>
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
                                <Label>Rollar</Label>
                                <MultiSelectRoles
                                    options={roles}
                                    selected={filterRoles}
                                    onSelect={(selectedIds) => setFilterRoles(selectedIds)}
                                    disabled={rolesLoading}
                                    maxSelection={10}
                                    placeholder="Rollar seçin..."
                                />
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
                                    <TableHead className="w-[80px]">Şəkil</TableHead>
                                    <TableHead>İstifadəçi adı</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Tam ad</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Skeleton rows for loading state
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-16 w-16 rounded-md" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[120px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[180px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[150px]" />
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
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-sm text-gray-500">Heç bir istifadəçi tapılmadı</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <img
                                                    src={user.photoUrl || "/images/no-user-photo.png"}
                                                    alt={user.username}
                                                    width={64}
                                                    height={64}
                                                    className="aspect-square rounded-md object-cover"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.fullName || "Təyin edilməyib"}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.active ? "default" : "secondary"}>
                                                    {user.active ? "Aktiv" : "Deaktiv"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(user)}
                                                        disabled={deletingId !== null}
                                                        title="Təfərrüatları gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                        disabled={deletingId !== null}
                                                        title="Redaktə et"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(user.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={deletingId === user.id}
                                                        title="Sil"
                                                    >
                                                        {deletingId === user.id ? (
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
