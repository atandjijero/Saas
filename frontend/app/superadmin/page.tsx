'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth.store'
import { UserMenu } from '@/components/user-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'

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

type ActiveSection = 'dashboard' | 'tenants' | 'analytics' | 'settings' | 'users'

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
  const { token } = useAuthStore()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    // Wait for token to be available from persisted store before fetching
    if (token) {
      fetchTenantsData()
    }
  }, [token])

  const fetchTenantsData = async () => {
    try {
      // Fetch tenants with revenue for dashboard
      const statsResponse = await fetch('http://localhost:5000/stats/all-revenue', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setTenants(statsData)
      }

      // Fetch all tenants for management
      const tenantsResponse = await fetch('http://localhost:5000/tenants', {
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
  }

  const fetchUsersForTenant = async (tenantId: string) => {
    if (!tenantId) return
    try {
      const res = await fetch(`http://localhost:5000/users/${tenantId}`, {
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

  const createTenant = async () => {
    if (!newTenantName.trim() || !newTenantDomain.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:5000/tenants', {
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
      const res = await fetch(`http://localhost:5000/users/${selectedTenantForUsers}`, {
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

  if (loading) return <div>Loading...</div>

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-center">Superadmin Dashboard</h2>
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
                    Tenants
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
                    onClick={() => setActiveSection('users')}
                    className={activeSection === 'users' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  >
                    Auth / Users
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
              {activeSection === 'dashboard' && 'Superadmin Dashboard'}
              {activeSection === 'tenants' && 'Tenant Management'}
              {activeSection === 'analytics' && 'Analytics'}
              {activeSection === 'settings' && 'Settings'}
              {activeSection === 'users' && 'Auth / Users'}
            </h1>
            <Button onClick={() => { logout(); window.location.href = '/'; }} variant="outline" className="ml-auto">
              Logout
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

            {activeSection === 'analytics' && (
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Analytics</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Advanced analytics and reporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">Analytics features coming soon...</p>
                </CardContent>
              </Card>
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
    </SidebarProvider>
  )
}