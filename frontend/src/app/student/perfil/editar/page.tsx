'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { StudentProfile } from '@/types'

export default function EditarPerfilStudentPage() {
  const router              = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const [schools, setSchools] = useState<{ id: string; userId: string; name: string }[]>([])
  const [form, setForm] = useState({
    firstName: '', lastName: '', headline: '', bio: '',
    specialty: '', year: 1, phone: '', location: '',
    linkedinUrl: '', githubUrl: '', portfolioUrl: '',
    schoolUserId: '',
  })

  useEffect(() => {
    api.get<{ id: string; userId: string; name: string }[]>('/schools').catch(() => [])
      .then(data => setSchools(data))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    api.get<StudentProfile>('/students/me')
      .then(p => {
        setForm({
          firstName:    p.firstName ?? '',
          lastName:     p.lastName ?? '',
          headline:     p.headline ?? '',
          bio:          p.bio ?? '',
          specialty:    p.specialty ?? '',
          year:         p.year ?? 1,
          phone:        p.phone ?? '',
          location:     p.location ?? '',
          linkedinUrl:  p.linkedinUrl ?? '',
          githubUrl:    p.githubUrl ?? '',
          portfolioUrl: p.portfolioUrl ?? '',
          schoolUserId: (p as any).schoolUserId ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.patch('/students/me', {
        ...form,
        year: Number(form.year),
        schoolUserId: form.schoolUserId || undefined,
      })
      setSuccess(true)
      setTimeout(() => router.push('/student/perfil'), 1200)
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
        <div className="card h-96 animate-pulse" />
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
          <h1 className="font-headline text-2xl font-bold text-on-surface">Editar perfil</h1>
          <p className="text-sm text-on-surface-variant">Actualiza tu información personal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Información básica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Nombre</label>
              <input
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Apellido</label>
              <input
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="Apellido"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Titular / Headline</label>
            <input
              value={form.headline}
              onChange={e => set('headline', e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              placeholder="Ej: Desarrollador Full Stack · Especialidad Informática"
              maxLength={255}
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Biografía</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              rows={3}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
              placeholder="Cuéntale a las empresas sobre vos..."
            />
          </div>
        </div>

        {/* Academic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Información académica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Especialidad</label>
              <input
                value={form.specialty}
                onChange={e => set('specialty', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="Informática, Electrónica..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Año</label>
              <select
                value={form.year}
                onChange={e => set('year', Number(e.target.value))}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
              >
                {[1,2,3,4].map(y => <option key={y} value={y}>{y}° año</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* School Link */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-1">Mi institución educativa</h2>
          <p className="text-xs text-on-surface-variant mb-4">
            Vincularte a tu colegio permite que vean tus habilidades y puedan validarlas.
          </p>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
              Colegio
            </label>
            <select
              value={form.schoolUserId}
              onChange={e => set('schoolUserId', e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
            >
              <option value="">— Sin colegio vinculado —</option>
              {schools.map(s => (
                <option key={s.userId} value={s.userId}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Contacto y ubicación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Teléfono</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Ubicación</label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                placeholder="Buenos Aires, Argentina"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Links y redes</h2>
          <div className="space-y-3">
            {[
              { field: 'linkedinUrl' as const, label: 'LinkedIn URL', icon: 'link', placeholder: 'https://linkedin.com/in/tu-perfil' },
              { field: 'githubUrl'   as const, label: 'GitHub URL',   icon: 'code', placeholder: 'https://github.com/usuario' },
              { field: 'portfolioUrl' as const, label: 'Portfolio URL', icon: 'public', placeholder: 'https://miportfolio.dev' },
            ].map(({ field, label, icon, placeholder }) => (
              <div key={field} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline text-[20px]">{icon}</span>
                <div className="flex-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1 block">{label}</label>
                  <input
                    value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
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
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}
