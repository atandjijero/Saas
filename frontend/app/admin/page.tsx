'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'

interface User {
  id: string
  email: string
  role: string
}

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

interface Sale {
  id: string
  total: number
  date: string
  items: SaleItem[]
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([])
  const { token, user } = useAuthStore()
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

  // Fetch data when user is available
  useEffect(() => {
    if (user?.tenantId) {
      fetchUsers()
      fetchRevenueStats()
    } else {
      setLoading(false)
    }
  }, [user?.tenantId])

  // Form states
  const [userDialog, setUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'USER' })

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/')
      return
    }

    if (user?.tenantId) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [user, token, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/users/${user!.tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueStats = async () => {
    try {
      // Get data for the last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await fetch(`http://localhost:5000/stats/revenue/${user!.tenantId}?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Transform data for the chart
        const transformedData = data.map((item: any) => ({
          date: item.date,
          amount: item.amount
        }))
        setChartData(transformedData)
      }
    } catch (error) {
      console.error('Error fetching revenue stats:', error)
      // Fallback to empty data
      setChartData([])
    }
  }

  const createUser = async () => {
    console.log('Creating user:', newUser.email, newUser.role)
    try {
      const response = await fetch(`http://localhost:5000/users/${user!.tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })
      if (response.ok) {
        console.log('User created successfully')
        fetchUsers()
        setUserDialog(false)
        setNewUser({ email: '', password: '', role: 'USER' })
      } else {
        console.error('Failed to create user:', response.status, await response.text())
        alert('Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user')
    }
  }

  if (loading) return <div>Loading...</div>

  // Don't render anything until client-side hydration and auth check
  if (!isClient || !token || !user) {
    return <div>Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-center">
              {user?.role === 'VENDEUR' ? 'Seller Dashboard' : 'Director Dashboard'}
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <div className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin" className="w-full">Dashboard</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/sales" className="w-full">Sales</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user?.role !== 'VENDEUR' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/products" className="w-full">Products</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role !== 'VENDEUR' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">Statistics</SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </div>
            </SidebarMenu>
          </SidebarContent>
          <UserMenu />
        </Sidebar>
        <main className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-6">
            <SidebarTrigger />
            <h1 className="text-3xl font-bold">
              {user?.role === 'VENDEUR' ? 'Seller Dashboard' : 'Director Dashboard'}
            </h1>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              Logout
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-white">{users.length}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-white">24</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600 dark:text-white">$12,450</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Sales Chart</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ amount: { label: 'Amount' } }} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.length > 0 ? chartData : [{ date: 'No data', amount: 0 }]}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {user?.role !== 'VENDEUR' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Dialog open={userDialog} onOpenChange={setUserDialog}>
                        <DialogTrigger asChild>
                          <Button>Add User</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>Create a new user for your team.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="user-email">Email</Label>
                              <Input
                                id="user-email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="user-password">Password</Label>
                              <Input
                                id="user-password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="user-role">Role</Label>
                              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">User</SelectItem>
                                  <SelectItem value="GERANT">Manager</SelectItem>
                                  <SelectItem value="VENDEUR">Seller</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={createUser} className="w-full">Create User</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <ul className="space-y-2">
                      {users.map((u) => (
                        <li key={u.id} className="flex justify-between items-center py-2 border-b">
                          <span>{u.email} - {u.role}</span>
                          <Button variant="outline" size="sm">Edit</Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {user?.role === 'VENDEUR' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common seller tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button asChild className="w-full">
                        <Link href="/admin/sales">📊 View Sales</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/admin/products">📦 View Products</Link>
                      </Button>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Focus on selling! Your main task is to create sales transactions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Revenue Chart */}
            {user?.role !== 'VENDEUR' && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Daily revenue for the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}