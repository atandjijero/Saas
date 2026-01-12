'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { UserMenu } from '@/components/user-menu'
import { useT } from '@/lib/i18n'
import { CheckCircle, XCircle, Plus } from 'lucide-react'

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

interface Subscription {
  id: string
  planName: string
  planType: string
  price: number
  maxUsers: number
  maxProducts: number
  features: string[]
  isActive: boolean
  startDate: string
  endDate?: string
  tenant: {
    name: string
    domain: string
  }
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [tenants, setTenants] = useState<{id: string, name: string, domain: string}[]>([])
  const [newSubscription, setNewSubscription] = useState({
    tenantId: '',
    planName: '',
    planType: 'BASIC',
    price: '',
    maxUsers: '',
    maxProducts: '',
    features: ''
  })
  const [editSubscriptionDialog, setEditSubscriptionDialog] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [editSubscription, setEditSubscription] = useState({
    planName: '',
    planType: 'BASIC',
    price: '',
    maxUsers: '',
    maxProducts: '',
    features: '',
    isActive: true
  })
  const logout = useAuthStore((state) => state.logout)
  const { token, user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useT()

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'subscriptions') {
      setActiveTab('subscriptions')
    }
  }, [searchParams])

  // Check authentication on mount
  useEffect(() => {
    if (isClient && (!token || !user)) {
      router.push('/')
      return
    }
  }, [isClient, token, user, router])

  // Fetch data when user is available
  useEffect(() => {
    if (user && user.tenantId) {
      fetchUsers()
      fetchRevenueStats()
    } else {
      setLoading(false)
    }
  }, [user])

  // Form states
  const [userDialog, setUserDialog] = useState(false)
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'VENDEUR' })
  const [editUser, setEditUser] = useState({ email: '', role: 'VENDEUR' })

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/')
      return
    }

    if (user?.tenantId) {
      fetchUsers()
      fetchRevenueStats()
      fetchSubscription()
    } else {
      setLoading(false)
      setSubscriptionLoading(false)
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

  const openEditUserDialog = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setEditUser({ email: userToEdit.email, role: userToEdit.role })
    setEditUserDialog(true)
  }

  const updateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`http://localhost:5000/users/${user!.tenantId}/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      })
      if (response.ok) {
        alert('User updated successfully!')
        fetchUsers()
        setEditUserDialog(false)
        setEditingUser(null)
      } else {
        alert('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`http://localhost:5000/users/${user!.tenantId}/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        alert('User deleted successfully!')
        fetchUsers()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`http://localhost:5000/subscriptions/tenant/${user!.tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      } else if (response.status === 404) {
        setSubscriptionError('Aucun abonnement trouvé pour cette entreprise')
      } else {
        setSubscriptionError('Erreur lors du chargement de l\'abonnement')
      }
    } catch (err) {
      setSubscriptionError('Erreur réseau')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:5000/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      } else {
        setSubscriptionError('Erreur lors du chargement des entreprises')
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
      setSubscriptionError('Erreur réseau lors du chargement des entreprises')
    }
  }

  const openEditSubscriptionDialog = (subscriptionToEdit: Subscription) => {
    setEditingSubscription(subscriptionToEdit)
    setEditSubscription({
      planName: subscriptionToEdit.planName,
      planType: subscriptionToEdit.planType,
      price: subscriptionToEdit.price.toString(),
      maxUsers: subscriptionToEdit.maxUsers.toString(),
      maxProducts: subscriptionToEdit.maxProducts.toString(),
      features: subscriptionToEdit.features.join('\n'),
      isActive: subscriptionToEdit.isActive
    })
    setEditSubscriptionDialog(true)
  }

  const updateSubscription = async () => {
    if (!editingSubscription) return

    setSubscriptionError('')
    setSubscriptionSuccess('')

    try {
      const subscriptionData = {
        planName: editSubscription.planName,
        planType: editSubscription.planType,
        price: parseFloat(editSubscription.price),
        maxUsers: parseInt(editSubscription.maxUsers),
        maxProducts: parseInt(editSubscription.maxProducts),
        features: editSubscription.features.split('\n').filter(f => f.trim())
      }

      const response = await fetch(`http://localhost:5000/subscriptions/${editingSubscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      })

      if (response.ok) {
        setSubscriptionSuccess('Abonnement mis à jour avec succès!')
        fetchSubscription()
        setEditSubscriptionDialog(false)
        setEditingSubscription(null)
      } else {
        const errorData = await response.json()
        setSubscriptionError(errorData.message || 'Erreur lors de la mise à jour de l\'abonnement')
      }
    } catch (err) {
      setSubscriptionError('Erreur réseau')
    }
  }

  const deleteSubscription = async () => {
    if (!subscription) return
    if (!confirm('Are you sure you want to delete this subscription?')) return

    setSubscriptionError('')
    setSubscriptionSuccess('')

    try {
      const response = await fetch(`http://localhost:5000/subscriptions/${subscription.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSubscriptionSuccess('Abonnement supprimé avec succès!')
        setSubscription(null)
      } else {
        const errorData = await response.json()
        setSubscriptionError(errorData.message || 'Erreur lors de la suppression de l\'abonnement')
      }
    } catch (err) {
      setSubscriptionError('Erreur réseau')
    }
  }

  const createSubscription = async () => {
    if (!token) return
    setSubscriptionError('')
    setSubscriptionSuccess('')
    try {
      const response = await fetch('http://localhost:5000/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: newSubscription.tenantId,
          planName: newSubscription.planName,
          planType: newSubscription.planType,
          price: parseFloat(newSubscription.price),
          maxUsers: parseInt(newSubscription.maxUsers),
          maxProducts: parseInt(newSubscription.maxProducts),
          features: newSubscription.features.split('\n').filter(f => f.trim())
        }),
      })

      if (response.ok) {
        setSubscriptionSuccess('Abonnement créé avec succès !')
        setCreateDialogOpen(false)
        setNewSubscription({
          tenantId: '',
          planName: '',
          planType: 'BASIC',
          price: '',
          maxUsers: '',
          maxProducts: '',
          features: ''
        })
        // Refresh subscription if it's for current tenant
        if (newSubscription.tenantId === user!.tenantId) {
          fetchSubscription()
        }
      } else {
        const errorData = await response.json()
        setSubscriptionError(errorData.message || 'Erreur lors de la création de l\'abonnement')
      }
    } catch (err) {
      setSubscriptionError('Erreur réseau')
    }
  }

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
              {user?.role === 'VENDEUR' ? 'Tableau de bord vendeur' : 'Tableau de bord directeur'}
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <div className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className={`w-full ${activeTab === 'dashboard' ? 'bg-accent text-accent-foreground' : ''}`} 
                    onClick={() => setActiveTab('dashboard')}
                  >
                    {t('admin.sidebar.dashboard')}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className={`w-full ${activeTab === 'subscriptions' ? 'bg-accent text-accent-foreground' : ''}`} 
                    onClick={() => setActiveTab('subscriptions')}
                  >
                    {t('admin.sidebar.subscriptions')}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/admin/sales" className="w-full">{t('admin.sidebar.sales')}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user?.role !== 'VENDEUR' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/products" className="w-full">{t('admin.sidebar.products')}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role === 'MAGASINIER' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/stock" className="w-full">{t('admin.sidebar.stock')}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.role !== 'VENDEUR' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">{t('admin.sidebar.statistics')}</SidebarMenuButton>
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
              {user?.role === 'VENDEUR' ? 'Tableau de bord vendeur' : 'Tableau de bord directeur'}
            </h1>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              {t('admin.titles.logout')}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">{t('admin.sidebar.dashboard')}</TabsTrigger>
              <TabsTrigger value="subscriptions">{t('admin.sidebar.subscriptions')}</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Utilisateurs totaux</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600 dark:text-white">{users.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Ventes totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600 dark:text-white">24</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Revenus totaux</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600 dark:text-white">$12,450</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Graphique des ventes</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">Revenus dans le temps</CardDescription>
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
                                      <SelectItem value="MAGASINIER">Stock Manager</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={createUser} className="w-full">Create User</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Edit User Dialog */}
                        <div className="mb-4">
                          <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>Update user information.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-user-email">Email</Label>
                                  <Input
                                    id="edit-user-email"
                                    type="email"
                                    value={editUser.email}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-user-role">Role</Label>
                                  <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USER">User</SelectItem>
                                      <SelectItem value="GERANT">Manager</SelectItem>
                                      <SelectItem value="VENDEUR">Seller</SelectItem>
                                      <SelectItem value="MAGASINIER">Stock Manager</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={updateUser} className="w-full">Update User</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <ul className="space-y-2">
                          {users.map((u) => (
                            <li key={u.id} className="flex justify-between items-center py-2 border-b">
                              <span>{u.email} - {u.role}</span>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditUserDialog(u)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteUser(u.id)}>Delete</Button>
                              </div>
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
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-6">
              <div className="max-w-7xl mx-auto px-4">
                {subscriptionLoading ? (
                  <div className="text-center py-8">Loading subscription...</div>
                ) : subscription ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {subscription.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {subscription.planName} - {subscription.planType}
                        </CardTitle>
                        <CardDescription>
                          Subscription for {subscription.tenant.name} ({subscription.tenant.domain})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                            <Badge variant={subscription.isActive ? "default" : "destructive"}>
                              {subscription.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</p>
                            <p className="text-lg font-semibold">${subscription.price}/month</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Users</p>
                            <p className="text-lg font-semibold">{subscription.maxUsers}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Products</p>
                            <p className="text-lg font-semibold">{subscription.maxProducts}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Features</p>
                          <div className="flex flex-wrap gap-2">
                            {subscription.features.map((feature, index) => (
                              <Badge key={index} variant="outline">{feature}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</p>
                              <p>{new Date(subscription.startDate).toLocaleDateString()}</p>
                            </div>
                            {subscription.endDate && (
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</p>
                                <p>{new Date(subscription.endDate).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => openEditSubscriptionDialog(subscription)}>
                              {t('admin.titles.manage_subscription')}
                            </Button>
                            <Button variant="destructive" onClick={deleteSubscription}>
                              Delete Subscription
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No subscription found for your company.</p>
                      {user?.role === 'SUPERADMIN' && (
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Subscription
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Create New Subscription</DialogTitle>
                              <DialogDescription>
                                Create a subscription for a tenant.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={createSubscription} className="space-y-4">
                              <div>
                                <Label htmlFor="tenant">Tenant</Label>
                                <Select value={newSubscription.tenantId} onValueChange={(value) => setNewSubscription({ ...newSubscription, tenantId: value })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tenant" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tenants.map((tenant) => (
                                      <SelectItem key={tenant.id} value={tenant.id}>
                                        {tenant.name} ({tenant.domain})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="planName">Plan Name</Label>
                                <Input
                                  id="planName"
                                  value={newSubscription.planName}
                                  onChange={(e) => setNewSubscription({ ...newSubscription, planName: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="planType">Plan Type</Label>
                                <Select value={newSubscription.planType} onValueChange={(value) => setNewSubscription({ ...newSubscription, planType: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="BASIC">Basic</SelectItem>
                                    <SelectItem value="PRO">Pro</SelectItem>
                                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="price">Price ($)</Label>
                                <Input
                                  id="price"
                                  type="number"
                                  step="0.01"
                                  value={newSubscription.price}
                                  onChange={(e) => setNewSubscription({ ...newSubscription, price: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="maxUsers">Max Users</Label>
                                <Input
                                  id="maxUsers"
                                  type="number"
                                  value={newSubscription.maxUsers}
                                  onChange={(e) => setNewSubscription({ ...newSubscription, maxUsers: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="maxProducts">Max Products</Label>
                                <Input
                                  id="maxProducts"
                                  type="number"
                                  value={newSubscription.maxProducts}
                                  onChange={(e) => setNewSubscription({ ...newSubscription, maxProducts: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="features">Features (one per line)</Label>
                                <textarea
                                  id="features"
                                  className="w-full p-2 border rounded-md"
                                  rows={3}
                                  value={newSubscription.features}
                                  onChange={(e) => setNewSubscription({ ...newSubscription, features: e.target.value })}
                                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                />
                              </div>
                              {subscriptionError && (
                                <p className="text-red-500 text-sm">{subscriptionError}</p>
                              )}
                              {subscriptionSuccess && (
                                <p className="text-green-500 text-sm">{subscriptionSuccess}</p>
                              )}
                              <Button type="submit" className="w-full">Create Subscription</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Edit Subscription Dialog */}
                      <Dialog open={editSubscriptionDialog} onOpenChange={setEditSubscriptionDialog}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Subscription</DialogTitle>
                            <DialogDescription>
                              Update subscription details.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={(e) => { e.preventDefault(); updateSubscription(); }} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-planName">Plan Name</Label>
                              <Input
                                id="edit-planName"
                                value={editSubscription.planName}
                                onChange={(e) => setEditSubscription({ ...editSubscription, planName: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-planType">Plan Type</Label>
                              <Select value={editSubscription.planType} onValueChange={(value) => setEditSubscription({ ...editSubscription, planType: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BASIC">Basic</SelectItem>
                                  <SelectItem value="PRO">Pro</SelectItem>
                                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-price">Price ($)</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                value={editSubscription.price}
                                onChange={(e) => setEditSubscription({ ...editSubscription, price: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-maxUsers">Max Users</Label>
                              <Input
                                id="edit-maxUsers"
                                type="number"
                                value={editSubscription.maxUsers}
                                onChange={(e) => setEditSubscription({ ...editSubscription, maxUsers: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-maxProducts">Max Products</Label>
                              <Input
                                id="edit-maxProducts"
                                type="number"
                                value={editSubscription.maxProducts}
                                onChange={(e) => setEditSubscription({ ...editSubscription, maxProducts: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-features">Features (one per line)</Label>
                              <textarea
                                id="edit-features"
                                className="w-full p-2 border rounded-md"
                                rows={3}
                                value={editSubscription.features}
                                onChange={(e) => setEditSubscription({ ...editSubscription, features: e.target.value })}
                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1">Update Subscription</Button>
                              <Button type="button" variant="destructive" onClick={deleteSubscription} className="flex-1">Delete</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  )
}
