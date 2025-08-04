"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { Eye, Search, RotateCcw, Plus, Edit, Trash2, Loader2, FileText, Download, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Swal from "sweetalert2"
import { Skeleton } from "@/components/ui/skeleton"
import { FloatingLabelInput } from "@/components/floating-label-input"
import { Textarea } from "@/components/ui/textarea"

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

interface ContractFile {
    id: number
    fileName: string
    fileUrl: string
}

interface Contract {
    id: number
    title: string
    description: string | null
    startDate: string
    endDate: string
    supplierFullName: string | null // Backend-dən gələn sahə adı
    customerFullName: string | null // Backend-dən gələn sahə adı
    supplierId: number | null
    customerId: number | null
    files: ContractFile[]
}

interface Supplier {
    id: number
    fullName: string
}

interface Customer {
    id: number
    fullName: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
    errors?: { [key: string]: string }
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [suppliersLoading, setSuppliersLoading] = useState(true)
    const [customersLoading, setCustomersLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [filesDialogOpen, setFilesDialogOpen] = useState(false)
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
    const [editingContract, setEditingContract] = useState<Contract | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [contractFiles, setContractFiles] = useState<File[]>([])
    const [ignoreDialogClose, setIgnoreDialogClose] = useState(false)
    const [deletingFileId, setDeletingFileId] = useState<number | null>(null)
    const [uploadingFiles, setUploadingFiles] = useState(false)

    // Filter states
    const [filterTitle, setFilterTitle] = useState("")
    const [filterSupplierId, setFilterSupplierId] = useState<string>("none")
    const [filterCustomerId, setFilterCustomerId] = useState<string>("none")
    const [filterStartDateFrom, setFilterStartDateFrom] = useState("")
    const [filterStartDateTo, setFilterStartDateTo] = useState("")

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        supplierId: null as number | null,
        customerId: null as number | null,
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
            console.error("Tarix formatında xəta:", e)
            return dateString
        }
    }

    // Helper function to get supplier display name
    const getSupplierDisplayName = (supplierFullName: string | null) => {
        return supplierFullName || "Müqavilə təchizatçı üçün deyil"
    }

    // Helper function to get customer display name
    const getCustomerDisplayName = (customerFullName: string | null) => {
        return customerFullName || "Müqavilə müştəri üçün deyil"
    }

    // Təchizatçıları endpoint-dən götürən funksiya
    const fetchSuppliers = useCallback(async () => {
        if (typeof window === "undefined") {
            setSuppliersLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Təchizatçılar yüklənmədi.")
            setSuppliersLoading(false)
            return
        }

        setSuppliersLoading(true)
        try {
            // Təchizatçılar endpoint-i
            const response = await fetch(`http://localhost:8080/api/suppliers/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}), // Boş filter - bütün təchizatçıları gətir
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Təchizatçıları çəkərkən xəta:", response.status, errorData)
                setSuppliers([])
                return
            }

            const data = await response.json()
            console.log("Təchizatçılar yükləndi:", data) // Debug üçün
            setSuppliers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Təchizatçıları çəkərkən bağlantı xətası:", error)
            setSuppliers([])
        } finally {
            setSuppliersLoading(false)
        }
    }, [])

    // Müştəriləri endpoint-dən götürən funksiya
    const fetchCustomers = useCallback(async () => {
        if (typeof window === "undefined") {
            setCustomersLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Müştərilər yüklənmədi.")
            setCustomersLoading(false)
            return
        }

        setCustomersLoading(true)
        try {
            // Müştərilər endpoint-i
            const response = await fetch(`http://localhost:8080/api/customers/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}), // Boş filter - bütün müştəriləri gətir
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Müştəriləri çəkərkən xəta:", response.status, errorData)
                setCustomers([])
                return
            }

            const data = await response.json()
            console.log("Müştərilər yükləndi:", data) // Debug üçün
            setCustomers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Müştəriləri çəkərkən bağlantı xətası:", error)
            setCustomers([])
        } finally {
            setCustomersLoading(false)
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
            const response = await fetch(`http://localhost:8080/api/contracts/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Müqavilələri çəkərkən xəta:", response.status, errorData)
                showSwal({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Müqavilələr yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                setContracts([])
                return
            }

            const data = await response.json()
            console.log("Müqavilələr yükləndi:", data) // Debug üçün - backend cavabını görmək üçün
            setContracts(Array.isArray(data) ? data : [])
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
            setContracts([])
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
            // Səhifə yükləndikdə bütün məlumatları yüklə
            fetchData({})
            fetchSuppliers() // Təchizatçıları endpoint-dən yüklə
            fetchCustomers() // Müştəriləri endpoint-dən yüklə
        }
    }, [isClient, hasToken, fetchData, fetchSuppliers, fetchCustomers])

    const handleFilter = () => {
        const filterParams: Record<string, any> = {}
        if (filterTitle) filterParams.title = filterTitle
        if (filterSupplierId !== "none") filterParams.supplierId = Number.parseInt(filterSupplierId)
        if (filterCustomerId !== "none") filterParams.customerId = Number.parseInt(filterCustomerId)
        if (filterStartDateFrom) filterParams.startDateFrom = filterStartDateFrom
        if (filterStartDateTo) filterParams.startDateTo = filterStartDateTo

        console.log("Filtering with params:", filterParams)
        fetchData(filterParams)
    }

    const resetFilters = () => {
        setFilterTitle("")
        setFilterSupplierId("none")
        setFilterCustomerId("none")
        setFilterStartDateFrom("")
        setFilterStartDateTo("")
        fetchData({})
    }

    const validateFiles = (files: File[]): string | null => {
        for (const file of files) {
            const fileName = file.name.toLowerCase()
            if (!fileName.endsWith(".pdf") && !fileName.endsWith(".docx")) {
                return `Yalnız PDF və DOCX faylları qəbul edilir: ${file.name}`
            }
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        // Validate that either supplier or customer is selected
        if (!formData.supplierId && !formData.customerId) {
            showSwal({
                title: "Xəta!",
                text: "Təchizatçı və ya müştəri seçilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        // Validate files
        if (contractFiles.length > 0) {
            const fileError = validateFiles(contractFiles)
            if (fileError) {
                showSwal({
                    title: "Xəta!",
                    text: fileError,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                return
            }
        }

        setIsSubmittingForm(true)
        try {
            const url = editingContract
                ? `http://localhost:8080/api/contracts/${editingContract.id}`
                : "http://localhost:8080/api/contracts"
            const method = editingContract ? "PUT" : "POST"

            const data = new FormData()
            // Add contract data as JSON
            const contractData = {
                title: formData.title,
                description: formData.description || null,
                startDate: formData.startDate,
                endDate: formData.endDate,
                supplierId: formData.supplierId,
                customerId: formData.customerId,
            }
            data.append("contract", new Blob([JSON.stringify(contractData)], { type: "application/json" }))

            // Add files
            contractFiles.forEach((file) => {
                data.append("files", file)
            })

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
                    text: editingContract ? "Müqavilə uğurla yeniləndi" : "Müqavilə uğurla əlavə edildi",
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

    const fetchContractById = useCallback(async (id: number): Promise<Contract | null> => {
        if (typeof window === "undefined") return null
        const token = localStorage.getItem("token")
        if (!token) return null

        try {
            const response = await fetch(`http://localhost:8080/api/contracts/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const contract = await response.json()
                console.log("Tək müqavilə yükləndi:", contract) // Debug üçün
                return contract
            } else {
                console.error(`Failed to fetch contract with ID ${id}:`, response.status)
                return null
            }
        } catch (error) {
            console.error(`Error fetching contract with ID ${id}:`, error)
            return null
        }
    }, [])

    const handleEdit = async (contract: Contract) => {
        const fetchedContract = await fetchContractById(contract.id)
        if (fetchedContract) {
            setEditingContract(fetchedContract)
            setFormData({
                title: fetchedContract.title,
                description: fetchedContract.description || "",
                startDate: fetchedContract.startDate,
                endDate: fetchedContract.endDate,
                supplierId: fetchedContract.supplierId,
                customerId: fetchedContract.customerId,
            })
            setContractFiles([])
            setDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "Müqavilə məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleViewDetails = async (contract: Contract) => {
        const fetchedContract = await fetchContractById(contract.id)
        if (fetchedContract) {
            setSelectedContract(fetchedContract)
            setDetailsDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "Müqavilə məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
        }
    }

    const handleViewFiles = async (contract: Contract) => {
        const fetchedContract = await fetchContractById(contract.id)
        if (fetchedContract) {
            setSelectedContract(fetchedContract)
            setFilesDialogOpen(true)
        } else {
            showSwal({
                title: "Xəta!",
                text: "Müqavilə məlumatları yüklənə bilmədi.",
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
            text: "Bu müqaviləni silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
            const response = await fetch(`http://localhost:8080/api/contracts/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                await showSwal({
                    title: "Silindi!",
                    text: "Müqavilə uğurla silindi",
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

    const handleDeleteFile = async (fileId: number) => {
        const result = await showSwal({
            title: "Əminsiniz?",
            text: "Bu faylı silmək istədiyinizə əminsiniz?",
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

        setDeletingFileId(fileId)
        try {
            const response = await fetch(`http://localhost:8080/api/contracts/files/${fileId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                await showSwal({
                    title: "Silindi!",
                    text: "Fayl uğurla silindi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                // Refresh the selected contract
                if (selectedContract) {
                    const updatedContract = await fetchContractById(selectedContract.id)
                    if (updatedContract) {
                        setSelectedContract(updatedContract)
                    }
                }
                fetchData({})
            } else {
                let responseData: ApiResponse = {}
                try {
                    responseData = await response.json()
                } catch (e) {
                    responseData = { message: "Fayl silmə əməliyyatı uğursuz oldu" }
                }
                showSwal({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Fayl silmə əməliyyatı uğursuz oldu",
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
            setDeletingFileId(null)
        }
    }

    const handleAddFiles = async (contractId: number, files: File[]) => {
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        const fileError = validateFiles(files)
        if (fileError) {
            showSwal({
                title: "Xəta!",
                text: fileError,
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        setUploadingFiles(true)
        try {
            const data = new FormData()
            files.forEach((file) => {
                data.append("files", file)
            })

            const response = await fetch(`http://localhost:8080/api/contracts/${contractId}/files`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: data,
            })

            if (response.ok) {
                await showSwal({
                    title: "Uğurlu!",
                    text: "Fayllar uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                // Refresh the selected contract
                if (selectedContract) {
                    const updatedContract = await fetchContractById(selectedContract.id)
                    if (updatedContract) {
                        setSelectedContract(updatedContract)
                    }
                }
                fetchData({})
            } else {
                let responseData: ApiResponse = {}
                try {
                    responseData = await response.json()
                } catch (e) {
                    responseData = { message: "Fayl əlavə etmə əməliyyatı uğursuz oldu" }
                }
                showSwal({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Fayl əlavə etmə əməliyyatı uğursuz oldu",
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
            setUploadingFiles(false)
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            startDate: "",
            endDate: "",
            supplierId: null,
            customerId: null,
        })
        setContractFiles([])
        setEditingContract(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            setContractFiles(files)
        }
    }

    const removeFile = (index: number) => {
        setContractFiles((prev) => prev.filter((_, i) => i !== index))
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
    }`
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

    if (loading && suppliersLoading && customersLoading) {
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
                    <h1 className="text-3xl font-bold text-gray-900">Müqavilələr</h1>
                    <p className="mt-2 text-gray-600">Müqavilə məlumatlarını idarə edin</p>
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
                            Yeni müqavilə
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingContract ? "Müqaviləni redaktə et" : "Yeni müqavilə əlavə et"}</DialogTitle>
                            <DialogDescription>Müqavilə məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 py-4">
                                {/* Title - Full Width */}
                                <div className="space-y-2">
                                    <FloatingLabelInput
                                        id="contract-title"
                                        label="Başlıq *"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        disabled={isSubmittingForm}
                                    />
                                </div>

                                {/* Supplier and Customer - Side by Side */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-supplier">Təchizatçı</Label>
                                        <Select
                                            value={formData.supplierId?.toString() || "none"}
                                            onValueChange={(value) => {
                                                const supplierId = value !== "none" ? Number.parseInt(value) : null
                                                setFormData({
                                                    ...formData,
                                                    supplierId,
                                                    customerId: supplierId ? null : formData.customerId,
                                                })
                                            }}
                                            disabled={isSubmittingForm || suppliersLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Təchizatçı seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Təchizatçı seçin...</SelectItem>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                        {supplier.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {suppliersLoading && <p className="text-sm text-gray-500">Təchizatçılar yüklənir...</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-customer">Müştəri</Label>
                                        <Select
                                            value={formData.customerId?.toString() || "none"}
                                            onValueChange={(value) => {
                                                const customerId = value !== "none" ? Number.parseInt(value) : null
                                                setFormData({
                                                    ...formData,
                                                    customerId,
                                                    supplierId: customerId ? null : formData.supplierId,
                                                })
                                            }}
                                            disabled={isSubmittingForm || customersLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Müştəri seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Müştəri seçin...</SelectItem>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {customersLoading && <p className="text-sm text-gray-500">Müştərilər yüklənir...</p>}
                                    </div>
                                </div>

                                {/* Dates - Side by Side */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-startDate">Başlama tarixi *</Label>
                                        <input
                                            id="contract-startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract-endDate">Bitmə tarixi</Label>
                                        <input
                                            id="contract-endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Description - Full Width */}
                                <div className="space-y-2">
                                    <Label htmlFor="contract-description">Təsvir</Label>
                                    <Textarea
                                        id="contract-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={isSubmittingForm}
                                        rows={3}
                                        placeholder="Müqavilə təsviri..."
                                    />
                                </div>

                                {/* Files - Full Width */}
                                <div className="space-y-2">
                                    <Label htmlFor="contract-files">Fayllar (PDF, DOCX)</Label>
                                    <input
                                        id="contract-files"
                                        type="file"
                                        accept=".pdf,.docx"
                                        multiple
                                        onChange={handleFileChange}
                                        disabled={isSubmittingForm}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {contractFiles.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            <p className="text-sm text-muted-foreground">Seçilmiş fayllar:</p>
                                            {contractFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span className="text-sm">{file.name}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(index)}
                                                        disabled={isSubmittingForm}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                    {editingContract ? "Yenilə" : "Əlavə et"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Contract Details Modal */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Müqavilə Təfərrüatları</DialogTitle>
                        <DialogDescription>{selectedContract?.title} məlumatları</DialogDescription>
                    </DialogHeader>
                    {selectedContract && (
                        <div className="grid gap-6 py-4">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Əsas Məlumatlar</h3>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">ID</Label>
                                        <p className="text-sm font-medium">{selectedContract.id}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Başlıq</Label>
                                        <p className="text-sm font-medium">{selectedContract.title}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Təsvir</Label>
                                        <p className="text-sm font-medium">{selectedContract.description || "Təyin edilməyib"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Başlama tarixi</Label>
                                        <p className="text-sm font-medium">{formatDate(selectedContract.startDate)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Bitmə tarixi</Label>
                                        <p className="text-sm font-medium">{formatDate(selectedContract.endDate)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Təchizatçı</Label>
                                        <p className="text-sm font-medium">{getSupplierDisplayName(selectedContract.supplierFullName)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Müştəri</Label>
                                        <p className="text-sm font-medium">{getCustomerDisplayName(selectedContract.customerFullName)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Fayllar</Label>
                                        <div className="mt-1">
                                            <Badge variant="outline">{selectedContract.files?.length || 0} fayl</Badge>
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
                        {selectedContract && (
                            <>
                                <Button
                                    onClick={() => {
                                        setDetailsDialogOpen(false)
                                        handleViewFiles(selectedContract)
                                    }}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Faylları gör
                                </Button>
                                <Button
                                    onClick={() => {
                                        setDetailsDialogOpen(false)
                                        handleEdit(selectedContract)
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Redaktə et
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Files Management Modal */}
            <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Müqavilə Faylları</DialogTitle>
                        <DialogDescription>{selectedContract?.title} faylları</DialogDescription>
                    </DialogHeader>
                    {selectedContract && (
                        <div className="space-y-4">
                            {/* Add Files Section */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Yeni Fayl Əlavə Et</h3>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept=".pdf,.docx"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    const files = Array.from(e.target.files)
                                                    handleAddFiles(selectedContract.id, files)
                                                    e.target.value = "" // Reset input
                                                }
                                            }}
                                            disabled={uploadingFiles}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        {uploadingFiles && (
                                            <div className="flex items-center space-x-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-sm">Fayllar yüklənir...</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Existing Files */}
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Mövcud Fayllar ({selectedContract.files?.length || 0})</h3>
                                </CardHeader>
                                <CardContent>
                                    {selectedContract.files && selectedContract.files.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedContract.files.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 border rounded-md">
                                                    <div className="flex items-center space-x-3">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                        <div>
                                                            <p className="text-sm font-medium">{file.fileName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(file.fileUrl, "_blank")}
                                                            title="Faylı aç"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteFile(file.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                            disabled={deletingFileId === file.id}
                                                            title="Faylı sil"
                                                        >
                                                            {deletingFileId === file.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Heç bir fayl tapılmadı</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFilesDialogOpen(false)}>
                            Bağla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        {/* Title Filter - Full Width */}
                        <div className="space-y-2">
                            <FloatingLabelInput
                                id="filterTitle"
                                label="Başlıq"
                                value={filterTitle}
                                onChange={(e) => setFilterTitle(e.target.value)}
                            />
                        </div>

                        {/* Other Filters - Side by Side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="filter-supplier">Təchizatçı</Label>
                                <Select value={filterSupplierId} onValueChange={setFilterSupplierId}>
                                    <SelectTrigger id="filter-supplier" className="w-full">
                                        <SelectValue placeholder="Təchizatçı seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Hamısı</SelectItem>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {suppliersLoading && <p className="text-xs text-gray-500">Yüklənir...</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-customer">Müştəri</Label>
                                <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
                                    <SelectTrigger id="filter-customer" className="w-full">
                                        <SelectValue placeholder="Müştəri seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Hamısı</SelectItem>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {customersLoading && <p className="text-xs text-gray-500">Yüklənir...</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-startDateFrom">Başlama tarixindən</Label>
                                <input
                                    id="filter-startDateFrom"
                                    type="date"
                                    value={filterStartDateFrom}
                                    onChange={(e) => setFilterStartDateFrom(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-startDateTo">Başlama tarixinədək</Label>
                                <input
                                    id="filter-startDateTo"
                                    type="date"
                                    value={filterStartDateTo}
                                    onChange={(e) => setFilterStartDateTo(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                        </div>

                        {/* Filter Buttons */}
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
                                    <TableHead>Başlıq</TableHead>
                                    <TableHead>Təchizatçı</TableHead>
                                    <TableHead>Müştəri</TableHead>
                                    <TableHead>Başlama tarixi</TableHead>
                                    <TableHead>Bitmə tarixi</TableHead>
                                    <TableHead>Fayllar</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[150px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[120px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[120px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[100px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[100px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[60px]" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                    <Skeleton className="h-8 w-8 rounded-md" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : contracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-sm text-gray-500">Heç bir müqavilə tapılmadı</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contracts.map((contract) => (
                                        <TableRow key={contract.id}>
                                            <TableCell className="font-medium">{contract.title}</TableCell>
                                            <TableCell>
                        <span className="text-sm text-gray-600">
                          {getSupplierDisplayName(contract.supplierFullName)}
                        </span>
                                            </TableCell>
                                            <TableCell>
                        <span className="text-sm text-gray-600">
                          {getCustomerDisplayName(contract.customerFullName)}
                        </span>
                                            </TableCell>
                                            <TableCell>{formatDate(contract.startDate)}</TableCell>
                                            <TableCell>{formatDate(contract.endDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{contract.files?.length || 0} fayl</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(contract)}
                                                        disabled={deletingId !== null}
                                                        title="Təfərrüatları gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewFiles(contract)}
                                                        disabled={deletingId !== null}
                                                        title="Faylları gör"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(contract)}
                                                        disabled={deletingId !== null}
                                                        title="Redaktə et"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(contract.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={deletingId === contract.id}
                                                        title="Sil"
                                                    >
                                                        {deletingId === contract.id ? (
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
