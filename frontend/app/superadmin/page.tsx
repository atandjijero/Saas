'use client'

import { useEffect, useState, useCallback } from 'react'
import { useT } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { API_BASE_URL } from '@/lib/api'

import { useAuthStore } from '@/stores/auth.store'
import { UserMenu } from '@/components/user-menu'

interface Tenant {
  id: string
  name: string
  domain: string
  revenue: number
  createdAt?: string
}

interface TenantDetails {
  id: string
  name: string
  domain: string
  createdAt: string
  updatedAt: string
}

interface GlobalStats {
  totalRevenue: number
  totalTenants: number
  totalUsers: number
  tenantRevenues: { tenantId: string; name: string; revenue: number }[]
}

type ActiveSection = 'dashboard' | 'tenants' | 'analytics' | 'settings' | 'users' | 'subscriptions'

export default function SuperadminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [allTenants, setAllTenants] = useState<TenantDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantDomain, setNewTenantDomain] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState<string | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('DIRECTEUR')
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState('')
  const [subscriptionSuccess, setSubscriptionSuccess] = useState('')
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false)
  const [newSubscriptionData, setNewSubscriptionData] = useState({
    tenantId: '',
    planName: '',
    planType: 'BASIC',
    price: '',
    maxUsers: '',
    maxProducts: '',
    features: ''
  })
  const { token, logout } = useAuthStore()

  useEffect(() => {
    // Wait for token to be available from persisted store before fetching
    if (token) {
      fetchTenantsData()
      fetchGlobalStats()
    }
  }, [token])

  useEffect(() => {
    if (token && activeSection === 'subscriptions') {
      fetchSubscriptions()
    }
  }, [token, activeSection])

  const fetchTenantsData = useCallback(async () => {
    try {
      // Fetch tenants with revenue for dashboard
      const statsResponse = await fetch(`${API_BASE_URL}/stats/all-revenue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setTenants(statsData)
      }

      // Fetch all tenants for management
      const tenantsResponse = await fetch(`${API_BASE_URL}/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json()
        setAllTenants(tenantsData)
      }
    } catch (error) {
      console.error('Error fetching tenants data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchUsersForTenant = async (tenantId: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`${API_BASE_URL}/users/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setUsers([])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setUsers([])
    }
  }

  const fetchGlobalStats = useCallback(async () => {
    try {
      const [revenueRes, tenantsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats/all-revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const revenueData = await revenueRes.json()
      const tenantsData = await tenantsRes.json()
      const usersData = await usersRes.json()

      const totalRevenue = revenueData.reduce((sum: number, tenant: any) => sum + tenant.revenue, 0)
      const totalTenants = tenantsData.length
      const totalUsers = usersData.length

      setGlobalStats({
        totalRevenue,
        totalTenants,
        totalUsers,
        tenantRevenues: revenueData,
      })
    } catch (err) {
      console.error('Error fetching global stats:', err)
    }
  }, [token])

  const createTenant = async () => {
    if (!newTenantName.trim() || !newTenantDomain.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTenantName.trim(),
          domain: newTenantDomain.trim(),
        }),
      })

      if (response.ok) {
        const newTenant = await response.json()
        setAllTenants([...allTenants, newTenant])
        // Also refresh the stats data to include the new tenant
        await fetchTenantsData()
        setNewTenantName('')
        setNewTenantDomain('')
        setIsAddTenantOpen(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create tenant')
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      alert('Failed to create tenant')
    } finally {
      setIsCreating(false)
    }
  }

  const createUser = async () => {
    if (!selectedTenantForUsers) return alert('Select a tenant')
    if (!newUserEmail.trim() || !newUserPassword.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedTenantForUsers}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newUserEmail.trim(), password: newUserPassword.trim(), role: newUserRole }),
      })
      if (res.ok) {
        await fetchUsersForTenant(selectedTenantForUsers)
        setIsAddUserOpen(false)
        setNewUserEmail('')
        setNewUserPassword('')
        setNewUserRole('DIRECTEUR')
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to create user')
      }
    } catch (err) {
      console.error('Error creating user:', err)
      alert('Failed to create user')
    } finally {
      setIsCreating(false)
    }
  }

  const fetchSubscriptions = useCallback(async () => {
    if (!token) return
    setSubscriptionLoading(true)
    setSubscriptionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      } else {
        setSubscriptionError('Erreur lors de la récupération des abonnements')
      }
    } catch (error) {
      setSubscriptionError('Erreur réseau lors de la récupération des abonnements')
    } finally {
      setSubscriptionLoading(false)
    }
  }, [token])

  const createSubscription = async () => {
    if (!token) return
    setSubscriptionLoading(true)
    setSubscriptionError('')
    setSubscriptionSuccess('')
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenantId: newSubscriptionData.tenantId,
          planName: newSubscriptionData.planName,
          planType: newSubscriptionData.planType,
          price: parseFloat(newSubscriptionData.price),
          maxUsers: parseInt(newSubscriptionData.maxUsers),
          maxProducts: parseInt(newSubscriptionData.maxProducts),
          features: newSubscriptionData.features.split(',').map(f => f.trim())
        })
      })
      if (response.ok) {
        setSubscriptionSuccess('Abonnement créé avec succès')
        setCreateSubscriptionOpen(false)
        setNewSubscriptionData({
          tenantId: '',
          planName: '',
          planType: 'BASIC',
          price: '',
          maxUsers: '',
          maxProducts: '',
          features: ''
        })
        fetchSubscriptions()
      } else {
        const error = await response.json()
        setSubscriptionError(error.message || 'Erreur lors de la création de l\'abonnement')
      }
    } catch (error) {
      setSubscriptionError('Erreur réseau lors de la création de l\'abonnement')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-center">Tableau de bord Superadmin</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <div className="space-y-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('dashboard')}
                    className={activeSection === 'dashboard' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('tenants')}
                    className={activeSection === 'tenants' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Workspaces/Tenants
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('analytics')}
                    className={activeSection === 'analytics' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Analytics
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setActiveSection('subscriptions')}
                        className={activeSection === 'subscriptions' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                      >
                        {useT()('sidebar.subscriptions')}
                      </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('users')}
                    className={activeSection === 'users' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Users
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveSection('settings')}
                    className={activeSection === 'settings' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Settings
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            </SidebarMenu>
          </SidebarContent>
          <UserMenu />
        </Sidebar>
        <main className="flex-1 p-6">
          <div className="flex items-center gap-2 mb-6">
            <SidebarTrigger />
            <h1 className="text-3xl font-bold">
              {activeSection === 'dashboard' && useT()('superadmin.title_dashboard')}
              {activeSection === 'tenants' && useT()('superadmin.title_tenants')}
              {activeSection === 'analytics' && useT()('superadmin.title_analytics')}
              {activeSection === 'settings' && useT()('superadmin.title_settings')}
              {activeSection === 'users' && useT()('superadmin.title_users')}
              {activeSection === 'subscriptions' && useT()('superadmin.title_subscriptions')}
            </h1>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              {useT()('buttons.logout')}
            </Button>
          </div>

          <div className="max-w-7xl mx-auto px-4">
            {activeSection === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Total Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600 dark:text-white">{tenants.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600 dark:text-white">
                        ${tenants.reduce((sum, tenant) => sum + tenant.revenue, 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Average Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600 dark:text-white">
                        ${tenants.length > 0 ? (tenants.reduce((sum, tenant) => sum + tenant.revenue, 0) / tenants.length).toFixed(2) : '0.00'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6">
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Tenant Overview</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">All tenants and their revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {tenants.map((tenant) => (
                          <Card key={tenant.id} className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">{tenant.name}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{tenant.domain}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600 dark:text-white">${tenant.revenue.toLocaleString()}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeSection === 'tenants' && (
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">All Tenants</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">Manage all tenants in the system</CardDescription>
                    </div>
                    <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Create New Tenant</DialogTitle>
                          <DialogDescription>
                            Add a new tenant to the system. They will be able to manage their own users, products, and sales.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="name"
                              value={newTenantName}
                              onChange={(e) => setNewTenantName(e.target.value)}
                              className="col-span-3"
                              placeholder="Enter tenant name"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="domain" className="text-right">
                              Domain
                            </Label>
                            <Input
                              id="domain"
                              value={newTenantDomain}
                              onChange={(e) => setNewTenantDomain(e.target.value)}
                              className="col-span-3"
                              placeholder="tenant.example.com"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={createTenant} disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Tenant'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Domain</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Created At</TableHead>
                        <TableHead className="text-gray-900 dark:text-white">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTenants.map((tenant) => {
                        const tenantStats = tenants.find(t => t.id === tenant.id)
                        const revenue = tenantStats ? tenantStats.revenue : 0
                        return (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">{tenant.name}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{tenant.domain}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {new Date(tenant.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-white font-semibold">
                              ${revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {tenants.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No tenants found. Create your first tenant to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'users' && (
              <div className="flex justify-center">
                <Card className="w-full max-w-4xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">Users</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">Create and manage users for tenants</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="hidden sm:block mr-2">Tenant</Label>
                        <select
                          value={selectedTenantForUsers ?? ''}
                          onChange={(e) => { setSelectedTenantForUsers(e.target.value || null); if (e.target.value) fetchUsersForTenant(e.target.value) }}
                          className="rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-sm"
                        >
                          <option value="">Select tenant</option>
                          {allTenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name} — {t.domain}</option>
                          ))}
                        </select>
                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                          <DialogTrigger asChild>
                            <Button disabled={!selectedTenantForUsers}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add User
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                              <DialogTitle>Create New User</DialogTitle>
                              <DialogDescription>Create a user for the selected tenant</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userEmail" className="text-right">Email</Label>
                                <Input id="userEmail" className="col-span-3" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userPassword" className="text-right">Password</Label>
                                <Input id="userPassword" type="password" className="col-span-3" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userRole" className="text-right">Role</Label>
                                <select id="userRole" className="col-span-3 rounded-md border px-3 py-2 bg-white dark:bg-gray-700" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                  <option value="DIRECTEUR">DIRECTEUR</option>
                                  <option value="CAISSIER">CAISSIER</option>
                                  <option value="MANAGER">MANAGER</option>
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={createUser} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create User'}</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
                          <TableHead className="text-gray-900 dark:text-white">Role</TableHead>
                          <TableHead className="text-gray-900 dark:text-white">Tenant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">{u.email}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{u.role}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{allTenants.find(t => t.id === u.tenantId)?.name ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {users.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No users for selected tenant.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'subscriptions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des abonnements</h2>
                  <Button onClick={() => { setCreateSubscriptionOpen(true); fetchSubscriptions(); }} className="bg-blue-600 hover:bg-blue-700">
                    Créer un abonnement
                  </Button>
                </div>

                {subscriptionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{subscriptionError}</AlertDescription>
                  </Alert>
                )}

                {subscriptionSuccess && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-200">Succès</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">{subscriptionSuccess}</AlertDescription>
                  </Alert>
                )}

                <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Abonnements actifs</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Liste de tous les abonnements actifs dans le système</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subscriptionLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des abonnements...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-gray-900 dark:text-white">Tenant</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Plan</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Prix</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Utilisateurs max</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Produits max</TableHead>
                            <TableHead className="text-gray-900 dark:text-white">Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium text-gray-900 dark:text-white">
                                {allTenants.find(t => t.id === sub.tenantId)?.name ?? 'Inconnu'}
                              </TableCell>
                              <TableCell className="text-gray-600 dark:text-gray-400">{sub.planName}</TableCell>
                              <TableCell className="text-gray-600 dark:text-gray-400">${sub.price}</TableCell>
                              <TableCell className="text-gray-600 dark:text-gray-400">{sub.maxUsers}</TableCell>
                              <TableCell className="text-gray-600 dark:text-gray-400">{sub.maxProducts}</TableCell>
                              <TableCell>
                                <Badge variant={sub.planType === 'FREE' ? 'secondary' : sub.planType === 'BASIC' ? 'default' : 'destructive'}>
                                  {sub.planType}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {subscriptions.length === 0 && !subscriptionLoading && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun abonnement trouvé.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'analytics' && globalStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600 dark:text-white">
                        ${globalStats.totalRevenue.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Total Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600 dark:text-white">{globalStats.totalTenants}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600 dark:text-white">{globalStats.totalUsers}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Revenue by Tenant</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Distribution of revenue across all tenants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <BarChart data={globalStats.tenantRevenues.map(t => ({ name: t.name, revenue: t.revenue }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="#3b82f6" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Tenant Performance</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Detailed breakdown of tenant metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-900 dark:text-white">Tenant Name</TableHead>
                          <TableHead className="text-gray-900 dark:text-white">Revenue</TableHead>
                          <TableHead className="text-gray-900 dark:text-white">Percentage of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalStats.tenantRevenues.map((tenant) => (
                          <TableRow key={tenant.tenantId}>
                            <TableCell className="font-medium text-gray-900 dark:text-white">{tenant.name}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">${tenant.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {globalStats.totalRevenue > 0 ? ((tenant.revenue / globalStats.totalRevenue) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'settings' && (
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Settings</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">System configuration and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">Settings features coming soon...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Dialog open={createSubscriptionOpen} onOpenChange={setCreateSubscriptionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel abonnement</DialogTitle>
            <DialogDescription>
              Configurez un nouvel abonnement pour un tenant existant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant" className="text-right">
                Tenant
              </Label>
              <Select value={newSubscriptionData.tenantId} onValueChange={(value) => setNewSubscriptionData({...newSubscriptionData, tenantId: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un tenant" />
                </SelectTrigger>
                <SelectContent>
                  {allTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="planName" className="text-right">
                Nom du plan
              </Label>
              <Input
                id="planName"
                value={newSubscriptionData.planName}
                onChange={(e) => setNewSubscriptionData({...newSubscriptionData, planName: e.target.value})}
                className="col-span-3"
                placeholder="Ex: Plan Premium"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="planType" className="text-right">
                Type de plan
              </Label>
              <Select value={newSubscriptionData.planType} onValueChange={(value) => setNewSubscriptionData({...newSubscriptionData, planType: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE</SelectItem>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="PROFESSIONAL">PROFESSIONAL</SelectItem>
                  <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Prix ($)
              </Label>
              <Input
                id="price"
                type="number"
                value={newSubscriptionData.price}
                onChange={(e) => setNewSubscriptionData({...newSubscriptionData, price: e.target.value})}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxUsers" className="text-right">
                Utilisateurs max
              </Label>
              <Input
                id="maxUsers"
                type="number"
                value={newSubscriptionData.maxUsers}
                onChange={(e) => setNewSubscriptionData({...newSubscriptionData, maxUsers: e.target.value})}
                className="col-span-3"
                placeholder="10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxProducts" className="text-right">
                Produits max
              </Label>
              <Input
                id="maxProducts"
                type="number"
                value={newSubscriptionData.maxProducts}
                onChange={(e) => setNewSubscriptionData({...newSubscriptionData, maxProducts: e.target.value})}
                className="col-span-3"
                placeholder="100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="features" className="text-right">
                Fonctionnalités
              </Label>
              <Input
                id="features"
                value={newSubscriptionData.features}
                onChange={(e) => setNewSubscriptionData({...newSubscriptionData, features: e.target.value})}
                className="col-span-3"
                placeholder="Fonctionnalité 1, Fonctionnalité 2, ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateSubscriptionOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={createSubscription} disabled={subscriptionLoading}>
              {subscriptionLoading ? 'Création...' : 'Créer l\'abonnement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
