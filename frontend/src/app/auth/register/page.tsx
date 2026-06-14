'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type Role = 'STUDENT' | 'EMPRESA' | 'COLEGIO'

const roleRedirect: Record<Role, string> = {
  STUDENT: '/student/inicio',
  EMPRESA: '/empresa/inicio',
  COLEGIO: '/colegio/inicio',
}

const roles = [
  {
    key:         'STUDENT' as Role,
    label:       'Estudiante',
    description: 'Construye tu perfil y conecta con empresas',
    icon:        'school',
    color:       'from-blue-500 to-indigo-600',
  },
  {
    key:         'EMPRESA' as Role,
    label:       'Empresa',
    description: 'Descubre y contrata talento técnico',
    icon:        'business',
    color:       'from-violet-500 to-purple-700',
  },
  {
    key:         'COLEGIO' as Role,
    label:       'Colegio',
    description: 'Gestiona y valida a tus estudiantes',
    icon:        'account_balance',
    color:       'from-emerald-500 to-teal-700',
  },
]

const schema = z.object({
  email:        z.string().email('Email inválido'),
  password:     z.string().min(6, 'Mínimo 6 caracteres'),
  firstName:    z.string().optional(),
  lastName:     z.string().optional(),
  specialty:    z.string().optional(),
  year:         z.coerce.number().min(1).max(7).optional(),
  orgName:      z.string().optional(),
  schoolUserId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterPage />
    </Suspense>
  )
}

function RegisterPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialRole  = (searchParams.get('role') as Role) ?? null

  const [step, setStep]               = useState<'role' | 'form'>(initialRole ? 'form' : 'role')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole ?? 'STUDENT')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [schools, setSchools]         = useState<{ id: string; userId: string; name: string }[]>([])

  const login = useAuthStore(s => s.login)

  useEffect(() => {
    api.get<{ id: string; userId: string; name: string }[]>('/schools').catch(() => [])
      .then(data => setSchools(data))
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedRoleData = roles.find(r => r.key === selectedRole)!

  const onSubmit = async (data: FormValues) => {
    // Validate required fields per role
    if (selectedRole === 'STUDENT' && (!data.firstName?.trim() || !data.lastName?.trim())) {
      return
    }
    if ((selectedRole === 'EMPRESA' || selectedRole === 'COLEGIO') && !data.orgName?.trim()) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', {
        email:        data.email,
        password:     data.password,
        role:         selectedRole,
        firstName:    data.firstName?.trim(),
        lastName:     data.lastName?.trim(),
        specialty:    selectedRole === 'STUDENT' ? data.specialty?.trim() : undefined,
        year:         selectedRole === 'STUDENT' ? data.year : undefined,
        schoolUserId: selectedRole === 'STUDENT' ? (data.schoolUserId || undefined) : undefined,
        companyName:  selectedRole === 'EMPRESA' ? data.orgName?.trim() : undefined,
        schoolName:   selectedRole === 'COLEGIO' ? data.orgName?.trim() : undefined,
      })
      // Login automatically after register
      await login({ email: data.email, password: data.password })
      router.push(roleRedirect[selectedRole])
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg ?? 'Error al crear la cuenta. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ── Panel izquierdo ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] editorial-gradient flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-on-primary/5" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-on-primary/5" />

        <Link href="/public/landing" className="text-3xl font-black text-on-primary tracking-tighter font-headline">
          Red Talento
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold text-on-primary font-headline leading-tight mb-6">
            El ecosistema de<br />talento técnico.
          </h2>
          <div className="space-y-5 mt-8">
            {roles.map(role => (
              <div key={role.key} className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <span className="material-symbols-outlined text-white text-[20px] icon-filled">{role.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-primary text-sm">{role.label}</p>
                  <p className="text-on-primary/60 text-xs">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-on-primary/40 text-xs">© {new Date().getFullYear()} Red Talento TP</p>
      </div>

      {/* ── Panel derecho ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          <Link href="/public/landing" className="lg:hidden block text-2xl font-black text-primary tracking-tighter font-headline mb-8">
            Red Talento
          </Link>

          {/* PASO 1: Elegir rol */}
          {step === 'role' ? (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">
                  ¿Cómo quieres registrarte?
                </h1>
                <p className="text-on-surface-variant">
                  Elige el tipo de cuenta que mejor te describe
                </p>
              </div>

              <div className="space-y-4">
                {roles.map(role => (
                  <button
                    key={role.key}
                    onClick={() => { setSelectedRole(role.key); setStep('form') }}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low transition-all group text-left"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-[28px] icon-filled">{role.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-headline font-bold text-on-surface text-lg group-hover:text-primary transition-colors">{role.label}</p>
                      <p className="text-sm text-on-surface-variant mt-0.5">{role.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-on-surface-variant mt-8">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
              </p>
            </>
          ) : (
            /* PASO 2: Formulario */
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep('role'); setError('') }}
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6 group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                  Cambiar tipo de cuenta
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center shadow-md`}>
                    <span className="material-symbols-outlined text-white text-[22px] icon-filled">{selectedRoleData.icon}</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-on-surface font-headline">
                      Crear cuenta {selectedRoleData.label}
                    </h1>
                    <p className="text-sm text-on-surface-variant">Completa tus datos para registrarte</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {selectedRole === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Nombre *"
                        placeholder="Matías"
                        error={errors.firstName?.message}
                        {...register('firstName')}
                      />
                      <Input
                        label="Apellido *"
                        placeholder="Arancibia"
                        error={errors.lastName?.message}
                        {...register('lastName')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Especialidad
                        </label>
                        <input
                          placeholder="Informática, Electrónica..."
                          className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                          {...register('specialty')}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Año cursado
                        </label>
                        <select
                          className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                          {...register('year')}
                        >
                          <option value="">Seleccionar...</option>
                          {[1, 2, 3, 4].map(y => (
                            <option key={y} value={y}>{y}° año</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {schools.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                          Mi colegio <span className="font-normal normal-case">(opcional)</span>
                        </label>
                        <select
                          className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                          {...register('schoolUserId')}
                        >
                          <option value="">— Sin colegio vinculado —</option>
                          {schools.map(s => (
                            <option key={s.userId} value={s.userId}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {(selectedRole === 'EMPRESA' || selectedRole === 'COLEGIO') && (
                  <Input
                    label={selectedRole === 'EMPRESA' ? 'Nombre de la empresa *' : 'Nombre del colegio *'}
                    placeholder={selectedRole === 'EMPRESA' ? 'TechCorp Chile SpA' : 'Centro Educacional Cardenal José María Caro'}
                    error={errors.orgName?.message}
                    {...register('orgName')}
                  />
                )}

                <Input
                  label="Email *"
                  type="email"
                  placeholder="tu@email.com"
                  icon="mail"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <PasswordInput
                  label="Contraseña *"
                  placeholder="Mínimo 6 caracteres"
                  error={errors.password?.message}
                  {...register('password')}
                />

                {error && (
                  <div className="flex items-center gap-2 bg-error-container rounded-xl px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-[18px] text-error shrink-0">error</span>
                    <span className="text-on-error-container">{error}</span>
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Crear cuenta como {selectedRoleData.label}
                </Button>

                <p className="text-[11px] text-outline text-center">
                  Al crear una cuenta aceptas nuestros{' '}
                  <a href="#" className="underline">Términos de uso</a> y{' '}
                  <a href="#" className="underline">Política de privacidad</a>.
                </p>
              </form>

              <p className="text-center text-sm text-on-surface-variant mt-6">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
