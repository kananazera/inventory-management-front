"use client"

import type React from "react"
import { Search } from "lucide-react" // Search import edildi

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
import { Plus, Edit, Trash2, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input" // FloatingLabelInput import edildi

interface Product {
  id: number
  name: string
  price: number
  sku: string | null
  category_id: number | null
  brand_id: number | null
  unit_id: number | null
  active: boolean
}

interface Category {
  id: number
  name: string
}

interface Brand {
  id: number
  name: string
}

interface Unit {
  id: number
  name: string
}

interface ApiResponse {
  message?: string
  error?: string
  success?: boolean
  data?: any
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Filter states
  const [filterName, setFilterName] = useState("")
  const [filterSku, setFilterSku] = useState("")
  const [filterCategoryId, setFilterCategoryId] = useState<string>("")
  const [filterBrandId, setFilterBrandId] = useState<string>("")
  const [filterUnitId, setFilterUnitId] = useState<string>("")
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  const [filterMinPrice, setFilterMinPrice] = useState("")
  const [filterMaxPrice, setFilterMaxPrice] = useState("")

  // Combobox states for filters
  const [filterCategoryOpen, setFilterCategoryOpen] = useState(false)
  const [filterBrandOpen, setFilterBrandOpen] = useState(false)
  const [filterUnitOpen, setFilterUnitOpen] = useState(false)

  // Combobox states for form
  const [formCategoryOpen, setFormCategoryOpen] = useState(false)
  const [formBrandOpen, setFormBrandOpen] = useState(false)
  const [formUnitOpen, setFormUnitOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    sku: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    active: true,
  })

  const fetchData = useCallback(async (filterParams: Record<string, any> = {}) => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Token tapılmadı. Məlumatlar yüklənmədi.")
      setLoading(false)
      return
    }

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
        await Swal.fire({
          title: "Xəta!",
          text: errorData.message || errorData.error || `Məhsullar yüklənmədi: Status ${productsRes.status}`,
          icon: "error",
          confirmButtonColor: "#ef4444",
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

      console.log("Kateqoriya API cavabı (form üçün):", categoriesData)
      console.log("Brend API cavabı (form üçün):", brandsData)
      console.log("Vahid API cavabı (form üçün):", unitsData)

      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setBrands(Array.isArray(brandsData) ? brandsData : [])
      setUnits(Array.isArray(unitsData) ? unitsData : [])
    } catch (error) {
      console.error("Məlumatları çəkərkən bağlantı xətası:", error)
      await Swal.fire({
        title: "Xəta!",
        text: "Bağlantı xətası baş verdi",
        icon: "error",
        confirmButtonColor: "#ef4444",
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
    fetchData({})
  }, [fetchData])

  const handleFilter = () => {
    const filterParams: Record<string, any> = {}
    if (filterName) filterParams.name = filterName
    if (filterSku) filterParams.sku = filterSku
    if (filterCategoryId) filterParams.categoryId = Number.parseInt(filterCategoryId)
    if (filterBrandId) filterParams.brandId = Number.parseInt(filterBrandId)
    if (filterUnitId) filterParams.unitId = Number.parseInt(filterUnitId)
    if (filterActive !== null) filterParams.active = filterActive
    if (filterMinPrice) filterParams.minPrice = Number.parseFloat(filterMinPrice)
    if (filterMaxPrice) filterParams.maxPrice = Number.parseFloat(filterMaxPrice)

    fetchData(filterParams)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return

    setIsSubmittingForm(true)

    try {
      const url = editingProduct
          ? `http://localhost:8080/api/products/${editingProduct.id}`
          : "http://localhost:8080/api/products"

      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number.parseFloat(formData.price),
          sku: formData.sku || null,
          category_id: formData.category_id ? Number.parseInt(formData.category_id) : null,
          brand_id: formData.brand_id ? Number.parseInt(formData.brand_id) : null,
          unit_id: formData.unit_id ? Number.parseInt(formData.unit_id) : null,
          active: formData.active,
        }),
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
          text: editingProduct ? "Məhsul uğurla yeniləndi" : "Məhsul uğurla əlavə edildi",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          timerProgressBar: true,
        })
        setDialogOpen(false)
        resetForm()
        fetchData({})
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      sku: product.sku || "",
      category_id: product.category_id ? product.category_id.toString() : "",
      brand_id: product.brand_id ? product.brand_id.toString() : "",
      unit_id: product.unit_id ? product.unit_id.toString() : "",
      active: product.active,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
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

    const token = localStorage.getItem("token")
    if (!token) return

    setDeletingId(id)

    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        await Swal.fire({
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
      name: "",
      price: "",
      sku: "",
      category_id: "",
      brand_id: "",
      unit_id: "",
      active: true,
    })
    setEditingProduct(null)
    setFormCategoryOpen(false)
    setFormBrandOpen(false)
    setFormUnitOpen(false)
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Seçilməyib"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Bilinmir"
  }

  const getBrandName = (brandId: number | null) => {
    if (!brandId) return "Seçilməyib"
    const brand = brands.find((b) => b.id === brandId)
    return brand ? brand.name : "Bilinmir"
  }

  const getUnitName = (unitId: number | null) => {
    if (!unitId) return "Seçilməyib"
    const unit = units.find((u) => u.id === unitId)
    return unit ? unit.name : "Bilinmir"
  }

  return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Məhsullar</h1>
            <p className="mt-2 text-gray-600">Məhsulları idarə edin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni məhsul
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Məhsulu redaktə et" : "Yeni məhsul əlavə et"}</DialogTitle>
                <DialogDescription>Məhsul məlumatlarını daxil edin</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FloatingLabelInput
                          id="product-name"
                          label="Ad *"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          disabled={isSubmittingForm}
                      />
                    </div>
                    <div className="space-y-2">
                      <FloatingLabelInput
                          id="product-price"
                          label="Qiymət *"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          disabled={isSubmittingForm}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FloatingLabelInput
                          id="product-sku"
                          label="SKU"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          disabled={isSubmittingForm}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kateqoriya</Label>
                      <Popover open={formCategoryOpen} onOpenChange={setFormCategoryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={formCategoryOpen}
                              className="w-full justify-between bg-transparent"
                              disabled={isSubmittingForm}
                          >
                            {formData.category_id
                                ? categories.find((category) => category.id.toString() === formData.category_id)?.name
                                : "Kateqoriya seçin..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Kateqoriya axtar..." />
                            <CommandList>
                              <CommandEmpty>Kateqoriya tapılmadı.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => {
                                      setFormData({ ...formData, category_id: "" })
                                      setFormCategoryOpen(false)
                                    }}
                                >
                                  <Check
                                      className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.category_id === "" ? "opacity-100" : "opacity-0",
                                      )}
                                  />
                                  Seçim yoxdur
                                </CommandItem>
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                          setFormData({ ...formData, category_id: category.id.toString() })
                                          setFormCategoryOpen(false)
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.category_id === category.id.toString() ? "opacity-100" : "opacity-0",
                                          )}
                                      />
                                      {category.name}
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brend</Label>
                      <Popover open={formBrandOpen} onOpenChange={setFormBrandOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={formBrandOpen}
                              className="w-full justify-between bg-transparent"
                              disabled={isSubmittingForm}
                          >
                            {formData.brand_id
                                ? brands.find((brand) => brand.id.toString() === formData.brand_id)?.name
                                : "Brend seçin..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Brend axtar..." />
                            <CommandList>
                              <CommandEmpty>Brend tapılmadı.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => {
                                      setFormData({ ...formData, brand_id: "" })
                                      setFormBrandOpen(false)
                                    }}
                                >
                                  <Check
                                      className={cn("mr-2 h-4 w-4", formData.brand_id === "" ? "opacity-100" : "opacity-0")}
                                  />
                                  Seçim yoxdur
                                </CommandItem>
                                {brands.map((brand) => (
                                    <CommandItem
                                        key={brand.id}
                                        value={brand.name}
                                        onSelect={() => {
                                          setFormData({ ...formData, brand_id: brand.id.toString() })
                                          setFormBrandOpen(false)
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.brand_id === brand.id.toString() ? "opacity-100" : "opacity-0",
                                          )}
                                      />
                                      {brand.name}
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Ölçü vahidi</Label>
                      <Popover open={formUnitOpen} onOpenChange={setFormUnitOpen}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={formUnitOpen}
                              className="w-full justify-between bg-transparent"
                              disabled={isSubmittingForm}
                          >
                            {formData.unit_id
                                ? units.find((unit) => unit.id.toString() === formData.unit_id)?.name
                                : "Vahid seçin..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Vahid axtar..." />
                            <CommandList>
                              <CommandEmpty>Vahid tapılmadı.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => {
                                      setFormData({ ...formData, unit_id: "" })
                                      setFormUnitOpen(false)
                                    }}
                                >
                                  <Check
                                      className={cn("mr-2 h-4 w-4", formData.unit_id === "" ? "opacity-100" : "opacity-0")}
                                  />
                                  Seçim yoxdur
                                </CommandItem>
                                {units.map((unit) => (
                                    <CommandItem
                                        key={unit.id}
                                        value={unit.name}
                                        onSelect={() => {
                                          setFormData({ ...formData, unit_id: unit.id.toString() })
                                          setFormUnitOpen(false)
                                        }}
                                    >
                                      <Check
                                          className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.unit_id === unit.id.toString() ? "opacity-100" : "opacity-0",
                                          )}
                                      />
                                      {unit.name}
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                    Əlavə et
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    id="filterMinPrice"
                    label="Min qiymət"
                    type="number"
                    step="0.01"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FloatingLabelInput
                    id="filterMaxPrice"
                    label="Max qiymət"
                    type="number"
                    step="0.01"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kateqoriya</Label>
                <Popover open={filterCategoryOpen} onOpenChange={setFilterCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={filterCategoryOpen}
                        className="w-full justify-between bg-transparent"
                    >
                      {filterCategoryId
                          ? categories.find((category) => category.id.toString() === filterCategoryId)?.name
                          : "Kateqoriya seçin..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Kateqoriya axtar..." />
                      <CommandList>
                        <CommandEmpty>Kateqoriya tapılmadı.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                              value=""
                              onSelect={() => {
                                setFilterCategoryId("")
                                setFilterCategoryOpen(false)
                              }}
                          >
                            <Check
                                className={cn("mr-2 h-4 w-4", filterCategoryId === "" ? "opacity-100" : "opacity-0")}
                            />
                            Hamısı
                          </CommandItem>
                          {categories.map((category) => (
                              <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    setFilterCategoryId(category.id.toString())
                                    setFilterCategoryOpen(false)
                                  }}
                              >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        filterCategoryId === category.id.toString() ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                {category.name}
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Brend</Label>
                <Popover open={filterBrandOpen} onOpenChange={setFilterBrandOpen}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={filterBrandOpen}
                        className="w-full justify-between bg-transparent"
                    >
                      {filterBrandId
                          ? brands.find((brand) => brand.id.toString() === filterBrandId)?.name
                          : "Brend seçin..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Brend axtar..." />
                      <CommandList>
                        <CommandEmpty>Brend tapılmadı.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                              value=""
                              onSelect={() => {
                                setFilterBrandId("")
                                setFilterBrandOpen(false)
                              }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterBrandId === "" ? "opacity-100" : "opacity-0")} />
                            Hamısı
                          </CommandItem>
                          {brands.map((brand) => (
                              <CommandItem
                                  key={brand.id}
                                  value={brand.name}
                                  onSelect={() => {
                                    setFilterBrandId(brand.id.toString())
                                    setFilterBrandOpen(false)
                                  }}
                              >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        filterBrandId === brand.id.toString() ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                {brand.name}
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ölçü vahidi</Label>
                <Popover open={filterUnitOpen} onOpenChange={setFilterUnitOpen}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={filterUnitOpen}
                        className="w-full justify-between bg-transparent"
                    >
                      {filterUnitId ? units.find((unit) => unit.id.toString() === filterUnitId)?.name : "Vahid seçin..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Vahid axtar..." />
                      <CommandList>
                        <CommandEmpty>Vahid tapılmadı.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                              value=""
                              onSelect={() => {
                                setFilterUnitId("")
                                setFilterUnitOpen(false)
                              }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterUnitId === "" ? "opacity-100" : "opacity-0")} />
                            Hamısı
                          </CommandItem>
                          {units.map((unit) => (
                              <CommandItem
                                  key={unit.id}
                                  value={unit.name}
                                  onSelect={() => {
                                    setFilterUnitId(unit.id.toString())
                                    setFilterUnitOpen(false)
                                  }}
                              >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        filterUnitId === unit.id.toString() ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                {unit.name}
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                      {filterActive === true ? "Aktiv" : filterActive === false ? "Deaktiv" : "Hamısı"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandList>
                        <CommandEmpty>Status tapılmadı.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all" onSelect={() => setFilterActive(null)}>
                            <Check className={cn("mr-2 h-4 w-4", filterActive === null ? "opacity-100" : "opacity-0")} />
                            Hamısı
                          </CommandItem>
                          <CommandItem value="active" onSelect={() => setFilterActive(true)}>
                            <Check className={cn("mr-2 h-4 w-4", filterActive === true ? "opacity-100" : "opacity-0")} />
                            Aktiv
                          </CommandItem>
                          <CommandItem value="inactive" onSelect={() => setFilterActive(false)}>
                            <Check className={cn("mr-2 h-4 w-4", filterActive === false ? "opacity-100" : "opacity-0")} />
                            Deaktiv
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleFilter} size="icon">
                {" "}
                {/* size="icon" əlavə edildi */}
                <Search className="h-4 w-4" /> {/* İkon əlavə edildi */}
                <span className="sr-only">Filterlə</span> {/* Əlçatanlıq üçün əlavə edildi */}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Qiymət</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Kateqoriya</TableHead>
                    <TableHead>Brend</TableHead>
                    <TableHead>Ölçü vahidi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Əməliyyatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.price} ₼</TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(product.category_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getBrandName(product.brand_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getUnitName(product.unit_id)}
                          </Badge>
                        </TableCell>
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
                                onClick={() => handleEdit(product)}
                                disabled={deletingId !== null}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-700"
                                disabled={deletingId === product.id}
                            >
                              {deletingId === product.id ? (
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
