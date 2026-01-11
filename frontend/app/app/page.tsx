'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Sun, Moon, ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  price: number
}

interface SaleItem {
  id: string
  quantity: number
  price: number
  product: Product
}

export default function AppDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saleCart, setSaleCart] = useState<CartItem[]>([])
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState<Product | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState('')
  const [isClient, setIsClient] = useState(false)
  const { token, user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check authentication on mount
  useEffect(() => {
    if (isClient && (!token || !user)) {
      router.push('/')
      return
    }
  }, [isClient, token, user, router])

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/')
      return
    }

    if (user?.tenantId) {
      fetchProducts()
    } else {
      setLoading(false)
    }
  }, [user, token, router])

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

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  const addToCart = (product: Product) => {
    setSelectedProductForQuantity(product)
    setSelectedQuantity('1')
    setQuantityDialogOpen(true)
  }

  const confirmAddToCart = () => {
    if (!selectedProductForQuantity) return

    const quantity = parseInt(selectedQuantity)
    if (quantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    if (quantity > selectedProductForQuantity.stock) {
      alert('Not enough stock available')
      return
    }

    // Check if product is already in cart
    const existingItem = saleCart.find(item => item.productId === selectedProductForQuantity.id)
    if (existingItem) {
      // Update quantity
      setSaleCart(saleCart.map(item =>
        item.productId === selectedProductForQuantity.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      // Add new item
      const newItem = {
        productId: selectedProductForQuantity.id,
        product: selectedProductForQuantity,
        quantity,
        price: selectedProductForQuantity.price
      }
      setSaleCart([...saleCart, newItem])
    }

    setQuantityDialogOpen(false)
    setSelectedProductForQuantity(null)
    setSelectedQuantity('')
  }

  const removeFromCart = (productId: string) => {
    setSaleCart(saleCart.filter(item => item.productId !== productId))
  }

  const getCartTotal = () => {
    return saleCart.reduce((total, item) => total + (item.price * item.quantity), 0)
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

    try {
      const requestBody = {
        items: saleCart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }

      const response = await fetch(`http://localhost:5000/sales/${user.tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        alert('Sale completed successfully!')
        setSaleCart([])
        setCartDialogOpen(false)
        // Refresh products to update stock
        fetchProducts()
      } else {
        const errorText = await response.text()
        console.error('Failed to complete sale:', response.status, errorText)
        alert(`Failed to complete sale: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('Error completing sale')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  // Don't render anything until client-side hydration and auth check
  if (!isClient || !token || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.email}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {user?.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'light' ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4" />
                    )}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">{product.name}</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Stock: <span className={`font-medium ${
                    product.stock > 10 ? 'text-green-600 dark:text-white' :
                    product.stock > 0 ? 'text-yellow-600 dark:text-white' :
                    'text-red-600 dark:text-white'
                  }`}>
                    {product.stock}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-white mb-4">
                  ${product.price.toFixed(2)}
                </p>
                <Button className="w-full" onClick={() => addToCart(product)}>
                  Add to Sale
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No products available.</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Cart</DialogTitle>
                <DialogDescription>
                  Select quantity for {selectedProductForQuantity?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProductForQuantity?.stock}
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available stock: {selectedProductForQuantity?.stock}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={confirmAddToCart} className="flex-1">
                    Add to Cart
                  </Button>
                  <Button variant="outline" onClick={() => setQuantityDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="px-8 relative">
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
                <DialogDescription>Review your sale items and complete the transaction.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
        </div>
      </main>
    </div>
  )
}