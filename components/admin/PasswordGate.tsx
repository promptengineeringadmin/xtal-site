"use client"

import { useState, useEffect } from "react"
import { Lock } from "lucide-react"

const STORAGE_KEY = "xtal-admin-auth"
const PASSWORD = "awghey"

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode
}) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState("")
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === PASSWORD) {
      setUnlocked(true)
    }
    setChecking(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, input)
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (checking) {
    return null
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-xtal-navy/10 rounded-xl mx-auto mb-6">
          <Lock className="w-6 h-6 text-xtal-navy" />
        </div>
        <h1 className="text-xl font-semibold text-center text-slate-900 mb-1">
          XTAL Admin
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Enter password to continue
        </p>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-xtal-navy focus:ring-2 focus:ring-xtal-navy/10"
          }`}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1.5">Incorrect password</p>
        )}
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2.5 bg-xtal-navy text-white text-sm font-medium rounded-lg hover:bg-xtal-navy/90 transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}
