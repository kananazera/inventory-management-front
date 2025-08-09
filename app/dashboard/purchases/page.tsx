"use client"
import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { Eye, Search, RotateCcw, Plus, Trash2, Loader2, Package, Building2, Calendar, Edit } from 'lucide-react'
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

interface PurchaseItem {
    id?: number
    productId: number
    productName?: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

interface Purchase {
    id: number
    purchaseNumber: string
    supplierId: number
    supplierFullName: string
    warehouseId: number
    warehouseName: string
    purchaseDate: string
    totalAmount: number
    paidAmount?: number
    remainingAmount?: number
    paymentType?: string
    paymentStatus?: string
    status: string
    notes?: string
    items: PurchaseItem[]
}

interface Supplier {
    id: number
    fullName: string
}

interface Warehouse {
    id: number
    name: string
}

interface Product {
    id: number
    name: string
    price: number
    imageUrl?: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
    errors?: { [key: string]: string }
}

interface Setting {
    key: string
    value: string
    description: string
}

interface PurchaseFilterRequest {
    id?: number
    supplierId?: number
    warehouseId?: number
    status?: string
    purchaseDate?: string
    paymentStatus?: string
    paymentType?: string
    minTotalAmount?: number
    maxTotalAmount?: number
}

const PAYMENT_TYPES = [
    { value: "CASH", label: "Nəğd" },
    { value: "CARD", label: "Kart" },
    { value: "CREDIT", label: "Kredit" },
    { value: "TRANSFER", label: "Köçürmə" },
    { value: "BONUS", label: "Bonus" }
]

const PAYMENT_STATUSES = [
    { value: "PAID", label: "Ödənilib" },
    { value: "PARTIAL", label: "Qismən ödənilib" },
    { value: "UNPAID", label: "Ödənilməyib" }
]

// Status options for creating new purchases (excluding RETURNED)
const PURCHASE_STATUSES = [
    { value: "PENDING", label: "Gözləyir" },
    { value: "COMPLETED", label: "Tamamlandı" },
    { value: "CANCELLED", label: "Ləğv edildi" }
]

// All status options for display purposes (including RETURNED)
const ALL_PURCHASE_STATUSES = [
    { value: "PENDING", label: "Gözləyir" },
    { value: "COMPLETED", label: "Tamamlandı" },
    { value: "CANCELLED", label: "Ləğv edildi" },
    { value: "RETURNED", label: "Geri qaytarıldı" }
]

// Helper function to get status badge color
const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case "PENDING":
            return "secondary"
        case "COMPLETED":
            return "default"
        case "CANCELLED":
            return "destructive"
        case "RETURNED":
            return "outline"
        default:
            return "default"
    }
}

// Helper function to get payment status badge color
const getPaymentStatusBadgeVariant = (paymentStatus: string) => {
    switch (paymentStatus) {
        case "PAID":
            return "default"
        case "PARTIAL":
            return "secondary"
        case "UNPAID":
            return "destructive"
        default:
            return "outline"
    }
}

// Helper function to check if status can be updated
const canUpdateStatus = (currentStatus: string) => {
    return currentStatus === "PENDING"
}

// Helper function to get available status options for update
const getAvailableStatusOptions = (currentStatus: string) => {
    if (currentStatus === "PENDING") {
        return [
            { value: "COMPLETED", label: "Tamamlandı" },
            { value: "CANCELLED", label: "Ləğv edildi" }
        ]
    }
    return []
}

// Helper function to get payment status label
const getPaymentStatusLabel = (paymentStatus?: string) => {
    if (!paymentStatus) return "Təyin edilməyib"
    const status = PAYMENT_STATUSES.find(s => s.value === paymentStatus)
    return status ? status.label : paymentStatus
}

// Helper function to get payment type label
const getPaymentTypeLabel = (paymentType?: string) => {
    if (!paymentType) return "Seçilməyib"
    const type = PAYMENT_TYPES.find(t => t.value === paymentType)
    return type ? type.label : paymentType
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [defaultCurrency, setDefaultCurrency] = useState<string>("AZN")
    const [loading, setLoading] = useState(true)
    const [suppliersLoading, setSuppliersLoading] = useState(true)
    const [warehousesLoading, setWarehousesLoading] = useState(true)
    const [productsLoading, setProductsLoading] = useState(true)
    const [settingsLoading, setSettingsLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [ignoreDialogClose, setIgnoreDialogClose] = useState(false)
    const [isFiltering, setIsFiltering] = useState(false)

    // Filter states
    const [filterPurchaseId, setFilterPurchaseId] = useState("")
    const [filterSupplier, setFilterSupplier] = useState<string>("all")
    const [filterWarehouse, setFilterWarehouse] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all")
    const [filterPaymentType, setFilterPaymentType] = useState<string>("all")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [filterMinAmount, setFilterMinAmount] = useState("")
    const [filterMaxAmount, setFilterMaxAmount] = useState("")

    const [formData, setFormData] = useState({
        supplierId: 0,
        warehouseId: 0,
        purchaseDate: getTodayDate(),
        paidAmount: "",
        paymentType: "",
        status: "PENDING",
        items: [] as PurchaseItem[],
    })

    const [isClient, setIsClient] = useState(false)
    const [hasToken, setHasToken] = useState(false)

    const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false)
    const [updatingPurchase, setUpdatingPurchase] = useState<Purchase | null>(null)
    const [newStatus, setNewStatus] = useState("")
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // Helper function to format date with time
    const formatDateTime = (dateString: string) => {
        if (!dateString) return "Təyin edilməyib"
        try {
            const date = new Date(dateString)
            return date.toLocaleString("az-AZ", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (e) {
            console.error("Tarix formatında xəta:", e)
            return dateString
        }
    }

    // Helper function to format date only (for table)
    const formatDate = (dateString: string) => {
        if (!dateString) return "Təyin edilməyib"
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("az-AZ")
        } catch (e) {
            console.error("Tarix formatında xəta:", e)
            return dateString
        }
    }

    // Helper function to format currency with symbol after amount
    const formatCurrency = (amount: number) => {
        const formattedAmount = new Intl.NumberFormat("az-AZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
        return `${formattedAmount} ${defaultCurrency}`
    }

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId: number) => {
        const supplier = suppliers.find(s => s.id === supplierId)
        return supplier ? supplier.fullName : `Təchizatçı ID: ${supplierId}`
    }

    // Helper function to get warehouse name by ID
    const getWarehouseName = (warehouseId: number) => {
        const warehouse = warehouses.find(w => w.id === warehouseId)
        return warehouse ? warehouse.name : `Anbar ID: ${warehouseId}`
    }

    // Helper function to get product name by ID
    const getProductName = (productId: number) => {
        const product = products.find(p => p.id === productId)
        return product ? product.name : `Məhsul ID: ${productId}`
    }

    // Helper function to get product by ID
    const getProductById = (productId: number) => {
        return products.find(p => p.id === productId)
    }

    // Helper function to calculate remaining debt
    const calculateRemainingDebt = (totalAmount: number, paidAmount: number = 0) => {
        return Math.max(0, totalAmount - paidAmount)
    }

    // Helper function to get product image
    const getProductImage = (productId: number, productName?: string) => {
        const product = getProductById(productId)
        if (product && product.imageUrl) {
            return product.imageUrl
        }
        const encodedName = encodeURIComponent(productName || product?.name || "product")
        return `/placeholder.svg?height=60&width=60&text=${encodedName}`
    }

    // Fetch settings to get default currency
    const fetchSettings = useCallback(async () => {
        if (typeof window === "undefined") {
            setSettingsLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Tənzimləmələr yüklənmədi.")
            setSettingsLoading(false)
            return
        }
        setSettingsLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/settings`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Tənzimləmələri çəkərkən xəta:", response.status, errorData)
                setSettingsLoading(false)
                return
            }
            const data: Setting[] = await response.json()

            const defaultCurrencySetting = data.find(setting => setting.key === "default_currency")
            if (defaultCurrencySetting && defaultCurrencySetting.value) {
                setDefaultCurrency(defaultCurrencySetting.value)
            }
        } catch (error) {
            console.error("Tənzimləmələri çəkərkən bağlantı xətası:", error)
        } finally {
            setSettingsLoading(false)
        }
    }, [])

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
            const response = await fetch(`http://localhost:8080/api/suppliers`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Təchizatçıları çəkərkən xəta:", response.status, errorData)
                setSuppliers([])
                return
            }
            const data = await response.json()
            setSuppliers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Təchizatçıları çəkərkən bağlantı xətası:", error)
            setSuppliers([])
        } finally {
            setSuppliersLoading(false)
        }
    }, [])

    const fetchWarehouses = useCallback(async () => {
        if (typeof window === "undefined") {
            setWarehousesLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Anbarlar yüklənmədi.")
            setWarehousesLoading(false)
            return
        }
        setWarehousesLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/warehouses`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Anbarları çəkərkən xəta:", response.status, errorData)
                setWarehouses([])
                return
            }
            const data = await response.json()
            setWarehouses(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Anbarları çəkərkən bağlantı xətası:", error)
            setWarehouses([])
        } finally {
            setWarehousesLoading(false)
        }
    }, [])

    const fetchProducts = useCallback(async () => {
        if (typeof window === "undefined") {
            setProductsLoading(false)
            return
        }
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("Token tapılmadı. Məhsullar yüklənmədi.")
            setProductsLoading(false)
            return
        }
        setProductsLoading(true)
        try {
            const response = await fetch(`http://localhost:8080/api/products/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Məhsulları çəkərkən xəta:", response.status, errorData)
                setProducts([])
                return
            }
            const data = await response.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Məhsulları çəkərkən bağlantı xətası:", error)
            setProducts([])
        } finally {
            setProductsLoading(false)
        }
    }, [])

    const fetchData = useCallback(async (filterRequest?: PurchaseFilterRequest) => {
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
            const url = filterRequest ? `http://localhost:8080/api/purchases/filter` : `http://localhost:8080/api/purchases`
            const requestOptions: RequestInit = {
                method: filterRequest ? "POST" : "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }

            if (filterRequest) {
                requestOptions.body = JSON.stringify(filterRequest)
            }

            const response = await fetch(url, requestOptions)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Alışları çəkərkən xəta:", response.status, errorData)
                showSwal({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Alışlar yüklənmədi: Status ${response.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                setPurchases([])
                return
            }
            const data = await response.json()
            console.log("Alış API cavabı:", data)
            setPurchases(Array.isArray(data) ? data : [])
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
            setPurchases([])
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
            fetchSettings()
            fetchData()
            fetchSuppliers()
            fetchWarehouses()
            fetchProducts()
        }
    }, [isClient, hasToken, fetchSettings, fetchData, fetchSuppliers, fetchWarehouses, fetchProducts])

    const handleFilter = async () => {
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        setIsFiltering(true)
        try {
            const filterRequest: PurchaseFilterRequest = {}

            if (filterPurchaseId && filterPurchaseId.trim() !== "") {
                const purchaseId = parseInt(filterPurchaseId.trim())
                if (!isNaN(purchaseId)) {
                    filterRequest.id = purchaseId
                }
            }

            if (filterSupplier !== "all") {
                filterRequest.supplierId = parseInt(filterSupplier)
            }

            if (filterWarehouse !== "all") {
                filterRequest.warehouseId = parseInt(filterWarehouse)
            }

            if (filterStatus !== "all") {
                filterRequest.status = filterStatus
            }

            if (filterPaymentStatus !== "all") {
                filterRequest.paymentStatus = filterPaymentStatus
            }

            if (filterPaymentType !== "all") {
                filterRequest.paymentType = filterPaymentType
            }

            if (filterDateFrom && filterDateFrom.trim() !== "") {
                filterRequest.purchaseDate = filterDateFrom
            }

            if (filterMinAmount && filterMinAmount.trim() !== "") {
                const minAmount = parseFloat(filterMinAmount.trim())
                if (!isNaN(minAmount) && minAmount >= 0) {
                    filterRequest.minTotalAmount = minAmount
                }
            }

            if (filterMaxAmount && filterMaxAmount.trim() !== "") {
                const maxAmount = parseFloat(filterMaxAmount.trim())
                if (!isNaN(maxAmount) && maxAmount >= 0) {
                    filterRequest.maxTotalAmount = maxAmount
                }
            }

            console.log("Filter request:", filterRequest)
            await fetchData(filterRequest)
        } catch (error) {
            console.error("Filter xətası:", error)
            showSwal({
                title: "Xəta!",
                text: "Filterleme zamanı xəta baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
            })
        } finally {
            setIsFiltering(false)
        }
    }

    const resetFilters = () => {
        setFilterPurchaseId("")
        setFilterSupplier("all")
        setFilterWarehouse("all")
        setFilterStatus("all")
        setFilterPaymentStatus("all")
        setFilterPaymentType("all")
        setFilterDateFrom("")
        setFilterDateTo("")
        setFilterMinAmount("")
        setFilterMaxAmount("")
        fetchData()
    }

    const addPurchaseItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    productId: 0,
                    quantity: 1,
                    unitPrice: NaN,
                    totalPrice: 0,
                },
            ],
        })
    }

    const removePurchaseItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index)
        setFormData({ ...formData, items: newItems })
    }

    const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...formData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        if (field === "productId" && value !== 0) {
            const selectedProduct = getProductById(value)
            if (selectedProduct && selectedProduct.price) {
                newItems[index].unitPrice = selectedProduct.price
            }
        }

        if (field === "quantity" || field === "unitPrice" || field === "productId") {
            const quantity = newItems[index].quantity || 0;
            const unitPrice = newItems[index].unitPrice || 0;
            newItems[index].totalPrice = quantity * unitPrice;
        }

        setFormData({ ...formData, items: newItems })
    }

    const calculateTotalAmount = () => {
        return formData.items.reduce((total, item) => total + item.totalPrice, 0)
    }

    const calculateRemainingAmount = () => {
        const totalAmount = calculateTotalAmount()
        const paidAmount = Number.parseFloat(formData.paidAmount) || 0
        return Math.max(0, totalAmount - paidAmount)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        if (formData.supplierId === 0) {
            showSwal({
                title: "Xəta!",
                text: "Təchizatçı seçilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        if (formData.warehouseId === 0) {
            showSwal({
                title: "Xəta!",
                text: "Anbar seçilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        if (formData.items.length === 0) {
            showSwal({
                title: "Xəta!",
                text: "Ən azı bir məhsul əlavə edilməlidir",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i]
            if (item.productId === 0) {
                showSwal({
                    title: "Xəta!",
                    text: `${i + 1}-ci məhsul seçilməlidir`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                return
            }
            if (item.quantity <= 0) {
                showSwal({
                    title: "Xəta!",
                    text: `${i + 1}-ci məhsulun miqdarı 0-dan böyük olmalıdır`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpenCustom: () => setIgnoreDialogClose(true),
                    willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
                })
                return
            }
            if (item.unitPrice <= 0 || isNaN(item.unitPrice)) {
                showSwal({
                    title: "Xəta!",
                    text: `${i + 1}-ci məhsulun qiyməti 0-dan böyük olmalıdır`,
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

        const totalAmount = calculateTotalAmount()
        const paidAmount = Number.parseFloat(formData.paidAmount) || 0
        if (paidAmount < 0) {
            showSwal({
                title: "Xəta!",
                text: "Ödənilən məbləğ mənfi ola bilməz",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        if (paidAmount > totalAmount) {
            showSwal({
                title: "Xəta!",
                text: "Ödənilən məbləğ ümumi məbləğdən çox ola bilməz",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpenCustom: () => setIgnoreDialogClose(true),
                willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
            })
            return
        }

        if (paidAmount > 0 && !formData.paymentType) {
            showSwal({
                title: "Xəta!",
                text: "Ödəniş növü seçilməlidir",
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
            const requestData = {
                supplierId: formData.supplierId,
                warehouseId: formData.warehouseId,
                purchaseDate: formData.purchaseDate,
                paidAmount: paidAmount,
                paymentType: paidAmount > 0 ? formData.paymentType : null,
                status: formData.status,
                items: formData.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            }

            console.log("Göndərilən məlumat:", requestData)

            const response = await fetch("http://localhost:8080/api/purchases", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
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
                    text: "Alış uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false)
                resetForm()
                await fetchData()
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
            console.error("API xətası:", error)
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

    const handleViewDetails = (purchase: Purchase) => {
        setSelectedPurchase(purchase)
        setDetailsDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({
            supplierId: 0,
            warehouseId: 0,
            purchaseDate: getTodayDate(),
            paidAmount: "",
            paymentType: "",
            status: "PENDING",
            items: [],
        })
        setEditingPurchase(null)
    }

    const handleUpdateStatus = async () => {
        if (!updatingPurchase || !newStatus) return
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        setIsUpdatingStatus(true)
        try {
            const response = await fetch(`http://localhost:8080/api/purchases/${updatingPurchase.id}/status?status=${newStatus}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
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
                    text: "Status uğurla yeniləndi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setStatusUpdateDialogOpen(false)
                setUpdatingPurchase(null)
                setNewStatus("")
                await fetchData()
            } else {
                let errorMessage = responseData.message || responseData.error || "Status yenilənmədi"
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
            console.error("Status yeniləmə xətası:", error)
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
            setIsUpdatingStatus(false)
        }
    }

    const handleOpenStatusUpdate = (purchase: Purchase) => {
        setUpdatingPurchase(purchase)
        setNewStatus("")
        setStatusUpdateDialogOpen(true)
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

    if (loading && suppliersLoading && warehousesLoading && productsLoading && settingsLoading) {
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
                    <h1 className="text-3xl font-bold text-gray-900">Alışlar</h1>
                    <p className="mt-2 text-gray-600">Alış məlumatlarını idarə edin</p>
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
                            Yeni alış
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Yeni alış əlavə et</DialogTitle>
                            <DialogDescription>Alış məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier">Təchizatçı *</Label>
                                        <Select
                                            value={formData.supplierId.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, supplierId: Number.parseInt(value) })}
                                            disabled={isSubmittingForm || suppliersLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Təchizatçı seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                        {supplier.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="warehouse">Anbar *</Label>
                                        <Select
                                            value={formData.warehouseId.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, warehouseId: Number.parseInt(value) })}
                                            disabled={isSubmittingForm || warehousesLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Anbar seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((warehouse) => (
                                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                        {warehouse.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="purchaseDate">Alış tarixi *</Label>
                                        <input
                                            id="purchaseDate"
                                            type="date"
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                            disabled={isSubmittingForm}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PURCHASE_STATUSES.map((status) => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-lg font-semibold">Məhsullar *</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addPurchaseItem}
                                            disabled={isSubmittingForm || productsLoading}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Məhsul əlavə et
                                        </Button>
                                    </div>

                                    {formData.items.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-500">Hələ məhsul əlavə edilməyib</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addPurchaseItem}
                                                disabled={isSubmittingForm || productsLoading}
                                                className="mt-2 bg-transparent"
                                            >
                                                İlk məhsulu əlavə et
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {formData.items.map((item, index) => (
                                                <Card key={index}>
                                                    <CardContent className="p-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                                                            <div className="space-y-2">
                                                                <Label>Məhsul *</Label>
                                                                <Select
                                                                    value={item.productId.toString()}
                                                                    onValueChange={(value) =>
                                                                        updatePurchaseItem(index, "productId", Number.parseInt(value))
                                                                    }
                                                                    disabled={isSubmittingForm || productsLoading}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Məhsul seçin..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {products.map((product) => (
                                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                                {product.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Miqdar *</Label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    step="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        updatePurchaseItem(index, "quantity", Number.parseInt(e.target.value) || 0)
                                                                    }
                                                                    disabled={isSubmittingForm}
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Vahid qiyməti *</Label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={isNaN(item.unitPrice) ? "" : item.unitPrice}
                                                                    onChange={(e) =>
                                                                        updatePurchaseItem(index, "unitPrice", Number.parseFloat(e.target.value) || NaN)
                                                                    }
                                                                    disabled={isSubmittingForm}
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Ümumi qiymət</Label>
                                                                <input
                                                                    type="text"
                                                                    value={formatCurrency(item.totalPrice)}
                                                                    disabled
                                                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => removePurchaseItem(index)}
                                                                    disabled={isSubmittingForm}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}

                                            <Card className="bg-gray-50">
                                                <CardContent className="p-4">
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="paidAmount">Ödənilən məbləğ</Label>
                                                                <input
                                                                    id="paidAmount"
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    max={calculateTotalAmount()}
                                                                    value={formData.paidAmount}
                                                                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                                                    disabled={isSubmittingForm}
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-gray-500">Ümumi məbləğ</Label>
                                                                <div className="text-lg font-bold text-blue-600">
                                                                    {formatCurrency(calculateTotalAmount())}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-gray-500">Qalan məbləğ</Label>
                                                                <div className={`text-lg font-bold ${calculateRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {formatCurrency(calculateRemainingAmount())}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(Number.parseFloat(formData.paidAmount) || 0) > 0 && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="paymentType">Ödəniş növü *</Label>
                                                                    <Select
                                                                        value={formData.paymentType}
                                                                        onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                                                                        disabled={isSubmittingForm}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Ödəniş növü seçin..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {PAYMENT_TYPES.map((type) => (
                                                                                <SelectItem key={type.value} value={type.value}>
                                                                                    {type.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
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
                                    Əlavə et
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Alış Təfərrüatları</DialogTitle>
                        <DialogDescription>
                            {selectedPurchase ? `Alış nömrəsi: ${selectedPurchase.purchaseNumber || selectedPurchase.id}` : "Alış məlumatları"}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPurchase && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold flex items-center">
                                            <Package className="mr-2 h-5 w-5" />
                                            Əsas Məlumatlar
                                        </h3>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Alış nömrəsi</Label>
                                            <p className="text-sm font-medium">{selectedPurchase.purchaseNumber || selectedPurchase.id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Təchizatçı</Label>
                                            <p className="text-sm font-medium">
                                                {selectedPurchase.supplierFullName || getSupplierName(selectedPurchase.supplierId)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Anbar</Label>
                                            <p className="text-sm font-medium">
                                                {selectedPurchase.warehouseName || getWarehouseName(selectedPurchase.warehouseId)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Alış tarixi</Label>
                                            <p className="text-sm font-medium flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {formatDate(selectedPurchase.purchaseDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                                            <div className="mt-1">
                                                <Badge variant={getStatusBadgeVariant(selectedPurchase.status)} className="w-fit">
                                                    {ALL_PURCHASE_STATUSES.find(s => s.value === selectedPurchase.status)?.label || selectedPurchase.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ödəniş statusu</Label>
                                            <div className="mt-1">
                                                {selectedPurchase.paymentStatus ? (
                                                    <Badge variant={getPaymentStatusBadgeVariant(selectedPurchase.paymentStatus)} className="w-fit">
                                                        {getPaymentStatusLabel(selectedPurchase.paymentStatus)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Təyin edilməyib</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ödəniş növü</Label>
                                            <p className="text-sm font-medium">
                                                {getPaymentTypeLabel(selectedPurchase.paymentType)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ümumi məbləğ</Label>
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatCurrency(selectedPurchase.totalAmount)}
                                            </p>
                                        </div>
                                        {selectedPurchase.paidAmount !== undefined && (
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Ödənilən məbləğ</Label>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(selectedPurchase.paidAmount)}
                                                </p>
                                            </div>
                                        )}
                                        {selectedPurchase.paidAmount !== undefined && (
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Qalıq borc</Label>
                                                <p className={`text-lg font-bold ${calculateRemainingDebt(selectedPurchase.totalAmount, selectedPurchase.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(calculateRemainingDebt(selectedPurchase.totalAmount, selectedPurchase.paidAmount))}
                                                </p>
                                            </div>
                                        )}
                                        {selectedPurchase.notes && (
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Qeydlər</Label>
                                                <p className="text-sm font-medium">{selectedPurchase.notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Məhsullar</h3>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                                                selectedPurchase.items.map((item, index) => (
                                                    <div key={index} className="border rounded-lg p-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex-shrink-0">
                                                                <img
                                                                    src={getProductImage(item.productId, item.productName || getProductName(item.productId))}
                                                                    alt={item.productName || getProductName(item.productId)}
                                                                    className="w-12 h-12 rounded-md object-cover border"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="font-medium text-sm">
                                                                            {item.productName || getProductName(item.productId)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Miqdar: {item.quantity} × {formatCurrency(item.unitPrice)}
                                                                        </p>
                                                                    </div>
                                                                    <p className="font-bold text-green-600 text-sm">{formatCurrency(item.totalPrice)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4">
                                                    <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500">Məhsul məlumatları tapılmadı</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                            Bağla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Status Yenilə</DialogTitle>
                        <DialogDescription>
                            {updatingPurchase ? `Alış nömrəsi: ${updatingPurchase.purchaseNumber || updatingPurchase.id}` : "Alış statusunu yeniləyin"}
                        </DialogDescription>
                    </DialogHeader>
                    {updatingPurchase && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Cari Status</Label>
                                <Badge variant={getStatusBadgeVariant(updatingPurchase.status)} className="w-fit">
                                    {ALL_PURCHASE_STATUSES.find(s => s.value === updatingPurchase.status)?.label || updatingPurchase.status}
                                </Badge>
                            </div>
                            {canUpdateStatus(updatingPurchase.status) ? (
                                <div className="space-y-2">
                                    <Label htmlFor="newStatus">Yeni Status *</Label>
                                    <Select
                                        value={newStatus}
                                        onValueChange={setNewStatus}
                                        disabled={isUpdatingStatus}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableStatusOptions(updatingPurchase.status).map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-500">Status Yeniləmə</Label>
                                    <div className="p-3 bg-gray-50 rounded-md border">
                                        <p className="text-sm text-gray-600">
                                            Bu alışın statusu yenilənə bilməz. Yalnız "Gözləyir" statusundakı alışların statusu dəyişdirilə bilər.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStatusUpdateDialogOpen(false)}
                            disabled={isUpdatingStatus}
                        >
                            Ləğv et
                        </Button>
                        {canUpdateStatus(updatingPurchase?.status || "") && (
                            <Button
                                onClick={handleUpdateStatus}
                                disabled={isUpdatingStatus || !newStatus}
                            >
                                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yenilə
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterPurchaseId"
                                    label="Alış nömrəsi"
                                    value={filterPurchaseId}
                                    onChange={(e) => setFilterPurchaseId(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-supplier">Təchizatçı</Label>
                                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                                    <SelectTrigger id="filter-supplier" className="w-full">
                                        <SelectValue placeholder="Təchizatçı seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-warehouse">Anbar</Label>
                                <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                                    <SelectTrigger id="filter-warehouse" className="w-full">
                                        <SelectValue placeholder="Anbar seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-status">Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger id="filter-status" className="w-full">
                                        <SelectValue placeholder="Status seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {ALL_PURCHASE_STATUSES.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-payment-status">Ödəniş statusu</Label>
                                <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                                    <SelectTrigger id="filter-payment-status" className="w-full">
                                        <SelectValue placeholder="Ödəniş statusu seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {PAYMENT_STATUSES.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-payment-type">Ödəniş növü</Label>
                                <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
                                    <SelectTrigger id="filter-payment-type" className="w-full">
                                        <SelectValue placeholder="Ödəniş növü seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {PAYMENT_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-date-from">Alış tarixi</Label>
                                <input
                                    id="filter-date-from"
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-min-amount">Ən az məbləğ</Label>
                                <input
                                    id="filter-min-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={filterMinAmount}
                                    onChange={(e) => setFilterMinAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-max-amount">Ən çox məbləğ</Label>
                                <input
                                    id="filter-max-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={filterMaxAmount}
                                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={handleFilter} size="icon" title="Filterlə" disabled={isFiltering}>
                                {isFiltering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                            <Button onClick={resetFilters} size="icon" variant="outline" title="Filterləri sıfırla" disabled={isFiltering}>
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
                                    <TableHead>Alış nömrəsi</TableHead>
                                    <TableHead>Təchizatçı</TableHead>
                                    <TableHead>Anbar</TableHead>
                                    <TableHead>Tarix</TableHead>
                                    <TableHead>Ümumi məbləğ</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ödəniş statusu</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[80px]" />
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
                                                <Skeleton className="h-4 w-[60px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <Package className="h-12 w-12 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">Heç bir alış tapılmadı</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="font-medium">{purchase.id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                                                    {purchase.supplierFullName || getSupplierName(purchase.supplierId)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {purchase.warehouseName || getWarehouseName(purchase.warehouseId)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                    {formatDate(purchase.purchaseDate)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-green-600">{formatCurrency(purchase.totalAmount)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(purchase.status)}>
                                                    {ALL_PURCHASE_STATUSES.find(s => s.value === purchase.status)?.label || purchase.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {purchase.paymentStatus ? (
                                                    <Badge variant={getPaymentStatusBadgeVariant(purchase.paymentStatus)}>
                                                        {getPaymentStatusLabel(purchase.paymentStatus)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(purchase)}
                                                        disabled={deletingId !== null}
                                                        title="Təfərrüatları gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {canUpdateStatus(purchase.status) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenStatusUpdate(purchase)}
                                                            disabled={deletingId !== null}
                                                            title="Status yenilə"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
