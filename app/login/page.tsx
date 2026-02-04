// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabse/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-linear-to-br from-card to-muted/40 border-border/50 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-2">
            <Image  
                src="/podekia-logo.png"
                alt="Podekia Savings Club Logo"
                width={200}
                height={200}
              />
            
          </div>
          <CardTitle className="text-2xl font-bold text-center tracking-tight">
            Login
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to view your contributions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                autoComplete="email"
                className="bg-muted/50 border-border/70 focus:ring-cyan-500/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-muted/50 border-border/70 focus:ring-cyan-500/30"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-950/40 border-red-800/60 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`
                w-full font-medium transition-all
                ${loading
                  ? 'bg-cyan-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500'
                }
              `}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Contact the club admin if you need an account.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}