import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Red Talento TP — Construye tu identidad profesional' }

const stats = [
  { value: '50k+', label: 'Talentos activos' },
  { value: '1.2k', label: 'Empresas aliadas' },
  { value: '94%', label: 'Tasa de empleabilidad' },
  { value: '340+', label: 'Colegios técnicos' },
]

const studentBenefits = [
  { icon: 'person_pin', title: 'Identidad profesional', description: 'Construye un perfil que muestre tus habilidades reales, proyectos y logros desde el colegio.' },
  { icon: 'verified', title: 'Validación institucional', description: 'El colegio certifica tus competencias, dándole credibilidad a tu perfil frente a las empresas.' },
  { icon: 'work', title: 'Oportunidades reales', description: 'Accede a prácticas y pasantías con match de compatibilidad para saber para qué estás listo.' },
  { icon: 'trending_up', title: 'Índice de empleabilidad', description: 'Tu score de preparación sube a medida que completas tu perfil, habilidades y evidencias.' },
]

const companyBenefits = [
  { icon: 'manage_search', title: 'Búsqueda inteligente', description: 'Filtra estudiantes por especialidad, habilidades, año de carrera y nivel de preparación.' },
  { icon: 'folder_open', title: 'Portafolio verificado', description: 'Revisa proyectos, certificaciones y evidencias reales de cada candidato antes de contactar.' },
  { icon: 'hub', title: 'Talento temprano', description: 'Conecta con talento antes de que egrese y forma pipeline propio de candidatos de calidad.' },
  { icon: 'mail', title: 'Contacto directo', description: 'Comunícate directamente con estudiantes a través de mensajería interna de la plataforma.' },
]

const schoolBenefits = [
  { icon: 'monitoring', title: 'Panel de seguimiento', description: 'Monitorea el avance profesional de tus egresados y mide la empleabilidad de tu plantel.' },
  { icon: 'verified_user', title: 'Validación de competencias', description: 'Certifica habilidades y emite validaciones oficiales que potencian los perfiles estudiantiles.' },
  { icon: 'group_add', title: 'Carga masiva', description: 'Integra a todos tus estudiantes rápidamente con herramientas de carga y gestión en lote.' },
  { icon: 'campaign', title: 'Publicaciones institucionales', description: 'Comparte noticias, eventos y logros del colegio para mantener la comunidad activa.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-black text-primary tracking-tighter font-headline">Red Talento</span>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-on-surface-variant">
            {['Talento', 'Empresas', 'Colegios', 'Nosotros'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-surface-container/50">
                {item}
              </a>
            ))}
            <Link href="/public/observar" className="hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-surface-container/50 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Observar
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors px-3 py-2">
              Iniciar sesión
            </Link>
            <Link href="/auth/register"
              className="bg-primary-container text-on-primary px-5 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-opacity">
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface to-primary-fixed/30" />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary-fixed/20 to-transparent" />
          {/* Decorative circles */}
          <div className="absolute -right-32 top-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-16 top-1/2 w-64 h-64 rounded-full bg-primary/8 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-24">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 mb-6 text-[11px] font-black tracking-widest uppercase bg-primary-container text-on-primary rounded animate-fade-in">
              Editorial Excellence
            </span>

            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.05] mb-8 animate-slide-up">
              Construye tu <br />
              <span className="text-primary italic">identidad</span> profesional
            </h1>

            <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed animate-slide-up animate-delay-100">
              Conecta con oportunidades, muestra lo que sabes hacer y valida tus habilidades en la red líder de talento técnico.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up animate-delay-200">
              <Link href="/auth/register?role=STUDENT"
                className="inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary px-8 py-4 rounded-md font-bold text-lg hover:shadow-elevated transition-all hover:opacity-90">
                Soy Estudiante
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
              <Link href="/auth/register?role=COLEGIO"
                className="inline-flex items-center justify-center bg-surface-container-high text-on-surface px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container-highest transition-all">
                Soy Colegio
              </Link>
              <Link href="/auth/register?role=EMPRESA"
                className="inline-flex items-center justify-center bg-surface-container-high text-on-surface px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container-highest transition-all">
                Soy Empresa
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-outline animate-pulse-soft">
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="py-16 bg-primary-container">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl font-extrabold text-on-primary font-headline mb-1">{value}</div>
                <div className="text-sm font-semibold uppercase tracking-wider text-on-primary/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is Red Talento ─────────────────────────────────────────── */}
      <section id="nosotros" className="py-32 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-outline mb-4 block">
                La plataforma
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-8">
                Una red profesional para talento técnico
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-10">
                Red Talento no es solo un portal de empleo; es un ecosistema diseñado para visibilizar la maestría técnica. Democratizamos el acceso a las mejores empresas permitiendo que tu trabajo hable por ti.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {stats.slice(0, 2).map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-4xl font-extrabold text-primary font-headline mb-1">{value}</div>
                    <div className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual block */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'person_pin', title: 'Perfil profesional', bg: 'editorial-gradient', text: 'text-on-primary' },
                { icon: 'verified',   title: 'Validaciones',       bg: 'bg-surface-container-lowest', text: 'text-on-surface' },
                { icon: 'work',       title: 'Oportunidades',      bg: 'bg-surface-container-lowest', text: 'text-on-surface' },
                { icon: 'school',     title: 'Respaldo escolar',   bg: 'bg-primary-fixed',             text: 'text-primary' },
              ].map(({ icon, title, bg, text }) => (
                <div key={title} className={`p-6 rounded-xl ${bg === 'editorial-gradient' ? 'editorial-gradient' : bg} shadow-editorial`}>
                  <span className={`material-symbols-outlined text-[32px] ${text} icon-filled`}>{icon}</span>
                  <p className={`mt-3 font-semibold ${text} text-sm font-headline`}>{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits: Estudiantes ───────────────────────────────────────── */}
      <section id="talento" className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-[11px] font-black uppercase tracking-widest text-outline mb-3 block">Para estudiantes</span>
            <h2 className="font-headline text-4xl font-bold text-on-surface">Tu carrera comienza aquí</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studentBenefits.map(({ icon, title, description }) => (
              <div key={title} className="card p-6 card-hover">
                <div className="w-12 h-12 rounded-xl editorial-gradient flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-on-primary icon-filled">{icon}</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-2">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits: Empresas ─────────────────────────────────────────── */}
      <section id="empresas" className="py-32 bg-primary-container">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-[11px] font-black uppercase tracking-widest text-on-primary/60 mb-3 block">Para empresas</span>
            <h2 className="font-headline text-4xl font-bold text-on-primary">Descubre talento antes que nadie</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyBenefits.map(({ icon, title, description }) => (
              <div key={title} className="bg-on-primary/10 backdrop-blur-sm rounded-xl p-6 hover:bg-on-primary/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-on-primary/20 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-on-primary icon-filled">{icon}</span>
                </div>
                <h3 className="font-headline font-bold text-on-primary mb-2">{title}</h3>
                <p className="text-sm text-on-primary/70 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits: Colegios ─────────────────────────────────────────── */}
      <section id="colegios" className="py-32 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-[11px] font-black uppercase tracking-widest text-outline mb-3 block">Para colegios</span>
            <h2 className="font-headline text-4xl font-bold text-on-surface">Potencia la empleabilidad de tus egresados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolBenefits.map(({ icon, title, description }) => (
              <div key={title} className="card p-6 card-hover">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-primary icon-filled">{icon}</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-2">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-32 bg-on-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-inverse-on-surface mb-6 leading-tight">
            ¿Listo para construir tu futuro?
          </h2>
          <p className="text-lg text-inverse-on-surface/60 mb-12 leading-relaxed">
            Únete a la red de talento técnico más grande de Chile. Es gratis para estudiantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary px-8 py-4 rounded-md font-bold text-lg hover:opacity-90 transition-all">
              Empieza gratis
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center justify-center bg-surface/10 text-inverse-on-surface px-8 py-4 rounded-md font-bold text-lg hover:bg-surface/15 transition-all border border-surface/20">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-on-surface py-12 border-t border-surface/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-2xl font-black text-inverse-on-surface tracking-tighter font-headline">
              Red Talento
            </span>
            <p className="text-sm text-inverse-on-surface/40">
              © {new Date().getFullYear()} Red Talento TP. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
