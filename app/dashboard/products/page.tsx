"use client"
import type React from "react"
import { Eye, Search, RotateCcw, RefreshCw } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
    id: number
    name: string
    sku: string | null
    description: string | null
    price: number
    active: boolean
    category: ProductCategory | null
    brand: ProductBrand | null
    unit: ProductUnit | null
    imageUrl: string | null
}

interface ProductCategory {
    id: number
    name: string
}

interface ProductBrand {
    id: number
    name: string
}

interface ProductUnit {
    id: number
    name: string
}

interface ApiResponse {
    message?: string
    error?: string
    success?: boolean
    data?: any
}

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

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<ProductCategory[]>([])
    const [brands, setBrands] = useState<ProductBrand[]>([])
    const [units, setUnits] = useState<ProductUnit[]>([])
    const [defaultCurrency, setDefaultCurrency] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [ignoreDialogClose, setIgnoreDialogClose] = useState(false) // New state for dialog control

    // Filter states
    const [filterName, setFilterName] = useState("")
    const [filterSku, setFilterSku] = useState("")
    const [filterDescription, setFilterDescription] = useState("")
    const [filterCategoryId, setFilterCategoryId] = useState<string>("all")
    const [filterBrandId, setFilterBrandId] = useState<string>("all")
    const [filterUnitId, setFilterUnitId] = useState<string>("all")
    const [filterActive, setFilterActive] = useState<string>("all")
    const [filterMinPrice, setFilterMinPrice] = useState("")
    const [filterMaxPrice, setFilterMaxPrice] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        price: "",
        categoryId: "none",
        brandId: "none",
        unitId: "none",
        active: true,
        imageUrl: "",
    })

    const [isClient, setIsClient] = useState(false)
    const [hasToken, setHasToken] = useState(false)

    // Generate unique SKU
    const generateSKU = () => {
        let result = ""
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        const charactersLength = characters.length
        for (let i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    }

    // Fetch default currency from settings
    const fetchDefaultCurrency = useCallback(async () => {
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        try {
            const response = await fetch("http://localhost:8080/api/settings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const settings = await response.json()
                const currencySetting = settings.find((setting: any) => setting.key === "default_currency")
                if (currencySetting) {
                    setDefaultCurrency(currencySetting.value)
                }
            }
        } catch (error) {
            console.error("Error fetching default currency:", error)
        }
    }, [])

    // Format price with currency
    const formatPrice = (price: number) => {
        return `${price}${defaultCurrency ? ` ${defaultCurrency}` : ""}`
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
            const productsRes = await fetch(`http://localhost:8080/api/products/filter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(filterParams),
            })

            if (!productsRes.ok) {
                const errorData = await productsRes.json().catch(() => ({ message: "Naməlum xəta" }))
                console.error("Məhsulları çəkərkən xəta:", productsRes.status, errorData)
                await showSwal({
                    title: "Xəta!",
                    text: errorData.message || errorData.error || `Məhsullar yüklənmədi: Status ${productsRes.status}`,
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false, // Prevent closing on outside click
                    allowEscapeKey: false, // Prevent closing on escape key
                    didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                    willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
                })
                setProducts([])
                setCategories([])
                setBrands([])
                setUnits([])
                return
            }

            const productsData = await productsRes.json()
            console.log("Məhsul API cavabı:", productsData)
            setProducts(Array.isArray(productsData) ? productsData : [])

            const [categoriesRes, brandsRes, unitsRes] = await Promise.all([
                fetch("http://localhost:8080/api/product-categories", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:8080/api/product-brands", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:8080/api/product-units", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            const [categoriesData, brandsData, unitsData] = await Promise.all([
                categoriesRes.json(),
                brandsRes.json(),
                unitsRes.json(),
            ])

            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
            setBrands(Array.isArray(brandsData) ? brandsData : [])
            setUnits(Array.isArray(unitsData) ? unitsData : [])
        } catch (error) {
            console.error("Məlumatları çəkərkən bağlantı xətası:", error)
            await showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Prevent closing on outside click
                allowEscapeKey: false, // Prevent closing on escape key
                didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
            })
            setProducts([])
            setCategories([])
            setBrands([])
            setUnits([])
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
            fetchDefaultCurrency()
        }
    }, [isClient, hasToken, fetchData, fetchDefaultCurrency])

    const handleFilter = () => {
        const filterParams: Record<string, any> = {}
        if (filterName) filterParams.name = filterName
        if (filterSku) filterParams.sku = filterSku
        if (filterDescription) filterParams.description = filterDescription
        if (filterCategoryId !== "all") filterParams.categoryId = Number.parseInt(filterCategoryId)
        if (filterBrandId !== "all") filterParams.brandId = Number.parseInt(filterBrandId)
        if (filterUnitId !== "all") filterParams.unitId = Number.parseInt(filterUnitId)
        if (filterActive === "true") filterParams.active = true
        if (filterActive === "false") filterParams.active = false
        if (filterMinPrice) filterParams.minPrice = Number.parseFloat(filterMinPrice)
        if (filterMaxPrice) filterParams.maxPrice = Number.parseFloat(filterMaxPrice)

        fetchData(filterParams)
    }

    const resetFilters = () => {
        setFilterName("")
        setFilterSku("")
        setFilterDescription("")
        setFilterCategoryId("all")
        setFilterBrandId("all")
        setFilterUnitId("all")
        setFilterActive("all")
        setFilterMinPrice("")
        setFilterMaxPrice("")
        fetchData({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (typeof window === "undefined") return
        const token = localStorage.getItem("token")
        if (!token) return

        setIsSubmittingForm(true)
        try {
            const url = editingProduct
                ? `http://localhost:8080/api/products/${editingProduct.id}`
                : "http://localhost:8080/api/products"
            const method = editingProduct ? "PUT" : "POST"

            const data = new FormData()
            data.append("name", formData.name)
            data.append("price", formData.price)
            if (formData.sku) data.append("sku", formData.sku)
            if (formData.description) data.append("description", formData.description)
            if (formData.categoryId !== "none") data.append("categoryId", formData.categoryId)
            if (formData.brandId !== "none") data.append("brandId", formData.brandId)
            if (formData.unitId !== "none") data.append("unitId", formData.unitId)
            data.append("active", String(formData.active))

            if (imageFile) {
                data.append("image", imageFile)
            } else if (editingProduct && formData.imageUrl) {
                data.append("imageUrl", formData.imageUrl)
            } else if (editingProduct && !formData.imageUrl && !imageFile) {
                data.append("imageUrl", "")
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
                    text: editingProduct ? "Məhsul uğurla yeniləndi" : "Məhsul uğurla əlavə edildi",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                    timer: 2000,
                    timerProgressBar: true,
                })
                setDialogOpen(false) // Close dialog only on success
                resetForm()
                await fetchData({})
            } else {
                await showSwal({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Əməliyyat uğursuz oldu",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false, // Prevent closing on outside click
                    allowEscapeKey: false, // Prevent closing on escape key
                    didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                    willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
                })
            }
        } catch (error) {
            await showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Prevent closing on outside click
                allowEscapeKey: false, // Prevent closing on escape key
                didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
            })
        } finally {
            setIsSubmittingForm(false)
        }
    }

    const fetchProductById = useCallback(async (id: number): Promise<Product | null> => {
        if (typeof window === "undefined") return null
        const token = localStorage.getItem("token")
        if (!token) return null

        try {
            const response = await fetch(`http://localhost:8080/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                return await response.json()
            } else {
                console.error(`Failed to fetch product with ID ${id}:`, response.status)
                return null
            }
        } catch (error) {
            console.error(`Error fetching product with ID ${id}:`, error)
            return null
        }
    }, [])

    const handleEdit = async (product: Product) => {
        const fetchedProduct = await fetchProductById(product.id)
        if (fetchedProduct) {
            setEditingProduct(fetchedProduct)
            setFormData({
                name: fetchedProduct.name,
                sku: fetchedProduct.sku || "",
                description: fetchedProduct.description || "",
                price: fetchedProduct.price.toString(),
                categoryId: fetchedProduct.category ? fetchedProduct.category.id.toString() : "none",
                brandId: fetchedProduct.brand ? fetchedProduct.brand.id.toString() : "none",
                unitId: fetchedProduct.unit ? fetchedProduct.unit.id.toString() : "none",
                active: fetchedProduct.active,
                imageUrl: fetchedProduct.imageUrl || "",
            })
            setImageFile(null)
            setDialogOpen(true)
        } else {
            await showSwal({
                title: "Xəta!",
                text: "Məhsul məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Prevent closing on outside click
                allowEscapeKey: false, // Prevent closing on escape key
                didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
            })
        }
    }

    const handleViewDetails = async (product: Product) => {
        const fetchedProduct = await fetchProductById(product.id)
        if (fetchedProduct) {
            setSelectedProduct(fetchedProduct)
            setDetailsDialogOpen(true)
        } else {
            await showSwal({
                title: "Xəta!",
                text: "Məhsul məlumatları yüklənə bilmədi.",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Prevent closing on outside click
                allowEscapeKey: false, // Prevent closing on escape key
                didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
            })
        }
    }

    const handleDelete = async (id: number) => {
        const result = await showSwal({
            title: "Əminsiniz?",
            text: "Bu məhsulu silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
            const response = await fetch(`http://localhost:8080/api/products/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                await showSwal({
                    title: "Silindi!",
                    text: "Məhsul uğurla silindi",
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
                await showSwal({
                    title: "Xəta!",
                    text: responseData.message || responseData.error || "Silmə əməliyyatı uğursuz oldu",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    allowOutsideClick: false, // Prevent closing on outside click
                    allowEscapeKey: false, // Prevent closing on escape key
                    didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                    willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
                })
            }
        } catch (error) {
            await showSwal({
                title: "Xəta!",
                text: "Bağlantı xətası baş verdi",
                icon: "error",
                confirmButtonColor: "#ef4444",
                allowOutsideClick: false, // Prevent closing on outside click
                allowEscapeKey: false, // Prevent closing on escape key
                didOpenCustom: () => setIgnoreDialogClose(true), // Set flag when SweetAlert opens
                willCloseCustom: () => setIgnoreDialogClose(false), // Reset flag after SweetAlert closes
            })
        } finally {
            setDeletingId(null)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            sku: generateSKU(),
            description: "",
            price: "",
            categoryId: "none",
            brandId: "none",
            unitId: "none",
            active: true,
            imageUrl: "",
        })
        setImageFile(null)
        setEditingProduct(null)
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Məhsullar</h1>
                    <p className="mt-2 text-gray-600">Məhsulları idarə edin</p>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(openState) => {
                        if (ignoreDialogClose && !openState) {
                            return // Ignore this close event
                        }
                        setDialogOpen(openState)
                    }}
                >
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni məhsul
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? "Məhsulu redaktə et" : "Yeni məhsul əlavə et"}</DialogTitle>
                            <DialogDescription>Məhsul məlumatlarını daxil edin</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-6 space-y-2">
                                        <FloatingLabelInput
                                            id="product-name"
                                            label="Ad *"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <FloatingLabelInput
                                            id="product-price"
                                            label={`Qiymət${defaultCurrency ? ` (${defaultCurrency})` : ""} *`}
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                            disabled={isSubmittingForm}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <div className="relative">
                                            <FloatingLabelInput
                                                id="product-sku"
                                                label="SKU"
                                                value={formData.sku}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                disabled={isSubmittingForm}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="absolute right-1 top-1 h-8 w-8 p-0 bg-transparent"
                                                onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                                                disabled={isSubmittingForm}
                                                title="Yeni SKU generasiya et"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="product-description">Təsvir</Label>
                                    <Textarea
                                        id="product-description"
                                        placeholder="Məhsul təsvirini daxil edin..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        disabled={isSubmittingForm}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="product-image">Şəkil</Label>
                                    <input
                                        id="product-image"
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
                                    {(imageFile || formData.imageUrl) && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground mb-1">Cari Şəkil:</p>
                                            <img
                                                src={
                                                    imageFile
                                                        ? URL.createObjectURL(imageFile)
                                                        : formData.imageUrl || "/images/no-product-photo.png"
                                                }
                                                alt="Product Preview"
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

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Kateqoriya</Label>
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                            disabled={isSubmittingForm}
                                        >
                                            <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                                <SelectValue placeholder="Kateqoriya seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                                <SelectItem value="none">Seçim yoxdur</SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brend</Label>
                                        <Select
                                            value={formData.brandId}
                                            onValueChange={(value) => setFormData({ ...formData, brandId: value })}
                                            disabled={isSubmittingForm}
                                        >
                                            <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                                <SelectValue placeholder="Brend seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                                <SelectItem value="none">Seçim yoxdur</SelectItem>
                                                {brands.map((brand) => (
                                                    <SelectItem key={brand.id} value={brand.id.toString()}>
                                                        {brand.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ölçü vahidi</Label>
                                        <Select
                                            value={formData.unitId}
                                            onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                                            disabled={isSubmittingForm}
                                        >
                                            <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                                <SelectValue placeholder="Vahid seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] overflow-y-auto">
                                                <SelectItem value="none">Seçim yoxdur</SelectItem>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                    {editingProduct ? "Yenilə" : "Əlavə et"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Product Details Modal */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Məhsul Təfərrüatları</DialogTitle>
                        <DialogDescription>{selectedProduct?.name} məhsulunun bütün məlumatları</DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Əsas Məlumatlar</h3>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">ID</Label>
                                            <p className="text-sm font-medium">{selectedProduct.id}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ad</Label>
                                            <p className="text-sm font-medium">{selectedProduct.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">SKU</Label>
                                            <p className="text-sm font-medium">{selectedProduct.sku || "N/A"}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Qiymət</Label>
                                            <p className="text-lg font-bold text-green-600">{formatPrice(selectedProduct.price)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                                            <Badge variant={selectedProduct.active ? "default" : "secondary"} className="w-fit">
                                                {selectedProduct.active ? "Aktiv" : "Deaktiv"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Şəkil</h3>
                                    </CardHeader>
                                    <CardContent>
                                        <img
                                            src={selectedProduct.imageUrl || "/images/no-product-photo.png"}
                                            alt={selectedProduct.name}
                                            width={200}
                                            height={200}
                                            className="w-full h-48 object-contain rounded-md border"
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Təsvir</h3>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">{selectedProduct.description || "Təsvir əlavə edilməyib"}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Kateqoriya Məlumatları</h3>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Kateqoriya</Label>
                                            <Badge variant="outline" className="mt-1 block w-fit">
                                                {selectedProduct.category?.name || "Seçilməyib"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Brend</Label>
                                            <Badge variant="outline" className="mt-1 block w-fit">
                                                {selectedProduct.brand?.name || "Seçilməyib"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Ölçü Vahidi</Label>
                                            <Badge variant="outline" className="mt-1 block w-fit">
                                                {selectedProduct.unit?.name || "Seçilməyib"}
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
                        {selectedProduct && (
                            <Button
                                onClick={() => {
                                    setDetailsDialogOpen(false)
                                    handleEdit(selectedProduct)
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterName"
                                    label="Ad"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterSku"
                                    label="SKU"
                                    value={filterSku}
                                    onChange={(e) => setFilterSku(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterDescription"
                                    label="Təsvir"
                                    value={filterDescription}
                                    onChange={(e) => setFilterDescription(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterMinPrice"
                                    label={`Ən az qiymət${defaultCurrency ? ` (${defaultCurrency})` : ""}`}
                                    type="number"
                                    step="0.01"
                                    value={filterMinPrice}
                                    onChange={(e) => setFilterMinPrice(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <FloatingLabelInput
                                    id="filterMaxPrice"
                                    label={`Ən çox qiymət${defaultCurrency ? ` (${defaultCurrency})` : ""}`}
                                    type="number"
                                    step="0.01"
                                    value={filterMaxPrice}
                                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Kateqoriya</Label>
                                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                                    <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                        <SelectValue placeholder="Kateqoriya seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Brend</Label>
                                <Select value={filterBrandId} onValueChange={setFilterBrandId}>
                                    <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                        <SelectValue placeholder="Brend seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id.toString()}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ölçü vahidi</Label>
                                <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                                    <SelectTrigger className="h-10 px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0">
                                        <SelectValue placeholder="Vahid seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] overflow-y-auto">
                                        <SelectItem value="all">Hamısı</SelectItem>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                                {unit.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                    <TableHead>Ad</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Qiymət</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Əməliyyatlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Skeleton className="size-16 rounded-md" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[150px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[100px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-[80px]" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-6 w-[70px]" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Skeleton className="size-8" />
                                                    <Skeleton className="size-8" />
                                                    <Skeleton className="size-8" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-sm text-gray-500">Heç bir məhsul tapılmadı</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <img
                                                    src={product.imageUrl || "/images/no-product-photo.png"}
                                                    alt={product.name}
                                                    width={64}
                                                    height={64}
                                                    className="aspect-square rounded-md object-cover"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.sku || "N/A"}</TableCell>
                                            <TableCell className="font-semibold text-green-600">{formatPrice(product.price)}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.active ? "default" : "secondary"}>
                                                    {product.active ? "Aktiv" : "Deaktiv"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(product)}
                                                        disabled={deletingId !== null}
                                                        title="Təfərrüatları gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(product)}
                                                        disabled={deletingId !== null}
                                                        title="Redaktə et"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                        disabled={deletingId === product.id}
                                                        title="Sil"
                                                    >
                                                        {deletingId === product.id ? (
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
