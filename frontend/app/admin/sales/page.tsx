'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'
import { useT } from '@/lib/i18n'
import { ShoppingCart } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface SaleItem {
  id: string
  quantity: number
  price: number
  product: Product
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  price: number
}

interface Sale {
  id: string
  total: number
  date: string
  items: SaleItem[]
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [newSale, setNewSale] = useState({ productId: '', quantity: '', amount: '' })
  const [saleCart, setSaleCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedQuantity, setSelectedQuantity] = useState('')
  const [stockUpdates, setStockUpdates] = useState<{[key: string]: boolean}>({})
  const { token, user } = useAuthStore()
  const logout = useAuthStore((state) => state.logout)
  const t = useT()
  const { socket } = useSocket(user?.tenantId)

  useEffect(() => {
    if (user?.tenantId) {
      fetchSales()
      fetchProducts()
    } else {
      setLoading(false)
    }
  }, [user?.tenantId])

  // Listen for real-time stock updates
  useEffect(() => {
    if (!socket) return

    const handleStockUpdate = (data: { productId: string; newStock: number }) => {
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === data.productId
            ? { ...product, stock: data.newStock }
            : product
        )
      )
      
      // Mark product as recently updated
      setStockUpdates(prev => ({ ...prev, [data.productId]: true }))
      
      // Remove the highlight after 3 seconds
      setTimeout(() => {
        setStockUpdates(prev => ({ ...prev, [data.productId]: false }))
      }, 3000)
    }

    socket.on('stockUpdate', handleStockUpdate)

    return () => {
      socket.off('stockUpdate', handleStockUpdate)
    }
  }, [socket])

  const fetchSales = async () => {
    try {
      const response = await fetch(`http://localhost:5000/sales/${user!.tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const createSale = async () => {
    try {
      const response = await fetch(`http://localhost:5000/sales/${user!.tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{
            productId: newSale.productId,
            quantity: parseInt(newSale.quantity),
          }],
        }),
      })
      if (response.ok) {
        alert('Sale created successfully!')
        setDialogOpen(false)
        setNewSale({ productId: '', quantity: '', amount: '' })
        fetchSales()
      } else {
        alert('Failed to create sale')
      }
    } catch (error) {
      console.error('Error creating sale:', error)
      alert('Error creating sale')
    }
  }

  const addToCart = () => {
    console.log('addToCart called with:', { selectedProduct, selectedQuantity, products: products.length })

    if (!selectedProduct || !selectedQuantity) {
      alert('Please select a product and quantity')
      return
    }

    if (products.length === 0) {
      alert('Products not loaded yet. Please wait.')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    console.log('Found product:', product)

    if (!product) {
      alert('Product not found')
      return
    }

    const quantity = parseInt(selectedQuantity)
    if (quantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    if (quantity > product.stock) {
      alert('Not enough stock available')
      return
    }

    // Check if product is already in cart
    const existingItem = saleCart.find(item => item.productId === selectedProduct)
    if (existingItem) {
      // Update quantity
      const newCart = saleCart.map(item =>
        item.productId === selectedProduct
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
      console.log('Updated existing item in cart:', newCart)
      setSaleCart(newCart)
    } else {
      // Add new item
      const newItem = {
        productId: selectedProduct,
        product,
        quantity,
        price: product.price
      }
      const newCart = [...saleCart, newItem]
      console.log('Added new item to cart:', newCart)
      setSaleCart(newCart)
    }

    setSelectedProduct('')
    setSelectedQuantity('')
  }

  const removeFromCart = (productId: string) => {
    setSaleCart(saleCart.filter(item => item.productId !== productId))
  }

  const finalizeSale = async () => {
    if (saleCart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!user || !token) {
      alert('You must be logged in to complete a sale')
      return
    }

    console.log('Finalizing sale with cart:', saleCart)
    console.log('User:', user)
    console.log('Token exists:', !!token)

    try {
      const requestBody = {
        items: saleCart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }
      console.log('Request body:', requestBody)
      console.log('URL:', `http://localhost:5000/sales/${user.tenantId}`)

      const response = await fetch(`http://localhost:5000/sales/${user.tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)

      if (response.ok) {
        const result = JSON.parse(responseText)
        console.log('Sale created successfully:', result)
        alert('Sale completed successfully!')
        setSaleCart([])
        setCartDialogOpen(false)
        fetchSales()
        fetchProducts() // Refresh stock levels
      } else {
        console.error('Failed to complete sale:', response.status, responseText)
        try {
          const errorData = JSON.parse(responseText)
          alert(`Failed to complete sale: ${errorData.message || 'Unknown error'}`)
        } catch {
          alert(`Failed to complete sale: ${responseText}`)
        }
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      alert(`Error completing sale: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getCartTotal = () => {
    return saleCart.reduce((total, item) => total + (item.price * item.quantity), 0)
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
            <h1 className="text-3xl font-bold">{t('admin.titles.sales_management')}</h1>
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {socket ? t('admin.labels.live_updates') : t('admin.labels.offline')}
              </span>
            </div>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              {t('admin.titles.logout')}
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-semibold">
                  {user?.role === 'VENDEUR' ? 'Create Sales' : 'All Sales'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'VENDEUR' ? 'Record your sales transactions' : 'View all sales transactions'}
                </p>
              </div>
              <div className="flex gap-2">
                {(user?.role === 'VENDEUR' || user?.role === 'DIRECTEUR') && (
                  <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="relative">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sale Cart
                        {saleCart.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {saleCart.length}
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Sale Cart</DialogTitle>
                      <DialogDescription>Add products to your sale and finalize the transaction.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Add to cart section */}
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <h4 className="font-medium mb-3">Add Product to Cart</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cart-product">Product</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <span className={stockUpdates[product.id] ? 'text-green-600 font-semibold animate-pulse' : ''}>
                                      {product.name} - ${product.price} (Stock: {product.stock})
                                      {stockUpdates[product.id] && ' 🔄'}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="cart-quantity">Quantity</Label>
                            <Input
                              id="cart-quantity"
                              type="number"
                              min="1"
                              value={selectedQuantity}
                              onChange={(e) => setSelectedQuantity(e.target.value)}
                              placeholder="Enter quantity"
                            />
                          </div>
                        </div>
                        <Button onClick={addToCart} className="w-full mt-3" size="sm">
                          Add to Sale
                        </Button>
                      </div>

                      {/* Cart items */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Cart Items ({saleCart.length})</h4>
                        {saleCart.length === 0 ? (
                          <p className="text-gray-500 text-sm">No items in cart</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {saleCart.map((item) => (
                              <div key={item.productId} className="flex justify-between items-center p-3 border rounded">
                                <div>
                                  <p className="font-medium">{item.product.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFromCart(item.productId)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Total and finalize */}
                      {saleCart.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold">Total: ${getCartTotal().toFixed(2)}</span>
                          </div>
                          <Button onClick={finalizeSale} className="w-full">
                            Complete Sale
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                )}

                {(user?.role === 'VENDEUR' || user?.role === 'DIRECTEUR') && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Quick Sale</Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quick Sale</DialogTitle>
                      <DialogDescription>Record a simple sale with one product.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sale-product">Product</Label>
                        <Select value={newSale.productId} onValueChange={(value) => setNewSale({ ...newSale, productId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <span className={stockUpdates[product.id] ? 'text-green-600 font-semibold animate-pulse' : ''}>
                                  {product.name} - ${product.price} (Stock: {product.stock})
                                  {stockUpdates[product.id] && ' 🔄'}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="sale-quantity">Quantity</Label>
                        <Input
                          id="sale-quantity"
                          type="number"
                          value={newSale.quantity}
                          onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                        />
                      </div>
                      <Button onClick={createSale} className="w-full">Record Sale</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4">
              {sales.map((sale) => (
                <Card key={sale.id} className="hover:shadow-lg transition-shadow flex-shrink-0 w-80">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-xl">Sale #{sale.id.slice(-8)}</h3>
                          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {sale.items.map((item, index) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              <div>
                                <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Quantity: {item.quantity} × ${item.price} = ${(item.quantity * item.price).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                          {new Date(sale.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-3xl font-bold text-green-600 dark:text-white mb-3">${sale.total}</p>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sales.length === 0 && (
              <Card className="p-12 text-center">
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No sales recorded yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
