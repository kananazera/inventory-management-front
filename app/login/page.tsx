"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShoppingBag } from "lucide-react"
import { FloatingLabelInput } from "@/components/floating-label-input"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("token", data.token)
        localStorage.setItem("username", username)
        router.push("/dashboard")
      } else {
        setError("Giriş məlumatları yanlışdır")
      }
    } catch (error) {
      setError("Bağlantı xətası baş verdi")
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Inventory management system</CardTitle>{" "}
            {/* "Giriş" -> "Inventory Management System" */}
            <CardDescription>Hesabınıza daxil olun</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}
              <div className="space-y-2">
                <FloatingLabelInput
                    id="username"
                    label="İstifadəçi adı"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <FloatingLabelInput
                    id="password"
                    label="Şifrə"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-6 w-6 animate-spin text-black" />}
                Daxil ol
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}
