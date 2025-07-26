"use client"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input"
import { MultiSelectRoles } from "@/components/multi-select-roles" // Yeni import

interface User {
    id: number
    username: string
    email: string
    fullName: string | null
    phone: string | null
    address: string | null
    gender: string | null
    birthDate: string | null // YYYY-MM-DD formatında
    active: boolean
    photoUrl: string | null
    roles: string[] // Rolları string array kimi fərz edirik
}

interface UserRole {
    // Yeni interfeys
    id: number
    name: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
    errors?: { [key: string]: string } // Backend validasiya xətaları üçün əlavə edildi
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<UserRole[]>([]) // Rolları saxlamaq üçün yeni state
    const [loading, setLoading] = useState(true)
    const [rolesLoading, setRolesLoading] = useState(true) // Rolların yüklənməsi üçün state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null) // State for the selected image file

    // Filter states
    const [filterUsername, setFilterUsername] = useState("")
    const [filterEmail, setFilterEmail] = useState("")
    const [filterFullName, setFilterFullName] = useState("")
    const [filterActive, setFilterActive] = useState<string>("all")
    const [filterGender, setFilterGender] = useState<string>("all") // Yeni gender filter state

    const [formData, setFormData] = useState({
        username: "",
        password: "", // Yalnız yeni istifadəçi əlavə edərkən və ya şifrəni dəyişdirərkən istifadə olunur
        email: "",
        fullName: "",
        phone: "",
        address: "",
        gender: "", // "none" yerinə boş string
        birthDate: "",
        active: true,
        photoUrl: "", // Mövcud şəkil URL-i üçün
        roleIds: [] as number[], // Seçilmiş rolların ID-ləri üçün yeni sahə
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
            return dateString // Fallback to original if parsing fails
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
            // Endpoint 'user-roles' yerine 'roles' olarak değiştirildi
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
            console.log("fetchRoles tamamlandı. rolesLoading:", false, "Rolların sayı:", roles.length) // Diaqnostika
        }
    }, [roles.length]) // roles.length əlavə edildi ki, callback yenilənsin və son dəyəri göstərsin

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
            const usersRes = await fetch(`http://localhost:8080/api/users/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })
            if (!usersRes.ok) {
                const errorData = await usersRes.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("İstifadəçiləri çəkərkən xəta:", usersRes.status, errorData)
                await Swal.fire({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `İstifadəçilər yüklənmədi: Status ${usersRes.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                })
                setUsers([])
                return
            }
            const usersData = await usersRes.json()
            console.log("İstifadəçi API cavabı:", usersData)
            setUsers(Array.isArray(usersData) ? usersData : [])
        } catch (error) {
            console.error("Məlumatları çəkərkən bağlantı xətası:", error)
            await Swal.fire({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
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
            fetchRoles() // Rolları da yüklə
        }
    }, [isClient, hasToken, fetchData, fetchRoles])

    const handleFilter = () => {
        const filterParams: Record<string, any> = {}
        if (filterUsername) filterParams.username = filterUsername
        if (filterEmail) filterParams.email = filterEmail
        if (filterFullName) filterParams.fullName = filterFullName
        if (filterActive === "true") filterParams.active = true
        if (filterActive === "false") filterParams.active = false
        if (filterGender !== "all") filterParams.gender = filterGender // Yeni gender filter əlavə edildi
        console.log("Filtering with params:", filterParams) // Filter üçün göndərilən parametrləri yoxlamaq üçün log
        fetchData(filterParams)
    }

    const resetFilters = () => {
        setFilterUsername("")
        setFilterEmail("")
        setFilterFullName("")
        setFilterActive("all")
        setFilterGender("all") // Gender filter sıfırlandı
        fetchData({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return
        setIsSubmittingForm(true)

        try {
            const url = editingUser ? `http://localhost:8080/api/users/${editingUser.id}` : "http://localhost:8080/api/users"
            const method = editingUser ? "PUT" : "POST"

            const data = new FormData()
            data.append("username", formData.username)
            data.append("email", formData.email)
            data.append("active", String(formData.active))

            if (formData.password) data.append("password", formData.password) // Şifrə yalnız daxil edildikdə göndərilir
            if (formData.fullName) data.append("fullName", formData.fullName)
            if (formData.phone) data.append("phone", formData.phone)
            if (formData.address) data.append("address", formData.address)
            if (formData.gender) data.append("gender", formData.gender) // Gender boş string olarsa göndərilməyəcək
            if (formData.birthDate) data.append("birthDate", formData.birthDate)

            // Rolları FormData-ya əlavə et
            formData.roleIds.forEach((roleId) => {
                data.append("roleIds", String(roleId))
            })

            if (imageFile) {
                data.append("photo", imageFile) // Şəkil faylı
            } else if (editingUser && formData.photoUrl) {
                data.append("photoUrl", formData.photoUrl) // Mövcud şəkil URL-i
            } else if (editingUser && !formData.photoUrl && !imageFile) {
                data.append("photoUrl", "") // Şəkil silinibsə
            }

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    // FormData istifadə edərkən Content-Type təyin etməyin
                },
                body: data,
            })

            let responseData: ApiResponse = {}
            try {
                responseData = await response.json()
            } catch (e) {
                responseData = {} // JSON parse xətası olarsa boş obyekt
            }

            if (response.ok) {
                await Swal.fire({
                    title: "Uğurlu!",
                    text: editingUser ? "İstifadəçi uğurla yeniləndi" : "İstifadəçi uğurla əlavə edildi",
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

                // Backenddən gələn 'errors' obyektini yoxlayırıq
                if (responseData.errors) {
                    const errorMessages = Object.entries(responseData.errors)
                        .map(([key, value]) => {
                            // 'roleIds' xətası üçün xüsusi mesaj
                            if (key === "roleIds") {
                                return `Rollar: ${value}`
                            }
                            // Digər xətalar üçün ümumi format
                            return `${key}: ${value}`
                        })
                        .join("\n") // Hər xətanı yeni sətirdə göstəririk
                    errorMessage = `Aşağıdakı xətalar baş verdi:\n${errorMessages}`
                }

                await Swal.fire({
                    title: "Xəta!",
                    text: errorMessage,
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
            // Rolların adlarını ID-lərə çevir
            const selectedRoleIds = fetchedUser.roles
                .map((roleName) => roles.find((r) => r.name === roleName)?.id)
                .filter((id): id is number => id !== undefined)

            setEditingUser(fetchedUser)
            setFormData({
                username: fetchedUser.username,
                password: "", // Şifrəni redaktə zamanı boş saxlayırıq, dəyişmək istəyirsə yenidən daxil etməlidir
                email: fetchedUser.email,
                fullName: fetchedUser.fullName || "",
                phone: fetchedUser.phone || "",
                address: fetchedUser.address || "",
                gender: fetchedUser.gender || "", // Boş string olaraq saxlayırıq
                birthDate: fetchedUser.birthDate || "",
                active: fetchedUser.active,
                photoUrl: fetchedUser.photoUrl || "",
                roleIds: selectedRoleIds, // Seçilmiş rolların ID-lərini təyin et
            })
            setImageFile(null) // Yeni fayl seçimini təmizlə
            setDialogOpen(true)
        } else {
            await Swal.fire({
                title: "Xəta!",
                text: "İstifadəçi məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
        }
    }

    const handleViewDetails = async (user: User) => {
        const fetchedUser = await fetchUserById(user.id)
        if (fetchedUser) {
            setSelectedUser(fetchedUser)
            setDetailsDialogOpen(true)
        } else {
            await Swal.fire({
                title: "Xəta!",
                text: "İstifadəçi məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
        }
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
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
                await Swal.fire({
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
        setFormData({
            username: "",
            password: "",
            email: "",
            fullName: "",
            phone: "",
            address: "",
            gender: "", // Boş string olaraq saxlayırıq
            birthDate: "",
            active: true,
            photoUrl: "",
            roleIds: [], // Rolları sıfırla
        })
        setImageFile(null)
        setEditingUser(null)
    }

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

    // Ana yüklənmə göstəricisi
    if (loading || rolesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-black" />
                <span className="ml-2">Məlumatlar yüklənir...</span> {/* Yazı geri qaytarıldı */}
            </div>
        )
    }

    console.log("MultiSelectRoles disabled state:", isSubmittingForm || rolesLoading) // Diaqnostika
    console.log("Current roles array:", roles) // Diaqnostika

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">İstifadəçilər</h1>
                    <p className="mt-2 text-gray-600">İstifadəçi məlumatlarını idarə edin</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                                {/* Basic Information */}
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
                                            required={!editingUser} // Yalnız yeni istifadəçi üçün məcburi
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
                                        <Label>Cins</Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                            disabled={isSubmittingForm}
                                        >
                                            <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                                <SelectValue placeholder="Cins seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                                <SelectItem value="MALE">Kişi</SelectItem>
                                                <SelectItem value="FEMALE">Qadın</SelectItem>
                                            </SelectContent>
                                        </Select>
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

                                {/* Roles Multi-Select */}
                                <div className="space-y-2">
                                    <Label>Rollar</Label>
                                    <MultiSelectRoles
                                        options={roles}
                                        selected={formData.roleIds}
                                        onSelect={(selectedIds) => setFormData({ ...formData, roleIds: selectedIds })}
                                        disabled={isSubmittingForm || rolesLoading}
                                        maxSelection={5}
                                        placeholder="Rollar seçin (maks. 5)"
                                    />
                                </div>

                                {/* Photo Upload */}
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

                                {/* Active Status */}
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
                                                    <Badge variant="outline">Yoxdur</Badge>
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
                        {/* Filter inputs */}
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
                                <Label>Status</Label>
                                <Select value={filterActive} onValueChange={setFilterActive}>
                                    <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                        <SelectValue placeholder="Status seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        <SelectItem value="true">Aktiv</SelectItem>
                                        <SelectItem value="false">Deaktiv</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Filter Section - Gender filter */}
                            <div className="space-y-2">
                                <Label>Cins</Label>
                                <Select value={filterGender} onValueChange={setFilterGender}>
                                    <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                        <SelectValue placeholder="Cins seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        <SelectItem value="MALE">Kişi</SelectItem>
                                        <SelectItem value="FEMALE">Qadın</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Filter and Reset buttons */}
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
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            <p className="mt-2 text-sm text-gray-500">Məlumatlar yüklənir...</p> {/* Yazı geri qaytarıldı */}
                                        </TableCell>
                                    </TableRow>
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
                                            <TableCell>{user.fullName || "N/A"}</TableCell>
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
