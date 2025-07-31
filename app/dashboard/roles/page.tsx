"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus, Edit, Trash2, Search, Loader2, RotateCcw } from "lucide-react"
import Swal from "sweetalert2"
import { FloatingLabelInput } from "@/components/floating-label-input"

interface UserRole {
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

export default function UserRolesPage() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUserRole, setEditingUserRole] = useState<UserRole | null>(null)
  const [filterName, setFilterName] = useState("") // Filter input state
  const [formData, setFormData] = useState({ name: "" })
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [ignoreDialogClose, setIgnoreDialogClose] = useState(false) // New state for ignoring dialog close

  const fetchUserRoles = useCallback(async (filterParams: { name?: string }) => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Token tapılmadı. İstifadəçi rolları yüklənmədi.")
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8080/api/roles/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filterParams),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Naməlum xəta" }))
        console.error("İstifadəçi rollarını çəkərkən xəta:", response.status, errorData)
        showSwal({
          title: "Xəta!",
          text: errorData.message || errorData.error || `İstifadəçi rolları yüklənmədi: Status ${response.status}`,
          icon: "error",
          confirmButtonColor: "#ef4444",
          allowOutsideClick: false, // Override default for errors
          allowEscapeKey: false, // Override default for errors
          didOpenCustom: () => setIgnoreDialogClose(true),
          willCloseCustom: () => setTimeout(() => setIgnoreDialogClose(false), 50),
        })
        setUserRoles([])
        return
      }
      const data = await response.json()
      console.log("Rol API cavabı:", data)
      setUserRoles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("İstifadəçi rollarını çəkərkən bağlantı xətası:", error)
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
      setUserRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserRoles({})
  }, [fetchUserRoles])

  const handleFilter = () => {
    fetchUserRoles({ name: filterName })
  }

  const resetFilters = () => {
    setFilterName("")
    fetchUserRoles({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return
    setIsSubmittingForm(true)
    try {
      const url = editingUserRole
          ? `http://localhost:8080/api/roles/${editingUserRole.id}`
          : "http://localhost:8080/api/roles"
      const method = editingUserRole ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
          text: editingUserRole ? "İstifadəçi rolu uğurla yeniləndi" : "İstifadəçi rolu uğurla əlavə edildi",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          timerProgressBar: true,
        })
        setDialogOpen(false) // This closes the main dialog ONLY on success
        resetForm()
        fetchUserRoles({})
      } else {
        showSwal({
          title: "Xəta!",
          text: responseData.message || responseData.error || "Əməliyyat uğursuz oldu",
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

  const handleEdit = (userRole: UserRole) => {
    setEditingUserRole(userRole)
    setFormData({ name: userRole.name })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    const result = await showSwal({
      title: "Əminsiniz?",
      text: "Bu istifadəçi rolunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz!",
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
      const response = await fetch(`http://localhost:8080/api/roles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        await showSwal({
          title: "Silindi!",
          text: "İstifadəçi rolu uğurla silindi",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          timerProgressBar: true,
        })
        fetchUserRoles({})
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
    setFormData({ name: "" })
    setEditingUserRole(null)
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

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-black" />
        </div>
    )
  }

  return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İstifadəçi rolları</h1>
            <p className="mt-2 text-gray-600">İstifadəçi rollarını idarə edin</p>
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
                Yeni istifadəçi rolu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUserRole ? "İstifadəçi rolunu redaktə et" : "Yeni istifadəçi rolu əlavə et"}
                </DialogTitle>
                <DialogDescription>İstifadəçi rolu məlumatlarını daxil edin</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <FloatingLabelInput
                        id="user-role-name"
                        label="Ad *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmittingForm}
                    />
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
                    {editingUserRole ? "Yenilə" : "Əlavə et"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FloatingLabelInput
                  id="user-role-search"
                  label="Rol adı axtar..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="max-w-sm"
              />
              <Button onClick={handleFilter} size="icon" title="Filterlə">
                <Search className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
              <Button onClick={resetFilters} size="icon" variant="outline" title="Filterləri sıfırla">
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Filterləri sıfırla</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Əməliyyatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => (
                      <TableRow key={userRole.id}>
                        <TableCell>{userRole.id}</TableCell>
                        <TableCell className="font-medium">{userRole.name}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(userRole)}
                                disabled={deletingId !== null}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(userRole.id)}
                                className="text-red-600 hover:text-red-700"
                                disabled={deletingId === userRole.id}
                            >
                              {deletingId === userRole.id ? (
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
