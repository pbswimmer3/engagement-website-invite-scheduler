'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, from }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Incorrect password')
        return
      }

      router.replace(data.redirectTo)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-main.jpeg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-darkdenim/50" />

      {/* Card */}
      <div className="relative z-10 bg-cream rounded-2xl shadow-2xl px-10 py-12 w-full max-w-sm mx-4 text-center">
        <p className="text-gold text-xs uppercase tracking-widest mb-2">You&apos;re invited</p>
        <h1 className="text-3xl font-bold text-darkdenim mb-1">Aanya &amp; Prad</h1>
        <p className="text-navy/50 text-sm mb-8">Engagement Party</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gold/30 bg-white text-navy text-sm placeholder-navy/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="w-full py-3 bg-navy text-white text-xs uppercase tracking-widest rounded-xl hover:bg-darkdenim transition-colors disabled:opacity-40"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
