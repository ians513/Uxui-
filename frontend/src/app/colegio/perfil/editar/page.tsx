'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { SchoolProfile } from '@/types'

export default function EditarPerfilColegioPage() {
  const router              = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', location: '', website: '',
  })

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    api.get<SchoolProfile>('/schools/me')
      .then(s => {
        setForm({
          name:        s.name ?? '',
          description: s.description ?? '',
          location:    s.location ?? '',
          website:     s.website ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.patch('/schools/me', form)
      setSuccess(true)
      setTimeout(() => router.push('/colegio/perfil'), 1200)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg ?? 'Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse" />
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Editar perfil del colegio</h1>
          <p className="text-sm text-on-surface-variant">Actualiza la información de tu institución</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Información de la institución</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Nombre del colegio</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="Nombre del colegio"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
                placeholder="¿Qué hace especial a tu institución? ¿Qué carreras o especialidades ofrecen?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Ubicación</label>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  placeholder="Ciudad, País"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Sitio web</label>
                <input
                  value={form.website}
                  onChange={e => set('website', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  placeholder="https://micolegio.edu"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-error-container/30 border border-error/20 rounded-lg">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
            <p className="text-sm text-green-700">¡Perfil actualizado! Redirigiendo...</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}
