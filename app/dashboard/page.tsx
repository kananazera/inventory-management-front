"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tags, Layers, Scale } from "lucide-react"

interface Stats {
  products: number
  categories: number
  brands: number
  units: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    categories: 0,
    brands: 0,
    units: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const [productsRes, categoriesRes, brandsRes, unitsRes] = await Promise.all([
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
        ])

        const [products, categories, brands, units] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
          brandsRes.json(),
          unitsRes.json(),
        ])

        setStats({
          products: products.length || 0,
          categories: categories.length || 0,
          brands: brands.length || 0,
          units: units.length || 0,
        })
      } catch (error) {
        console.error("Stats yüklənmədi:", error)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Məhsullar",
      value: stats.products,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Kateqoriyalar",
      value: stats.categories,
      icon: Tags,
      color: "text-green-600",
      bgColor: "bg-green-100",
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
      color: "text-orange-600",
      bgColor: "bg-orange-100",
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
                <p className="text-gray-600 pt-4">Bu paneldə aşağıdakı əməliyyatları həyata keçirə bilərsiniz:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Məhsulları əlavə etmək, redaktə etmək və silmək</li>
                  <li>Kateqoriyaları idarə etmək</li>
                  <li>Brendləri idarə etmək</li>
                  <li>Ölçü vahidlərini idarə etmək</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
