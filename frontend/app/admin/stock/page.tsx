'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'
import { useT } from '@/lib/i18n'
import { AlertTriangle, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState('')
  const { token, user } = useAuthStore()
  const logout = useAuthStore((state) => state.logout)
  const t = useT()

  useEffect(() => {
    if (user?.tenantId) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/products/${user!.tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async () => {
    if (!selectedProduct || !newStock) return

    try {
      const response = await fetch(`http://localhost:5000/products/${user!.tenantId}/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          stock: parseInt(newStock),
        }),
      })

      if (response.ok) {
        fetchProducts()
        setDialogOpen(false)
        setSelectedProduct(null)
        setNewStock('')
      } else {
        alert('Failed to update stock')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      alert('Error updating stock')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600', icon: AlertTriangle, text: 'Out of Stock' }
    if (stock < 10) return { color: 'text-yellow-600', icon: AlertTriangle, text: 'Low Stock' }
    return { color: 'text-green-600', icon: Package, text: 'In Stock' }
  }

  if (loading) return <div>Loading...</div>

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-center">Stock Management</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <div className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin" className="w-full">{t('admin.sidebar.dashboard')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/sales" className="w-full">{t('admin.sidebar.sales')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/subscriptions" className="w-full">{t('admin.sidebar.subscriptions')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/products" className="w-full">{t('admin.sidebar.products')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/stock" className="w-full">{t('admin.sidebar.stock')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="w-full">{t('admin.sidebar.statistics')}</SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarContent>
          <UserMenu />
        </Sidebar>
        <main className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-6">
            <SidebarTrigger />
            <h1 className="text-3xl font-bold">Stock Management</h1>
          </div>

          <div className="grid gap-6">
            <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Inventory Overview</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Manage product stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {products.map((product) => {
                    const status = getStockStatus(product.stock)
                    const StatusIcon = status.icon
                    return (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
                          <div className="flex items-center mt-2">
                            <StatusIcon className={`w-4 h-4 mr-2 ${status.color}`} />
                            <span className={`text-sm ${status.color}`}>{status.text}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{product.stock}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">in stock</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product)
                              setNewStock(product.stock.toString())
                              setDialogOpen(true)
                            }}
                          >
                            Update Stock
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Stock</DialogTitle>
                <DialogDescription>
                  Update the stock level for {selectedProduct?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    New Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateStock}>Update</Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  )
}
