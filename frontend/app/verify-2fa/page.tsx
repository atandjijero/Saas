'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'
import { API_BASE_URL } from '@/lib/api'

export default function Verify2FAPage() {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const login = useAuthStore((state) => state.login)

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Vérification réussie, connexion en cours...')
        login(data.user, data.access_token)
        // Redirect based on role
        if (data.user.role === 'SUPERADMIN') {
          router.push('/superadmin')
        } else if (data.user.role === 'DIRECTEUR') {
          router.push('/admin')
        } else {
          router.push('/app')
        }
      } else {
        setError(data.error || 'Token invalide')
      }
    } catch (err) {
      setError('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Verify 2FA</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter the token from your authenticator app to complete login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                2FA Token
              </label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-500 dark:text-green-400 text-sm">{success}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
