"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tags, Layers, Scale, Currency, Users, UserRound, UserCheck, Truck } from "lucide-react"

interface Stats {
  users: number
  roles: number
  products: number
  categories: number
  brands: number
  units: number
  currencies: number
  customers: number
  suppliers: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    roles: 0,
    products: 0,
    categories: 0,
    brands: 0,
    units: 0,
    currencies: 0,
    customers: 0,
    suppliers: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const [
          usersRes,
          rolesRes,
          productsRes,
          categoriesRes,
          brandsRes,
          unitsRes,
          currenciesRes,
          customersRes,
          suppliersRes,
        ] = await Promise.all([
          fetch("http://localhost:8080/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/roles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/product-categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/product-brands", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/product-units", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/currencies", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/customers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/suppliers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const [users, roles, products, categories, brands, units, currencies, customers, suppliers] = await Promise.all(
            [
              usersRes.json(),
              rolesRes.json(),
              productsRes.json(),
              categoriesRes.json(),
              brandsRes.json(),
              unitsRes.json(),
              currenciesRes.json(),
              customersRes.json(),
              suppliersRes.json(),
            ],
        )

        setStats({
          users: users.length || 0,
          roles: roles.length || 0,
          products: products.length || 0,
          categories: categories.length || 0,
          brands: brands.length || 0,
          units: units.length || 0,
          currencies: currencies.length || 0,
          customers: customers.length || 0,
          suppliers: suppliers.length || 0,
        })
      } catch (error) {
        console.error("Statistika yüklənmədi:", error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "İstifadəçilər",
      value: stats.users,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "İstifadəçi rolları",
      value: stats.roles,
      icon: UserRound,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Məhsullar",
      value: stats.products,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Kateqoriyalar",
      value: stats.categories,
      icon: Tags,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Brendlər",
      value: stats.brands,
      icon: Layers,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Ölçü vahidləri",
      value: stats.units,
      icon: Scale,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Valyutalar",
      value: stats.currencies,
      icon: Currency,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Müştərilər",
      value: stats.customers,
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Təchizatçılar",
      value: stats.suppliers,
      icon: Truck,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ]

  return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">İdarə paneli</h1>
          <p className="mt-2 text-gray-600">Sistem statistikalarına baxış</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 pt-4">Burada başqa statistikalar olacaq</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
