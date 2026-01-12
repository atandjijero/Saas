'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth.store'

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    if (!userId || userId.trim() === '') {
      router.push('/')
      return
    }
    setup2FA()
  }, [userId])

  const setup2FA = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()
      if (response.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
      } else {
        setError('Échec de la configuration 2FA')
      }
    } catch (err) {
      setError('Erreur réseau')
    }
  }

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('http://localhost:5000/auth/enable-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('2FA activé avec succès, connexion en cours...')
        // Now login
        const loginResponse = await fetch('http://localhost:5000/auth/verify-2fa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, token }),
        })
        const loginData = await loginResponse.json()
        if (loginResponse.ok) {
          login(loginData.user, loginData.access_token)
          // Redirect based on role
          if (loginData.user.role === 'SUPERADMIN') {
            router.push('/superadmin')
          } else if (loginData.user.role === 'DIRECTEUR') {
            router.push('/admin')
          } else {
            router.push('/app')
          }
        } else {
          setError('Échec de la connexion après activation 2FA')
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
          <CardTitle className="text-gray-900 dark:text-white">Setup 2FA</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Scan the QR code with your authenticator app and enter the token to enable 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qrCode && (
            <div className="mb-4">
              <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Or manually enter: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono break-all">{secret}</code>
              </p>
            </div>
          )}
          <form onSubmit={handleEnable2FA} className="space-y-4">
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
              {isLoading ? 'Activation en cours...' : 'Activer 2FA'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
