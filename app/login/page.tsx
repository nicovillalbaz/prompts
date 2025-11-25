'use client'
 
import { useState } from 'react'
import { authenticate } from '@/app/actions/auth'
 
export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
 
  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setErrorMessage(null)
    
    const result = await authenticate(formData)
    
    if (result?.error) {
        setErrorMessage(result.error)
        setIsPending(false)
    }
  }
 
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600">Clic&App Prompts</h1>
            <p className="mt-2 text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>
        
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="admin@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          {errorMessage && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                ⚠️ {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm transition-colors disabled:bg-gray-400"
          >
            {isPending ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}