'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { timeAgo } from '@/lib/utils'
import type { PortfolioEvidence, EvidenceType } from '@/types'

const evidenceTypes: { value: EvidenceType; label: string; icon: string; desc: string }[] = [
  { value: 'PROYECTO',    label: 'Proyecto',      icon: 'code',              desc: 'Trabajo práctico o aplicación desarrollada' },
  { value: 'CERTIFICADO', label: 'Certificado',   icon: 'workspace_premium', desc: 'Certificación o curso completado' },
  { value: 'FOTO',        label: 'Foto de trabajo',icon: 'image',            desc: 'Evidencia fotográfica de tus trabajos' },
  { value: 'VIDEO',       label: 'Video',         icon: 'play_circle',       desc: 'Demo, presentación o reel profesional' },
  { value: 'DESCRIPCION', label: 'Descripción',   icon: 'article',           desc: 'Descripción de experiencia o logro' },
]

const typeIcon: Record<EvidenceType, string> = {
  PROYECTO: 'code', CERTIFICADO: 'workspace_premium',
  FOTO: 'image', VIDEO: 'play_circle', DESCRIPCION: 'article',
}

interface NewEvidenceForm {
  title: string
  description: string
  type: EvidenceType
  tags: string
  imageUrl: string
  isPublic: boolean
}

const emptyForm: NewEvidenceForm = {
  title: '', description: '', type: 'PROYECTO',
  tags: '', imageUrl: '', isPublic: true,
}

export default function PortafolioPage() {
  const { isAuthenticated } = useAuthStore()

  const [evidences, setEvidences]     = useState<PortfolioEvidence[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState<NewEvidenceForm>(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<EvidenceType | 'ALL'>('ALL')

  useEffect(() => {
    if (!isAuthenticated) return
    api.get<any>('/students/me')
      .then(profile => setEvidences(profile.evidences ?? []))
      .catch(() => {})
  }, [isAuthenticated])

  const filtered = activeFilter === 'ALL'
    ? evidences
    : evidences.filter(e => e.type === activeFilter)

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('El título y la descripción son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      type:        form.type,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl:    form.imageUrl || undefined,
      isPublic:    form.isPublic,
    }

    try {
      if (isAuthenticated) {
        const created = await api.post<PortfolioEvidence>('/students/me/evidences', payload)
        setEvidences(prev => [created, ...prev])
      }
      setForm(emptyForm)
      setShowForm(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg ?? 'Error al guardar la evidencia.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      if (isAuthenticated) {
        await api.delete(`/students/me/evidences/${id}`)
      }
      setEvidences(prev => prev.filter(e => e.id !== id))
    } catch {
      // silencioso — el estado local ya se actualizó
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/student/perfil"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-3 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Volver al perfil
          </Link>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Mi Portafolio</h1>
          <p className="text-on-surface-variant mt-1">
            {evidences.length} evidencias · muestra tu trabajo y logros
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} icon={showForm ? 'close' : 'add'}>
          {showForm ? 'Cancelar' : 'Agregar evidencia'}
        </Button>
      </div>

      {/* ── Formulario nueva evidencia ──────────────────────────────── */}
      {showForm && (
        <div className="card p-8 mb-8 animate-fade-in">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Nueva evidencia</h2>

          {/* Tipo */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-3">Tipo de evidencia</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {evidenceTypes.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setForm(f => ({ ...f, type: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.type === value
                      ? 'border-primary bg-primary-fixed/40 text-primary'
                      : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline mb-2 block">
                Título *
              </label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Sistema de gestión escolar en React"
                className="w-full bg-surface-container-low rounded-lg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary transition-colors"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-outline mb-2 block">
                Descripción *
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe qué hiciste, qué aprendiste y qué tecnologías usaste..."
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-primary resize-none transition-colors"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-outline mb-2 block">
                Etiquetas
              </label>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="React, Node.js, PostgreSQL (separadas por coma)"
                className="w-full bg-surface-container-low rounded-lg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-primary transition-colors"
              />
            </div>

            {/* Visibilidad */}
            <div className="flex items-center gap-3 self-end pb-2">
              <button
                onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
                className={`w-10 h-6 rounded-full relative transition-colors ${form.isPublic ? 'bg-primary-container' : 'bg-surface-container-high'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isPublic ? 'right-1' : 'left-1'}`} />
              </button>
              <div>
                <p className="text-sm font-semibold text-on-surface">Visible públicamente</p>
                <p className="text-xs text-on-surface-variant">Las empresas podrán ver esta evidencia</p>
              </div>
            </div>
          </div>

          {/* Upload de imagen */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-outline mb-3">
              Imagen (opcional)
            </p>
            <div className="flex items-start gap-4">
              <div className="w-32 h-24">
                <ImageUpload
                  currentUrl={form.imageUrl || undefined}
                  uploadType="evidence"
                  shape="rounded"
                  className="w-32 h-24"
                  onSuccess={url => setForm(f => ({ ...f, imageUrl: url }))}
                  label="Subir imagen"
                />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                Sube una captura de pantalla, foto del resultado o imagen representativa.
                <br />Máximo 5 MB · JPEG, PNG, WEBP
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-error font-semibold">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowForm(false); setForm(emptyForm); setError(null) }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} icon={saving ? undefined : 'save'}>
              {saving ? 'Guardando...' : 'Guardar evidencia'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      {evidences.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'ALL' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Todas ({evidences.length})
          </button>
          {evidenceTypes.map(({ value, label }) => {
            const count = evidences.filter(e => e.type === value).length
            if (count === 0) return null
            return (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === value ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* ── Grid de evidencias ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ev) => (
          <EvidenceCard
            key={ev.id}
            evidence={ev}
            onDelete={handleDelete}
            isDeleting={deletingId === ev.id}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline">folder_open</span>
            <h2 className="font-headline text-xl font-bold text-on-surface mt-4">
              {activeFilter === 'ALL' ? 'Aún no tienes evidencias' : 'Sin evidencias en esta categoría'}
            </h2>
            <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
              Agrega proyectos, certificados o fotos de tu trabajo para que las empresas vean tu potencial.
            </p>
            <Button className="mt-6" icon="add" onClick={() => setShowForm(true)}>
              Agregar primera evidencia
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Tarjeta de evidencia ──────────────────────────────────────────────────────

function EvidenceCard({
  evidence,
  onDelete,
  isDeleting,
}: {
  evidence: PortfolioEvidence
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const icon = typeIcon[evidence.type]
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '')

  const imageUrl = evidence.imageUrl
    ? evidence.imageUrl.startsWith('http') ? evidence.imageUrl : `${API_BASE}${evidence.imageUrl}`
    : null

  return (
    <div className="card group overflow-hidden">
      {/* Imagen o placeholder */}
      <div className="aspect-video bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={evidence.title} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[44px] text-outline icon-filled">{icon}</span>
        )}

        {/* Badge tipo */}
        <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
          {evidence.type.charAt(0) + evidence.type.slice(1).toLowerCase()}
        </span>

        {/* Acciones */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <>
              <button
                onClick={() => { onDelete(evidence.id); setConfirmDelete(false) }}
                disabled={isDeleting}
                className="text-[10px] font-bold px-2 py-1 rounded bg-error text-on-error hover:opacity-90"
              >
                {isDeleting ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-bold px-2 py-1 rounded bg-surface-container text-on-surface"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1 rounded bg-black/40 text-white hover:bg-error/80 transition-colors backdrop-blur-sm"
              title="Eliminar"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight mb-1">
          {evidence.title}
        </h4>
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
          {evidence.description}
        </p>

        {evidence.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {evidence.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-outline">
            {timeAgo(evidence.createdAt)}
          </span>
          {!evidence.isPublic && (
            <span className="flex items-center gap-1 text-[10px] text-outline">
              <span className="material-symbols-outlined text-[12px]">lock</span>
              Privado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
