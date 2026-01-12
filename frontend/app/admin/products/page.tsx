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
import { API_BASE_URL } from '@/lib/api'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '' })
  const [editProduct, setEditProduct] = useState({ name: '', description: '', price: '', stock: '' })
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
      const response = await fetch(`${API_BASE_URL}/products/${user!.tenantId}`, {
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

  const updateProduct = async (productId: string, updatedProduct: Partial<Product>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${user!.tenantId}/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProduct),
      })
      if (response.ok) {
        alert('Product updated successfully!')
        fetchProducts()
      } else {
        alert('Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product')
    }
  }

  const createProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${user!.tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
        }),
      })
      if (response.ok) {
        alert('Product created successfully!')
        setDialogOpen(false)
        setNewProduct({ name: '', description: '', price: '', stock: '' })
        fetchProducts()
      } else {
        alert('Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Error creating product')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/products/${user!.tenantId}/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        alert('Product deleted successfully!')
        fetchProducts()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setEditProduct({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    await updateProduct(editingProduct.id, {
      name: editProduct.name,
      description: editProduct.description,
      price: parseFloat(editProduct.price),
      stock: parseInt(editProduct.stock),
    })

    setEditDialogOpen(false)
    setEditingProduct(null)
  }

  if (loading) return <div>Loading...</div>

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-center">Director Dashboard</h2>
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
            <h1 className="text-3xl font-bold">Products Management</h1>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              {t('admin.titles.logout')}
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-semibold">All Products</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage your product inventory</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Product</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Add a product to your inventory.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product-name">Name</Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-description">Description</Label>
                      <Input
                        id="product-description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-price">Price</Label>
                      <Input
                        id="product-price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-stock">Stock</Label>
                      <Input
                        id="product-stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>
                    <Button onClick={createProduct} className="w-full">Create Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Product Dialog */}
            <div className="mb-6">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>Update product information.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-product-name">Name</Label>
                      <Input
                        id="edit-product-name"
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-product-description">Description</Label>
                      <Input
                        id="edit-product-description"
                        value={editProduct.description}
                        onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-product-price">Price</Label>
                      <Input
                        id="edit-product-price"
                        type="number"
                        value={editProduct.price}
                        onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-product-stock">Stock</Label>
                      <Input
                        id="edit-product-stock"
                        type="number"
                        value={editProduct.stock}
                        onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleUpdateProduct} className="w-full">Update Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-3xl font-bold text-blue-600 dark:text-white">${product.price}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => openEditDialog(product)}>Edit</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => deleteProduct(product.id)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <Card className="p-12 text-center">
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No products added yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
