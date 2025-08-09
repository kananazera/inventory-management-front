"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, ShoppingBag, Package, Tags, Layers, Scale, LogOut, Home, Currency, Users, UserRound, Settings, FileText, ShoppingCart, Warehouse, Receipt } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Setting {
    key: string
    value: string
    description: string
}

const navigation = [
    { name: "Ana səhifə", href: "/dashboard", icon: Home },
    { name: "İstifadəçilər", href: "/dashboard/users", icon: Users },
    { name: "İstifadəçi rolları", href: "/dashboard/roles", icon: UserRound },
    { name: "Təchizatçılar", href: "/dashboard/suppliers", icon: Package },
    { name: "Müştərilər", href: "/dashboard/customers", icon: ShoppingBag },
    { name: "Məhsullar", href: "/dashboard/products", icon: Package },
    { name: "Müqavilələr", href: "/dashboard/contracts", icon: FileText },
    { name: "Alışlar", href: "/dashboard/purchases", icon: ShoppingCart },
    { name: "Kateqoriyalar", href: "/dashboard/product-categories", icon: Tags },
    { name: "Brendlər", href: "/dashboard/product-brands", icon: Layers },
    { name: "Ölçü vahidləri", href: "/dashboard/product-units", icon: Scale },
    { name: "Vergilər", href: "/dashboard/taxes", icon: Receipt },
    { name: "Valyutalar", href: "/dashboard/currencies", icon: Currency },
    { name: "Anbarlar", href: "/dashboard/warehouses", icon: Warehouse },
    { name: "Xərclər", href: "/dashboard/expenses", icon: Receipt }, // Yeni əlavə
    { name: "Tənzimləmələr", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [username, setUsername] = useState("")
    const [appName, setAppName] = useState("IMS") // Default fallback

    useEffect(() => {
        const token = localStorage.getItem("token")
        const storedUsername = localStorage.getItem("username")

        if (!token) {
            router.push("/login")
        } else {
            setUsername(storedUsername || "İstifadəçi")

            // Fetch app_short_name from settings
            fetch("http://localhost:8080/api/settings", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (res.ok) {
                        return res.json()
                    }
                    throw new Error("Failed to fetch settings")
                })
                .then((settingsData: Setting[]) => {
                    const appShortNameSetting = settingsData.find((setting) => setting.key === "app_short_name")
                    if (appShortNameSetting && appShortNameSetting.value) {
                        setAppName(appShortNameSetting.value)
                    }
                })
                .catch((error) => {
                    console.warn("Failed to fetch app name from settings, using default:", error)
                    // Keep default "IMS" if settings fetch fails
                })
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        router.push("/login")
    }

    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                {/* Mobile sidebar */}
                <SheetContent side="left" className="w-64 p-0">
                    <div className="flex h-full flex-col">
                        <div className="flex h-16 items-center px-6 border-b flex-shrink-0">
                            <ShoppingBag className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold">{appName}</span>
                        </div>
                        <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </SheetContent>

                {/* Desktop sidebar */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
                    <div className="flex h-16 items-center px-6 border-b flex-shrink-0">
                        <ShoppingBag className="h-8 w-8 text-blue-600" />
                        <span className="ml-2 text-xl font-bold">{appName}</span>
                    </div>
                    <nav className="flex-1 overflow-y-auto space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Main content */}
                <div className="lg:pl-64">
                    {/* Top bar */}
                    <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1"></div>
                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                {/* User info in top bar with dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        {/* Avatar və username bir yerdə */}
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-x-2 pr-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                                    {getUserInitials(username)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-gray-700">{username}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-xs leading-none text-muted-foreground"></p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Çıxış
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Page content */}
                    <main className="py-6">
                        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
                    </main>
                </div>
            </Sheet>
        </div>
    )
}
