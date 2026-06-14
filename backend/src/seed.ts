/**
 * Seed script — Red Talento TP
 * Run: npx ts-node -r tsconfig-paths/register src/seed.ts
 *
 * Creates:
 *  - 1 school
 *  - 50 students (varied profiles, skills, evidences)
 *  - 10 companies
 *  - 25 job offers
 *  - ~60 applications
 *
 * Safe to re-run: clears all seeded data first (users with seeded emails).
 */

import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(__dirname, '..', '.env') })
import { DataSource } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from './users/entities/user.entity'
import { StudentProfile } from './students/entities/student-profile.entity'
import { CompanyProfile } from './companies/entities/company-profile.entity'
import { SchoolProfile } from './schools/entities/school-profile.entity'
import { Skill, SkillCategory, ValidationStatus } from './skills/entities/skill.entity'
import { PortfolioEvidence, EvidenceType } from './students/entities/portfolio-evidence.entity'
import { Opportunity, OpportunityType } from './opportunities/entities/opportunity.entity'
import { Application, ApplicationStatus } from './applications/entities/application.entity'

// ─────────────────────────────────────────────────────────────────────────────
// DB connection (reads same env vars as app)
// ─────────────────────────────────────────────────────────────────────────────
const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL ? {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },  // For Supabase SSL
  } : {
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME     ?? 'red_talento_tp',
  }),
  entities: [
    User, StudentProfile, CompanyProfile, SchoolProfile,
    Skill, PortfolioEvidence, Opportunity, Application,
  ],
  synchronize: false,
  logging: false,
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const SEED_PASSWORD = 'Demo1234!'
const SCHOOL_EMAIL  = 'colegio@redtalento.cl'
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// ─────────────────────────────────────────────────────────────────────────────
// Data tables
// ─────────────────────────────────────────────────────────────────────────────

const STUDENT_NAMES = [
  ['Matías', 'Arancibia'], ['Valentina', 'Salinas'], ['Benjamín', 'Rojas'],
  ['Camila', 'Fuentes'], ['Diego', 'Muñoz'], ['Sofía', 'Herrera'],
  ['Nicolás', 'Vega'], ['Isidora', 'Morales'], ['Felipe', 'Castro'],
  ['Antonia', 'Pizarro'], ['Sebastián', 'Navarro'], ['Catalina', 'Ríos'],
  ['Joaquín', 'Sepúlveda'], ['Fernanda', 'Ortega'], ['Cristóbal', 'Vargas'],
  ['Daniela', 'Contreras'], ['Ignacio', 'Soto'], ['Javiera', 'Alvarado'],
  ['Tomás', 'Espinoza'], ['Bárbara', 'Molina'], ['Andrés', 'Torres'],
  ['Martina', 'González'], ['Roberto', 'Díaz'], ['Amanda', 'Reyes'],
  ['Gustavo', 'Paredes'], ['Valentina', 'Meza'], ['Eduardo', 'Campos'],
  ['Florencia', 'Lara'], ['Maximiliano', 'Vera'], ['Constanza', 'Ibáñez'],
  ['Pablo', 'Acevedo'], ['Rocío', 'Bustos'], ['Alejandro', 'Figueroa'],
  ['Gabriela', 'Cortés'], ['Rodrigo', 'Peña'], ['Patricia', 'Saavedra'],
  ['Javier', 'Medina'], ['Andrea', 'Valenzuela'], ['Carlos', 'Ávila'],
  ['Ximena', 'Carrasco'], ['Héctor', 'Riquelme'], ['Macarena', 'Poblete'],
  ['Leonardo', 'Tapia'], ['Natalia', 'Jara'], ['Sergio', 'Aguilera'],
  ['Claudia', 'Caro'], ['Mauricio', 'Pino'], ['Paulina', 'Leiva'],
  ['Ricardo', 'Garrido'], ['Victoria', 'Santibáñez'],
]

const SPECIALTIES = [
  'Programación', 'Redes y Telecomunicaciones', 'Electricidad',
  'Mecánica Automotriz', 'Administración', 'Gastronomía', 'Contabilidad',
]

const HEADLINES: Record<string, string[]> = {
  'Programación': [
    'Desarrollador web con foco en frontend React',
    'Apasionado por el desarrollo de software y las APIs',
    'Estudiante de programación con proyectos en Node.js y Python',
  ],
  'Redes y Telecomunicaciones': [
    'Técnico en redes con experiencia en configuración de routers Cisco',
    'Especialista en infraestructura de red y seguridad',
    'Estudiante de redes con certificación CompTIA N+ en proceso',
  ],
  'Electricidad': [
    'Técnico electricista con experiencia en instalaciones industriales',
    'Estudiante de electricidad con proyectos de automatización domótica',
    'Apasionado por los sistemas de energía solar fotovoltaica',
  ],
  'Mecánica Automotriz': [
    'Técnico automotriz con manejo de diagnóstico OBD2',
    'Estudiante de mecánica con experiencia en taller escolar',
    'Interesado en vehículos eléctricos e híbridos',
  ],
  'Administración': [
    'Estudiante de administración con manejo avanzado de Excel',
    'Interesado en gestión de RRHH y procesos empresariales',
    'Apasionado por el marketing digital y análisis de datos',
  ],
  'Gastronomía': [
    'Cocinero técnico con especialización en cocina chilena e internacional',
    'Estudiante de gastronomía con experiencia en eventos y catering',
    'Apasionado por la repostería y la cocina de vanguardia',
  ],
  'Contabilidad': [
    'Estudiante de contabilidad con manejo de software ERP',
    'Interesado en finanzas corporativas y tributación',
    'Apasionado por el análisis financiero y auditoría',
  ],
}

const SKILLS_BY_SPECIALTY: Record<string, Array<{ name: string; category: SkillCategory }>> = {
  'Programación': [
    { name: 'JavaScript', category: SkillCategory.TECNICA },
    { name: 'React', category: SkillCategory.TECNICA },
    { name: 'Node.js', category: SkillCategory.TECNICA },
    { name: 'Python', category: SkillCategory.TECNICA },
    { name: 'SQL', category: SkillCategory.TECNICA },
    { name: 'Git', category: SkillCategory.TECNICA },
    { name: 'HTML/CSS', category: SkillCategory.TECNICA },
    { name: 'TypeScript', category: SkillCategory.TECNICA },
    { name: 'REST APIs', category: SkillCategory.TECNICA },
    { name: 'Trabajo en equipo', category: SkillCategory.BLANDA },
    { name: 'Resolución de problemas', category: SkillCategory.BLANDA },
    { name: 'Comunicación efectiva', category: SkillCategory.BLANDA },
    { name: 'Certificado AWS Cloud Practitioner', category: SkillCategory.CERTIFICACION },
  ],
  'Redes y Telecomunicaciones': [
    { name: 'Cisco IOS', category: SkillCategory.TECNICA },
    { name: 'TCP/IP', category: SkillCategory.TECNICA },
    { name: 'VLANs', category: SkillCategory.TECNICA },
    { name: 'Firewall/Seguridad', category: SkillCategory.TECNICA },
    { name: 'Linux', category: SkillCategory.TECNICA },
    { name: 'Wi-Fi / 802.11', category: SkillCategory.TECNICA },
    { name: 'Cableado estructurado', category: SkillCategory.TECNICA },
    { name: 'Pensamiento analítico', category: SkillCategory.BLANDA },
    { name: 'Trabajo bajo presión', category: SkillCategory.BLANDA },
    { name: 'Certificado CCNA', category: SkillCategory.CERTIFICACION },
  ],
  'Electricidad': [
    { name: 'Instalaciones eléctricas', category: SkillCategory.TECNICA },
    { name: 'Automatización PLC', category: SkillCategory.TECNICA },
    { name: 'Energía solar FV', category: SkillCategory.TECNICA },
    { name: 'Lectura de planos', category: SkillCategory.TECNICA },
    { name: 'Tableros eléctricos', category: SkillCategory.TECNICA },
    { name: 'Normativa SEC', category: SkillCategory.TECNICA },
    { name: 'Trabajo en equipo', category: SkillCategory.BLANDA },
    { name: 'Responsabilidad', category: SkillCategory.BLANDA },
    { name: 'Licencia SEC Clase B', category: SkillCategory.CERTIFICACION },
  ],
  'Mecánica Automotriz': [
    { name: 'Diagnóstico OBD2', category: SkillCategory.TECNICA },
    { name: 'Motor a explosión', category: SkillCategory.TECNICA },
    { name: 'Sistemas de frenos', category: SkillCategory.TECNICA },
    { name: 'Transmisión automática', category: SkillCategory.TECNICA },
    { name: 'Soldadura MIG', category: SkillCategory.TECNICA },
    { name: 'Vehículos híbridos', category: SkillCategory.TECNICA },
    { name: 'Atención al cliente', category: SkillCategory.BLANDA },
    { name: 'Proactividad', category: SkillCategory.BLANDA },
  ],
  'Administración': [
    { name: 'Microsoft Excel', category: SkillCategory.TECNICA },
    { name: 'SAP básico', category: SkillCategory.TECNICA },
    { name: 'Gestión de inventario', category: SkillCategory.TECNICA },
    { name: 'Marketing digital', category: SkillCategory.TECNICA },
    { name: 'Recursos Humanos', category: SkillCategory.TECNICA },
    { name: 'Comunicación efectiva', category: SkillCategory.BLANDA },
    { name: 'Liderazgo', category: SkillCategory.BLANDA },
    { name: 'Gestión del tiempo', category: SkillCategory.BLANDA },
    { name: 'Certificado Google Analytics', category: SkillCategory.CERTIFICACION },
  ],
  'Gastronomía': [
    { name: 'Cocina chilena', category: SkillCategory.TECNICA },
    { name: 'Pastelería y repostería', category: SkillCategory.TECNICA },
    { name: 'BPM (Buenas Prácticas de Manufactura)', category: SkillCategory.TECNICA },
    { name: 'Cocina de autor', category: SkillCategory.TECNICA },
    { name: 'Servicio de sala', category: SkillCategory.TECNICA },
    { name: 'Creatividad', category: SkillCategory.BLANDA },
    { name: 'Trabajo bajo presión', category: SkillCategory.BLANDA },
    { name: 'Atención al detalle', category: SkillCategory.BLANDA },
    { name: 'Manipulación de alimentos', category: SkillCategory.CERTIFICACION },
  ],
  'Contabilidad': [
    { name: 'Contabilidad general', category: SkillCategory.TECNICA },
    { name: 'Software ERP (Softland)', category: SkillCategory.TECNICA },
    { name: 'Tributación SII', category: SkillCategory.TECNICA },
    { name: 'Excel avanzado', category: SkillCategory.TECNICA },
    { name: 'Auditoría', category: SkillCategory.TECNICA },
    { name: 'Finanzas corporativas', category: SkillCategory.TECNICA },
    { name: 'Responsabilidad', category: SkillCategory.BLANDA },
    { name: 'Pensamiento analítico', category: SkillCategory.BLANDA },
    { name: 'Certificado SII', category: SkillCategory.CERTIFICACION },
  ],
}

const EVIDENCE_TEMPLATES: Record<string, Array<{ title: string; description: string; type: EvidenceType; tags: string[] }>> = {
  'Programación': [
    { title: 'Sistema de gestión escolar web', description: 'Aplicación full-stack con React y Node.js para gestión de notas y asistencia', type: EvidenceType.PROYECTO, tags: ['React', 'Node.js', 'PostgreSQL'] },
    { title: 'API REST de inventario', description: 'Backend en Express con autenticación JWT y documentación Swagger', type: EvidenceType.PROYECTO, tags: ['Node.js', 'REST', 'JWT'] },
    { title: 'Certificado curso Python - Platzi', description: 'Curso de fundamentos de Python y análisis de datos con pandas', type: EvidenceType.CERTIFICADO, tags: ['Python', 'Platzi'] },
    { title: 'Portafolio personal', description: 'Sitio web personal con proyectos y habilidades', type: EvidenceType.PROYECTO, tags: ['HTML', 'CSS', 'JavaScript'] },
  ],
  'Redes y Telecomunicaciones': [
    { title: 'Configuración de red empresarial simulada', description: 'Simulación en Packet Tracer de una red con VLANs, routing OSPF y seguridad ACL', type: EvidenceType.PROYECTO, tags: ['Cisco', 'VLAN', 'OSPF'] },
    { title: 'Instalación de red Wi-Fi corporativa', description: 'Práctica real de instalación de puntos de acceso y controladora inalámbrica en colegio', type: EvidenceType.FOTO, tags: ['Wi-Fi', 'Red'] },
    { title: 'Certificado Cisco NetAcad IT Essentials', description: 'Completado el curso oficial de Cisco sobre hardware, SO y redes básicas', type: EvidenceType.CERTIFICADO, tags: ['Cisco', 'CompTIA'] },
  ],
  'Electricidad': [
    { title: 'Instalación eléctrica trifásica taller', description: 'Proyecto de instalación completa de tablero trifásico para taller industrial del colegio', type: EvidenceType.FOTO, tags: ['Instalación', 'Trifásico'] },
    { title: 'Panel solar 3kW residencial', description: 'Diseño e instalación de sistema fotovoltaico de 3kW con inversor On-Grid', type: EvidenceType.PROYECTO, tags: ['Solar', 'Fotovoltaico'] },
    { title: 'Certificado Manipulación Segura de Electricidad', description: 'Certificado emitido por SENCE sobre normas de seguridad eléctrica', type: EvidenceType.CERTIFICADO, tags: ['Seguridad', 'SENCE'] },
  ],
  'Mecánica Automotriz': [
    { title: 'Diagnóstico y reparación motor Toyota Corolla', description: 'Práctica de diagnóstico completo con escáner OBD2 y reparación de sistema de inyección', type: EvidenceType.FOTO, tags: ['OBD2', 'Toyota', 'Diagnóstico'] },
    { title: 'Mantenimiento preventivo 50 vehículos', description: 'Participación en campaña de mantenciones gratuitas en feria técnica del colegio', type: EvidenceType.DESCRIPCION, tags: ['Mantención', 'Taller'] },
  ],
  'Administración': [
    { title: 'Plan de negocios empresa ficticia', description: 'Desarrollo de plan de negocios completo para empresa de servicios digitales, incluyendo proyecciones financieras', type: EvidenceType.PROYECTO, tags: ['Negocios', 'Finanzas'] },
    { title: 'Campaña de marketing digital', description: 'Gestión de redes sociales y Google Ads para negocio local, aumentando ventas en 30%', type: EvidenceType.DESCRIPCION, tags: ['Marketing', 'Redes Sociales'] },
    { title: 'Certificado Google Digital Garage', description: 'Certificado en fundamentos de marketing digital', type: EvidenceType.CERTIFICADO, tags: ['Google', 'Marketing'] },
  ],
  'Gastronomía': [
    { title: 'Menú degustación 5 tiempos', description: 'Preparación y presentación de menú de autor para evento escolar de 80 comensales', type: EvidenceType.FOTO, tags: ['Cocina', 'Evento'] },
    { title: 'Pastelería artesanal para venta', description: 'Emprendimiento personal de repostería fina con ventas por Instagram', type: EvidenceType.DESCRIPCION, tags: ['Repostería', 'Emprendimiento'] },
    { title: 'Certificado Manipulación de Alimentos', description: 'Certificado oficial SEREMI de Salud para manipulación de alimentos', type: EvidenceType.CERTIFICADO, tags: ['SEREMI', 'Alimentos'] },
  ],
  'Contabilidad': [
    { title: 'Sistema de contabilidad PYME', description: 'Implementación de Softland ERP para pequeña empresa de servicios, incluyendo migración de datos', type: EvidenceType.PROYECTO, tags: ['Softland', 'ERP', 'PYME'] },
    { title: 'Declaración de IVA y renta', description: 'Práctica supervisada de declaraciones tributarias ante el SII', type: EvidenceType.DESCRIPCION, tags: ['SII', 'Tributación'] },
    { title: 'Certificado Tributación SII - SENCE', description: 'Curso de tributación para PYMES, dictado en modalidad online por SII', type: EvidenceType.CERTIFICADO, tags: ['SII', 'Tributación', 'SENCE'] },
  ],
}

const COMPANIES = [
  {
    email: 'techsolutions@redtalento.cl',
    name: 'TechSolutions Chile SpA',
    industry: 'Tecnología',
    size: '50-200 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Empresa de desarrollo de software y consultoría tecnológica. Trabajamos con clientes en banca, retail y gobierno desarrollando soluciones a medida con tecnologías modernas.',
    website: 'https://techsolutions.cl',
  },
  {
    email: 'maquinariacentral@redtalento.cl',
    name: 'Maquinaria Central S.A.',
    industry: 'Construcción e Ingeniería',
    size: '200-500 empleados',
    location: 'Concepción, Biobío',
    description: 'Empresa líder en venta y mantención de maquinaria pesada para construcción y minería. Distribuidor oficial de Caterpillar en la zona sur.',
    website: 'https://maquinariacentral.cl',
  },
  {
    email: 'supermercadosandino@redtalento.cl',
    name: 'Supermercados Andino',
    industry: 'Retail',
    size: '500-1000 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Cadena de supermercados con presencia en toda la Región Metropolitana. Buscamos incorporar jóvenes talentos en áreas de logística, administración y gastronomía.',
    website: 'https://andino.cl',
  },
  {
    email: 'logisticaexpress@redtalento.cl',
    name: 'Logística Express Ltda.',
    industry: 'Logística y Transporte',
    size: '100-500 empleados',
    location: 'Valparaíso, Valparaíso',
    description: 'Empresa de logística y distribución con flota de 200 vehículos. Operamos en todo Chile con enfoque en e-commerce y distribución de última milla.',
    website: 'https://logisticaexpress.cl',
  },
  {
    email: 'restaurantegaston@redtalento.cl',
    name: 'Gastón Restaurantes S.A.',
    industry: 'Gastronomía y Hotelería',
    size: '50-200 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Grupo de restaurantes con 5 locales en Santiago especializados en cocina chilena contemporánea y cocina de autor. Formamos parte del movimiento gastronómico nacional.',
    website: 'https://gaston.cl',
  },
  {
    email: 'electricidadtotal@redtalento.cl',
    name: 'Electricidad Total SpA',
    industry: 'Energía y Electricidad',
    size: '10-50 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Empresa de servicios eléctricos industriales y residenciales. Especialistas en instalaciones fotovoltaicas y automatización de edificios.',
    website: 'https://electricidadtotal.cl',
  },
  {
    email: 'networkpro@redtalento.cl',
    name: 'NetworkPro Ltda.',
    industry: 'Tecnología e Infraestructura',
    size: '10-50 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Empresa especialista en infraestructura de redes, ciberseguridad y soporte TI para empresas medianas. Partners certificados de Cisco y Fortinet.',
    website: 'https://networkpro.cl',
  },
  {
    email: 'consultoraabc@redtalento.cl',
    name: 'Consultoría ABC & Partners',
    industry: 'Servicios Profesionales',
    size: '10-50 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Firma de consultoría en gestión empresarial, contabilidad y finanzas para PYMES. Ofrecemos prácticas reales con tutoría profesional.',
    website: 'https://abcpartners.cl',
  },
  {
    email: 'automotrizcentrosur@redtalento.cl',
    name: 'Automotriz Centro Sur',
    industry: 'Automotriz',
    size: '50-200 empleados',
    location: 'Rancagua, O\'Higgins',
    description: 'Concesionario multimarca con taller de servicio técnico. Representantes de Toyota, Hyundai y Chevrolet en la región de O\'Higgins.',
    website: 'https://centrosur.cl',
  },
  {
    email: 'innosoft@redtalento.cl',
    name: 'InnoSoft Desarrollo Digital',
    industry: 'Tecnología',
    size: '10-50 empleados',
    location: 'Santiago, Región Metropolitana',
    description: 'Startup de desarrollo de aplicaciones móviles y plataformas SaaS. Trabajamos con metodologías ágiles y tecnologías de última generación.',
    website: 'https://innosoft.cl',
  },
]

const OPPORTUNITIES: Array<{
  companyIdx: number
  title: string
  description: string
  type: OpportunityType
  location: string
  isRemote: boolean
  salary?: string
  skills: string[]
  specialty?: string
  deadline?: string
}> = [
  // TechSolutions Chile (idx 0)
  {
    companyIdx: 0,
    title: 'Pasantía Desarrollador Frontend React',
    description: 'Buscamos estudiante de Programación para apoyar al equipo de desarrollo frontend. Trabajarás en proyectos reales usando React, TypeScript y metodologías ágiles. Mentoring directo de desarrolladores senior.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: true,
    salary: '$350.000 - $450.000 CLP',
    skills: ['React', 'JavaScript', 'TypeScript', 'Git'],
    specialty: 'Programación',
    deadline: '2025-07-31',
  },
  {
    companyIdx: 0,
    title: 'Práctica Desarrollador Backend Node.js',
    description: 'Oportunidad de práctica en desarrollo backend. Participarás en el diseño e implementación de APIs REST, gestión de base de datos y documentación técnica.',
    type: OpportunityType.PRACTICA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$400.000 CLP',
    skills: ['Node.js', 'SQL', 'REST APIs', 'Git'],
    specialty: 'Programación',
    deadline: '2025-08-15',
  },
  {
    companyIdx: 0,
    title: 'Técnico Soporte IT Junior',
    description: 'Posición de trabajo para técnico en soporte IT. Responsable de mantención de equipos, soporte a usuarios y administración de red interna de la empresa.',
    type: OpportunityType.TRABAJO,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$550.000 CLP',
    skills: ['Linux', 'TCP/IP', 'Soporte técnico'],
    specialty: 'Redes y Telecomunicaciones',
  },
  // Maquinaria Central (idx 1)
  {
    companyIdx: 1,
    title: 'Práctica Técnico Mecánico Maquinaria Pesada',
    description: 'Práctica profesional para técnico en mecánica. Aprenderás diagnóstico y mantención de maquinaria Caterpillar bajo supervisión de mecánicos certificados.',
    type: OpportunityType.PRACTICA,
    location: 'Concepción, Biobío',
    isRemote: false,
    salary: '$380.000 CLP',
    skills: ['Diagnóstico OBD2', 'Motor a explosión', 'Sistemas de frenos'],
    specialty: 'Mecánica Automotriz',
    deadline: '2025-06-30',
  },
  {
    companyIdx: 1,
    title: 'Pasantía Técnico Electricista Industrial',
    description: 'Pasantía en área de mantención eléctrica industrial. Trabajarás con tableros de control, PLC y sistemas de automatización en faenas de construcción.',
    type: OpportunityType.PASANTIA,
    location: 'Concepción, Biobío',
    isRemote: false,
    salary: '$300.000 - $380.000 CLP',
    skills: ['Automatización PLC', 'Instalaciones eléctricas', 'Tableros eléctricos'],
    specialty: 'Electricidad',
  },
  {
    companyIdx: 1,
    title: 'Asistente Administrativo',
    description: 'Práctica en área de administración y logística. Apoyo en gestión de inventario de repuestos, control de flota y atención a clientes.',
    type: OpportunityType.PRACTICA,
    location: 'Concepción, Biobío',
    isRemote: false,
    salary: '$350.000 CLP',
    skills: ['Microsoft Excel', 'Gestión de inventario'],
    specialty: 'Administración',
  },
  // Supermercados Andino (idx 2)
  {
    companyIdx: 2,
    title: 'Pasantía Área de Alimentos Preparados',
    description: 'Pasantía en el área de cocina y alimentos preparados de nuestra cadena. Participarás en preparación de productos, control de calidad y normas BPM.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$320.000 CLP',
    skills: ['BPM (Buenas Prácticas de Manufactura)', 'Cocina chilena', 'Manipulación de alimentos'],
    specialty: 'Gastronomía',
    deadline: '2025-07-15',
  },
  {
    companyIdx: 2,
    title: 'Práctica Administración y Logística',
    description: 'Práctica en gestión de inventario, recepción de mercadería y apoyo en administración de local. Experiencia real en retail de alto volumen.',
    type: OpportunityType.PRACTICA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$350.000 - $400.000 CLP',
    skills: ['Gestión de inventario', 'Microsoft Excel', 'Atención al cliente'],
    specialty: 'Administración',
  },
  // Logística Express (idx 3)
  {
    companyIdx: 3,
    title: 'Pasantía Planificación Logística',
    description: 'Pasantía en equipo de planificación de rutas y logística de última milla. Utilizarás sistemas de gestión de flotas y análisis de datos operativos.',
    type: OpportunityType.PASANTIA,
    location: 'Valparaíso',
    isRemote: false,
    salary: '$330.000 CLP',
    skills: ['Microsoft Excel', 'Gestión de inventario', 'Comunicación efectiva'],
    specialty: 'Administración',
  },
  {
    companyIdx: 3,
    title: 'Técnico Mantención Flota Vehicular',
    description: 'Trabajo de técnico en mantención preventiva y correctiva de flota de camiones y vehículos de reparto. Estabilidad laboral y crecimiento profesional.',
    type: OpportunityType.TRABAJO,
    location: 'Valparaíso',
    isRemote: false,
    salary: '$650.000 - $750.000 CLP',
    skills: ['Motor a explosión', 'Sistemas de frenos', 'Diagnóstico OBD2'],
    specialty: 'Mecánica Automotriz',
  },
  // Gastón Restaurantes (idx 4)
  {
    companyIdx: 4,
    title: 'Pasantía Cocina Fría y Caliente',
    description: 'Pasantía en cocina de restaurante premiado. Rotación por todas las partidas: garde manger, salsas, postres y coordinación de eventos. Aprendizaje acelerado.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$350.000 - $420.000 CLP',
    skills: ['Cocina chilena', 'Cocina de autor', 'Trabajo bajo presión', 'Creatividad'],
    specialty: 'Gastronomía',
    deadline: '2025-08-01',
  },
  {
    companyIdx: 4,
    title: 'Ayudante de Pastelero',
    description: 'Posición de trabajo para ayudante en área de pastelería. Producción de postres artesanales, chocolatería y panadería fina. Turno fijo.',
    type: OpportunityType.TRABAJO,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$500.000 CLP',
    skills: ['Pastelería y repostería', 'Atención al detalle', 'BPM (Buenas Prácticas de Manufactura)'],
    specialty: 'Gastronomía',
  },
  // Electricidad Total (idx 5)
  {
    companyIdx: 5,
    title: 'Práctica Instalaciones Solares Fotovoltaicas',
    description: 'Práctica en instalación y puesta en marcha de sistemas solares fotovoltaicos residenciales e industriales. Empresa en pleno crecimiento del sector energético.',
    type: OpportunityType.PRACTICA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$380.000 - $450.000 CLP',
    skills: ['Energía solar FV', 'Instalaciones eléctricas', 'Normativa SEC'],
    specialty: 'Electricidad',
    deadline: '2025-09-30',
  },
  {
    companyIdx: 5,
    title: 'Técnico Electricista Industrial',
    description: 'Técnico electricista para mantención de tableros industriales, motores y sistemas de control. Requiere conocimientos en PLC y automatización.',
    type: OpportunityType.TRABAJO,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$700.000 - $900.000 CLP',
    skills: ['Automatización PLC', 'Tableros eléctricos', 'Instalaciones eléctricas'],
    specialty: 'Electricidad',
  },
  {
    companyIdx: 5,
    title: 'Pasantía Domótica y Automatización',
    description: 'Proyecto de pasantía en instalación de sistemas de domótica y automatización residencial. Tecnologías: KNX, Zigbee, Home Assistant.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$300.000 CLP',
    skills: ['Automatización PLC', 'Instalaciones eléctricas', 'Resolución de problemas'],
    specialty: 'Electricidad',
  },
  // NetworkPro (idx 6)
  {
    companyIdx: 6,
    title: 'Pasantía Infraestructura de Redes',
    description: 'Pasantía en área de infraestructura. Participarás en proyectos de instalación de redes empresariales, configuración de switches/routers Cisco y soporte técnico.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$350.000 CLP',
    skills: ['Cisco IOS', 'VLANs', 'TCP/IP', 'Cableado estructurado'],
    specialty: 'Redes y Telecomunicaciones',
    deadline: '2025-07-31',
  },
  {
    companyIdx: 6,
    title: 'Técnico Soporte IT y Redes',
    description: 'Trabajo de técnico en soporte IT para clientes corporativos. Resolución de incidentes, gestión de tickets y mantención de infraestructura de red.',
    type: OpportunityType.TRABAJO,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$580.000 - $680.000 CLP',
    skills: ['TCP/IP', 'Linux', 'Firewall/Seguridad', 'Pensamiento analítico'],
    specialty: 'Redes y Telecomunicaciones',
  },
  // Consultoría ABC (idx 7)
  {
    companyIdx: 7,
    title: 'Práctica Contabilidad y Tributación',
    description: 'Práctica en área contable de firma de consultoría. Apoyo en confección de estados financieros, declaraciones de impuestos y asesoría tributaria a clientes PYME.',
    type: OpportunityType.PRACTICA,
    location: 'Santiago, RM',
    isRemote: true,
    salary: '$360.000 CLP',
    skills: ['Contabilidad general', 'Tributación SII', 'Excel avanzado', 'Software ERP (Softland)'],
    specialty: 'Contabilidad',
    deadline: '2025-08-31',
  },
  {
    companyIdx: 7,
    title: 'Asistente Administrativo y RRHH',
    description: 'Práctica en gestión de recursos humanos y administración de oficina. Reclutamiento, nóminas, contratos y apoyo en gestión documental.',
    type: OpportunityType.PRACTICA,
    location: 'Santiago, RM',
    isRemote: false,
    salary: '$340.000 - $380.000 CLP',
    skills: ['Recursos Humanos', 'Microsoft Excel', 'Gestión del tiempo'],
    specialty: 'Administración',
  },
  {
    companyIdx: 7,
    title: 'Proyecto Auditoría Interna PYME',
    description: 'Proyecto de 3 meses para auditoría interna de procesos contables en empresa cliente. Trabajo real con impacto directo.',
    type: OpportunityType.PROYECTO,
    location: 'Santiago, RM',
    isRemote: true,
    salary: '$400.000 CLP',
    skills: ['Auditoría', 'Contabilidad general', 'Pensamiento analítico'],
    specialty: 'Contabilidad',
  },
  // Automotriz Centro Sur (idx 8)
  {
    companyIdx: 8,
    title: 'Pasantía Taller Servicio Técnico Toyota',
    description: 'Pasantía en taller Toyota. Aprenderás diagnóstico computarizado, mantención preventiva y sistema de garantías bajo supervisión de mecánicos certificados.',
    type: OpportunityType.PASANTIA,
    location: 'Rancagua, O\'Higgins',
    isRemote: false,
    salary: '$320.000 - $380.000 CLP',
    skills: ['Diagnóstico OBD2', 'Motor a explosión', 'Vehículos híbridos'],
    specialty: 'Mecánica Automotriz',
    deadline: '2025-06-30',
  },
  {
    companyIdx: 8,
    title: 'Técnico Mecánico Automotriz',
    description: 'Técnico mecánico para taller multimarca. Experiencia en diagnóstico y reparación de vehículos de diferentes marcas. Beneficios: uniforme, alimentación y seguro.',
    type: OpportunityType.TRABAJO,
    location: 'Rancagua, O\'Higgins',
    isRemote: false,
    salary: '$650.000 - $800.000 CLP',
    skills: ['Diagnóstico OBD2', 'Transmisión automática', 'Sistemas de frenos', 'Soldadura MIG'],
    specialty: 'Mecánica Automotriz',
  },
  // InnoSoft (idx 9)
  {
    companyIdx: 9,
    title: 'Pasantía Desarrollo Aplicación Móvil',
    description: 'Pasantía en startup de desarrollo mobile. Participarás en el desarrollo de una app React Native para cliente del sector fintech. Ambiente dinámico y aprendizaje continuo.',
    type: OpportunityType.PASANTIA,
    location: 'Santiago, RM',
    isRemote: true,
    salary: '$380.000 - $480.000 CLP',
    skills: ['JavaScript', 'React', 'Git', 'Trabajo en equipo'],
    specialty: 'Programación',
    deadline: '2025-07-15',
  },
  {
    companyIdx: 9,
    title: 'Proyecto Automatización con Python',
    description: 'Proyecto de 2 meses para automatizar procesos de un cliente usando Python y scripts de integración. Trabajo 100% remoto con reuniones diarias.',
    type: OpportunityType.PROYECTO,
    location: 'Santiago, RM',
    isRemote: true,
    salary: '$400.000 CLP',
    skills: ['Python', 'REST APIs', 'SQL'],
    specialty: 'Programación',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Score calculator (simplified version of backend logic)
// ─────────────────────────────────────────────────────────────────────────────
function computeScore(sp: { skills: Partial<Skill>[]; evidences: { id: string }[]; bio?: string; headline?: string; linkedinUrl?: string; githubUrl?: string }) {
  let score = 0
  const validated = sp.skills.filter(s => s.isValidated).length
  const total     = sp.skills.length
  if (total > 0) score += Math.round((validated / total) * 40)
  score += Math.min(sp.evidences.length * 10, 30)
  if (sp.bio)          score += 10
  if (sp.headline)     score += 5
  if (sp.linkedinUrl || sp.githubUrl) score += 5
  if (total >= 5)      score += 10
  return Math.min(score, 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Connecting to database...')
  await AppDataSource.initialize()

  const usersRepo        = AppDataSource.getRepository(User)
  const studentsRepo     = AppDataSource.getRepository(StudentProfile)
  const companiesRepo    = AppDataSource.getRepository(CompanyProfile)
  const schoolsRepo      = AppDataSource.getRepository(SchoolProfile)
  const skillsRepo       = AppDataSource.getRepository(Skill)
  const evidencesRepo    = AppDataSource.getRepository(PortfolioEvidence)
  const oppsRepo         = AppDataSource.getRepository(Opportunity)
  const appsRepo         = AppDataSource.getRepository(Application)

  // ── Cleanup: remove previous seed data ───────────────────────────────────
  console.log('🧹 Cleaning previous seed data...')
  const seedEmails = [
    SCHOOL_EMAIL,
    ...COMPANIES.map(c => c.email),
    ...STUDENT_NAMES.map(([f, l]) =>
      `${f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${l.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@alumnos.colegiocaro.cl`
    ),
  ]
  const existingUsers = await usersRepo.find({ where: seedEmails.map(email => ({ email })) })
  if (existingUsers.length > 0) {
    await usersRepo.remove(existingUsers) // cascades via FK
  }

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10)

  // ── 1. School ─────────────────────────────────────────────────────────────
  console.log('🏫 Creating school...')
  const schoolUser = usersRepo.create({ email: SCHOOL_EMAIL, password: hashedPassword, role: UserRole.COLEGIO })
  await usersRepo.save(schoolUser)

  const school = schoolsRepo.create({
    userId: schoolUser.id,
    name: 'Centro Educacional Cardenal José María Caro',
    description: 'Establecimiento técnico profesional comprometido con la formación integral de técnicos de nivel medio. Preparamos a nuestros estudiantes para una inserción laboral exitosa y el desarrollo de sus competencias profesionales.',
    location: 'Región Metropolitana',
    website: 'https://colegiocaro.cl',
    specialties: ['Programación', 'Redes y Telecomunicaciones', 'Electricidad', 'Mecánica Automotriz', 'Administración', 'Gastronomía', 'Contabilidad'],
  })
  await schoolsRepo.save(school)

  // ── 2. Students ───────────────────────────────────────────────────────────
  console.log('👨‍🎓 Creating 50 students...')
  const studentProfiles: StudentProfile[] = []

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const [firstName, lastName] = STUDENT_NAMES[i]
    const specialty  = SPECIALTIES[i % SPECIALTIES.length]
    const year       = randInt(1, 4)
    const isComplete = i < 35  // 35 complete, 15 incomplete

    const emailBase = `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`
    const email = `${emailBase}@alumnos.colegiocaro.cl`

    const stuUser = usersRepo.create({ email, password: hashedPassword, role: UserRole.STUDENT })
    await usersRepo.save(stuUser)

    const headlines = HEADLINES[specialty] ?? [`Estudiante de ${specialty}`]
    const bio = isComplete
      ? `Estudiante de ${specialty} en el ${school.name}, cursando ${year}° año. Me apasiona mi especialidad y busco oportunidades para aplicar mis conocimientos en un ambiente laboral real. Comprometido con el aprendizaje continuo y el trabajo en equipo.`
      : undefined

    const sp = studentsRepo.create({
      userId:      stuUser.id,
      firstName,
      lastName,
      specialty,
      year,
      gpa:         isComplete ? parseFloat((randInt(45, 70) / 10).toFixed(1)) : undefined,
      headline:    isComplete ? pick(headlines) : undefined,
      bio,
      location:    isComplete ? pick(['Santiago, RM', 'Valparaíso', 'Concepción', 'Rancagua', 'San Bernardo, RM']) : undefined,
      phone:       isComplete ? `+569${randInt(10000000, 99999999)}` : undefined,
      githubUrl:   isComplete && specialty === 'Programación' ? `https://github.com/${emailBase.replace('.', '')}` : undefined,
      linkedinUrl: isComplete && i < 20 ? `https://linkedin.com/in/${emailBase.replace('.', '-')}` : undefined,
      readinessScore: 0,
    })
    await studentsRepo.save(sp)

    // ── Skills ──────────────────────────────────────────────────────────────
    const availableSkills = SKILLS_BY_SPECIALTY[specialty] ?? []
    const skillCount = isComplete ? randInt(5, 9) : randInt(2, 4)
    const chosenSkills = pickN(availableSkills, Math.min(skillCount, availableSkills.length))

    const skillEntities: Skill[] = []
    for (const sk of chosenSkills) {
      const isValidated = isComplete && Math.random() > 0.4
      const skill = skillsRepo.create({
        studentId:        sp.id,
        name:             sk.name,
        category:         sk.category,
        level:            randInt(2, 5),
        isValidated,
        validationStatus: isValidated ? ValidationStatus.VALIDADA : (Math.random() > 0.5 ? ValidationStatus.PENDIENTE : ValidationStatus.RECHAZADA),
        validatedBy:      isValidated ? school.id : undefined,
        validatedAt:      isValidated ? new Date() : undefined,
        endorsements:     isComplete ? randInt(0, 8) : 0,
      })
      skillEntities.push(await skillsRepo.save(skill))
    }

    // ── Evidences ────────────────────────────────────────────────────────────
    const evidenceTemplates = EVIDENCE_TEMPLATES[specialty] ?? []
    const evidenceCount = isComplete ? randInt(1, evidenceTemplates.length) : (Math.random() > 0.6 ? 1 : 0)
    const chosenEvidences = pickN(evidenceTemplates, evidenceCount)

    const evidenceEntities: PortfolioEvidence[] = []
    for (const ev of chosenEvidences) {
      const evidence = evidencesRepo.create({
        studentId:   sp.id,
        title:       ev.title,
        description: ev.description,
        type:        ev.type,
        tags:        ev.tags,
        isPublic:    true,
      })
      evidenceEntities.push(await evidencesRepo.save(evidence))
    }

    // ── Readiness score ──────────────────────────────────────────────────────
    sp.readinessScore = computeScore({
      skills:      skillEntities,
      evidences:   evidenceEntities,
      bio:         sp.bio,
      headline:    sp.headline,
      linkedinUrl: sp.linkedinUrl,
      githubUrl:   sp.githubUrl,
    })
    await studentsRepo.save(sp)

    studentProfiles.push(sp)
  }

  // ── 3. Companies ──────────────────────────────────────────────────────────
  console.log('🏢 Creating 10 companies...')
  const companyProfiles: CompanyProfile[] = []

  for (const co of COMPANIES) {
    const coUser = usersRepo.create({ email: co.email, password: hashedPassword, role: UserRole.EMPRESA })
    await usersRepo.save(coUser)

    const cp = companiesRepo.create({
      userId:      coUser.id,
      name:        co.name,
      description: co.description,
      industry:    co.industry,
      size:        co.size,
      location:    co.location,
      website:     co.website,
    })
    await companiesRepo.save(cp)
    companyProfiles.push(cp)
  }

  // ── 4. Opportunities ──────────────────────────────────────────────────────
  console.log('💼 Creating 25 opportunities...')
  const createdOpps: Opportunity[] = []

  for (const opp of OPPORTUNITIES) {
    const company = companyProfiles[opp.companyIdx]
    const created = oppsRepo.create({
      companyId:   company.id,
      title:       opp.title,
      description: opp.description,
      type:        opp.type,
      location:    opp.location,
      isRemote:    opp.isRemote,
      salary:      opp.salary,
      skills:      opp.skills,
      specialty:   opp.specialty,
      deadline:    opp.deadline ? new Date(opp.deadline) : undefined,
      isActive:    true,
      applicantsCount: 0,
    })
    createdOpps.push(await oppsRepo.save(created))
  }

  // ── 5. Applications ───────────────────────────────────────────────────────
  console.log('📝 Creating applications...')
  const statuses = [
    ApplicationStatus.PENDIENTE,
    ApplicationStatus.PENDIENTE,
    ApplicationStatus.EN_REVISION,
    ApplicationStatus.ENTREVISTA,
    ApplicationStatus.ACEPTADO,
    ApplicationStatus.RECHAZADO,
  ]

  const COVER_LETTERS = [
    'Estimado equipo, me dirijo a ustedes para postular a esta oportunidad. Soy estudiante de {specialty} en el Centro Educacional Cardenal José María Caro y estoy convencido de que mis habilidades y motivación pueden aportar valor a su empresa. He desarrollado proyectos en el área y cuento con habilidades validadas por mi institución. Quedo a disposición para una entrevista.',
    'Junto con saludar, quiero expresar mi interés en la oferta publicada. Durante mi formación técnica he adquirido competencias sólidas en {specialty} y tengo ganas de aplicarlas en un entorno profesional real. Soy responsable, proactivo y me adapto rápidamente a nuevos desafíos.',
    'Me interesa mucho esta oportunidad ya que se alinea perfectamente con mi especialidad y mis objetivos profesionales. Tengo experiencia práctica adquirida durante mi formación técnica y estoy buscando dar el siguiente paso en mi carrera.',
  ]

  const appliedPairs = new Set<string>()
  let appCount = 0

  for (let i = 0; i < studentProfiles.length; i++) {
    const student = studentProfiles[i]
    // More complete students apply to more opportunities
    const numApps = i < 20 ? randInt(2, 5) : i < 35 ? randInt(1, 3) : randInt(0, 1)
    const candidateOpps = createdOpps.filter(o =>
      !o.specialty || o.specialty === student.specialty || Math.random() > 0.7
    )
    const chosenOpps = pickN(candidateOpps, numApps)

    for (const opp of chosenOpps) {
      const key = `${student.id}:${opp.id}`
      if (appliedPairs.has(key)) continue
      appliedPairs.add(key)

      const status = pick(statuses)
      const coverLetter = pick(COVER_LETTERS).replace('{specialty}', student.specialty)

      await appsRepo.save(appsRepo.create({
        studentId:     student.id,
        opportunityId: opp.id,
        status,
        coverLetter,
      }))

      // Increment applicants count
      await oppsRepo.update(opp.id, { applicantsCount: () => '"applicantsCount" + 1' })
      appCount++
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!\n')
  console.log(`   👩‍🏫 1 colegio`)
  console.log(`   👨‍🎓 ${studentProfiles.length} estudiantes`)
  console.log(`   🏢 ${companyProfiles.length} empresas`)
  console.log(`   💼 ${createdOpps.length} ofertas`)
  console.log(`   📝 ${appCount} postulaciones`)
  console.log('\n─────────────────────────────────────────────────────')
  console.log('🔑 CREDENCIALES DE PRUEBA')
  console.log('─────────────────────────────────────────────────────')
  console.log('\nESTUDIANTE:')
  console.log('  email:    matias.arancibia@alumnos.colegiocaro.cl')
  console.log(`  password: ${SEED_PASSWORD}`)
  console.log('\nEMPRESA:')
  console.log('  email:    techsolutions@redtalento.cl')
  console.log(`  password: ${SEED_PASSWORD}`)
  console.log('\nCOLEGIO:')
  console.log('  email:    colegio@redtalento.cl')
  console.log(`  password: ${SEED_PASSWORD}`)
  console.log('─────────────────────────────────────────────────────\n')

  await AppDataSource.destroy()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
