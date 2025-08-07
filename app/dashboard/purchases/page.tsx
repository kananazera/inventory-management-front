"use client"
import { DialogTrigger } from "@/components/ui/dialog"
import type React from "react"
import { Eye, Search, RotateCcw, Plus, Trash2, Loader2, Package, Building2, Calendar } from 'lucide-react'
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

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [defaultCurrency, setDefaultCurrency] = useState<string>("AZN") // Default currency symbol
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

    // Filter states
    const [filterPurchaseNumber, setFilterPurchaseNumber] = useState("")
    const [filterSupplier, setFilterSupplier] = useState<string>("all")
    const [filterWarehouse, setFilterWarehouse] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")

    const [formData, setFormData] = useState({
        supplierId: 0,
        warehouseId: 0,
        purchaseDate: new Date().toISOString().slice(0, 16), // datetime-local format
        paidAmount: "", // Changed to empty string for placeholder
        items: [] as PurchaseItem[],
    })

    const [isClient, setIsClient] = useState(false)
    const [hasToken, setHasToken] = useState(false)

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
        // Fallback to placeholder if no imageUrl
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

            // Find default currency setting
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

    const fetchData = useCallback(async () => {
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
            const response = await fetch(`http://localhost:8080/api/purchases`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
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
            fetchSettings() // Fetch settings first to get currency
            fetchData()
            fetchSuppliers()
            fetchWarehouses()
            fetchProducts()
        }
    }, [isClient, hasToken, fetchSettings, fetchData, fetchSuppliers, fetchWarehouses, fetchProducts])

    const handleFilter = () => {
        // Filter logic would be implemented here
        // For now, just refetch all data
        fetchData()
    }

    const resetFilters = () => {
        setFilterPurchaseNumber("")
        setFilterSupplier("all")
        setFilterWarehouse("all")
        setFilterStatus("all")
        setFilterDateFrom("")
        setFilterDateTo("")
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
                    unitPrice: NaN, // Default to NaN so input is empty
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

        // Auto-populate unit price when product is selected
        if (field === "productId" && value !== 0) {
            const selectedProduct = getProductById(value)
            if (selectedProduct && selectedProduct.price) {
                newItems[index].unitPrice = selectedProduct.price
            }
        }

        // Calculate total price when quantity or unit price changes
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

        // Validate form
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

        // Validate items
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
            if (item.unitPrice <= 0 || isNaN(item.unitPrice)) { // Check for NaN as well
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

        // Validate paid amount
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

        setIsSubmittingForm(true)
        try {
            // Convert date to ISO string format for backend
            const purchaseDateTime = new Date(formData.purchaseDate).toISOString()

            const requestData = {
                supplierId: formData.supplierId,
                warehouseId: formData.warehouseId,
                purchaseDate: purchaseDateTime, // Send as ISO string
                paidAmount: paidAmount, // Ödənilən məbləğ
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
            purchaseDate: new Date().toISOString().slice(0, 16), // datetime-local format
            paidAmount: "", // Reset to empty string
            items: [],
        })
        setEditingPurchase(null)
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

    // Initial full-page loading for data
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
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                        <Label htmlFor="purchaseDate">Alış tarixi və vaxtı *</Label>
                                        <input
                                            id="purchaseDate"
                                            type="datetime-local"
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            disabled={isSubmittingForm}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                        />
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
                                            <Label className="text-sm font-medium text-gray-500">Alış tarixi və vaxtı</Label>
                                            <p className="text-sm font-medium flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {formatDateTime(selectedPurchase.purchaseDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                                            <div className="mt-1">
                                                <Badge variant="default" className="w-fit">
                                                    {selectedPurchase.status}
                                                </Badge>
                                            </div>
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

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterPurchaseNumber"
                                    label="Alış nömrəsi"
                                    value={filterPurchaseNumber}
                                    onChange={(e) => setFilterPurchaseNumber(e.target.value)}
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
                                        <SelectItem value="PENDING">Gözləyir</SelectItem>
                                        <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                                        <SelectItem value="CANCELLED">Ləğv edildi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-date-from">Başlanğıc tarixi</Label>
                                <input
                                    id="filter-date-from"
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filter-date-to">Bitmə tarixi</Label>
                                <input
                                    id="filter-date-to"
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                                    <TableHead>Alış nömrəsi</TableHead>
                                    <TableHead>Təchizatçı</TableHead>
                                    <TableHead>Anbar</TableHead>
                                    <TableHead>Tarix</TableHead>
                                    <TableHead>Ümumi məbləğ</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[120px]" />
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
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <Package className="h-12 w-12 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500">Heç bir alış tapılmadı</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="font-medium">{purchase.purchaseNumber || purchase.id}</TableCell>
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
                                                <Badge variant="default">{purchase.status}</Badge>
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
