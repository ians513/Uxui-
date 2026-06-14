// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'EMPRESA' | 'COLEGIO'

export type ApplicationStatus =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'ENTREVISTA'
  | 'ACEPTADO'
  | 'RECHAZADO'

export type OpportunityType = 'PASANTIA' | 'PRACTICA' | 'TRABAJO' | 'PROYECTO'

export type SkillCategory = 'TECNICA' | 'BLANDA' | 'CERTIFICACION'

export type ValidationStatus = 'PENDIENTE' | 'VALIDADA' | 'RECHAZADA'

export type EvidenceType = 'PROYECTO' | 'CERTIFICADO' | 'FOTO' | 'DESCRIPCION' | 'VIDEO'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
  avatar?: string
  isActive: boolean
}

export interface StudentProfile {
  id: string
  userId: string
  user: User
  firstName: string
  lastName: string
  headline: string
  bio: string
  specialty: string  // e.g. "Ingeniería Civil Informática"
  year: number       // Year in school (1-4)
  gpa?: number
  phone?: string
  location?: string
  avatar?: string
  coverImage?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  readinessScore: number  // 0-100
  schoolUserId?: string
  schoolName?: string    // resolved from schoolUserId
  skills: Skill[]
  evidences: PortfolioEvidence[]
  validations: Validation[]
  applications: Application[]
  profileViews: number
  createdAt: string
  updatedAt: string
}

export interface CompanyProfile {
  id: string
  userId: string
  user: User
  name: string
  description: string
  industry: string
  size: string
  location: string
  website: string
  logo?: string
  coverImage?: string
  opportunities: Opportunity[]
  createdAt: string
  updatedAt: string
}

export interface SchoolProfile {
  id: string
  userId: string
  user: User
  name: string
  description: string
  location: string
  website: string
  logo?: string
  coverImage?: string
  specialties: string[]
  students: StudentProfile[]
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  level?: number  // 1-5
  isValidated: boolean
  validationStatus: ValidationStatus
  validatedBy?: string
  validatedAt?: string
  endorsements: number
  createdAt: string
}

export interface Validation {
  id: string
  studentId: string
  skillId: string
  skill: Skill
  validatedBy: string  // SchoolProfile ID
  school: SchoolProfile
  status: ValidationStatus
  notes?: string
  createdAt: string
}

export interface PortfolioEvidence {
  id: string
  studentId: string
  title: string
  description: string
  type: EvidenceType
  url?: string
  imageUrl?: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: string
  companyId: string
  company: CompanyProfile
  title: string
  description: string
  type: OpportunityType
  location: string
  isRemote: boolean
  salary?: string
  requirements: string[]
  skills: string[]
  specialty?: string
  startDate?: string
  endDate?: string
  deadline?: string
  isActive: boolean
  applicantsCount: number
  createdAt: string
  updatedAt: string
  // Computed for student (populated by /opportunities/for-me)
  matchScore?: number
  matchDetails?: MatchDetail[]
  matchBreakdown?: MatchBreakdown
}

export interface MatchDetail {
  requirement: string
  canonical: string
  isMet: boolean
  matchedVia?: 'exact' | 'synonym' | 'evidence'
  category: 'TECNICA' | 'BLANDA' | 'DESCONOCIDA'
  notes?: string
}

export interface MatchBreakdown {
  technicalScore: number    // 0-100
  softScore: number         // 0-100
  evidenceBonus: number     // 0-5
  matchedCount: number
  totalCount: number
  explanation: string       // Mensaje amigable
  tips: string[]            // Sugerencias de mejora
}

export interface Application {
  id: string
  studentId: string
  student?: StudentProfile
  opportunityId: string
  opportunity: Opportunity
  status: ApplicationStatus
  coverLetter?: string
  notes?: string
  hiddenFromProfile?: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string
  participantRole: UserRole
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  messages: Message[]
}

export interface Publication {
  id: string
  authorId: string
  authorType: UserRole
  authorName: string
  authorAvatar?: string
  authorSchool?: string
  title?: string
  content: string
  imageUrl?: string
  isStory: boolean
  storyDuration?: number  // seconds
  likes: number
  comments: number
  views: number
  isLiked?: boolean
  isPinned?: boolean
  tags: string[] | null
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  publicationId: string
  authorId: string
  authorName?: string
  content: string
  createdAt: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser extends User {
  profile?: StudentProfile | CompanyProfile | SchoolProfile
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  role: UserRole
  firstName?: string
  lastName?: string
  companyName?: string
  schoolName?: string
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Store Types ──────────────────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginDto) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<void>
  setUser: (user: AuthUser) => void
}

// ─── UI / Component Props ─────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: string
  iconFilled?: string
  badge?: number
}

export interface ReadinessScoreBreakdown {
  personalInfo: number         // 0-30  información personal completa
  visualPresentation: number   // 0-15  foto de perfil y portada
  skills: number               // 0-20  habilidades declaradas
  validations: number          // 0-20  habilidades validadas por el colegio
  evidences: number            // 0-15  proyectos, certificados, evidencias
  total: number                // 0-100
  explanation?: string         // Mensaje amigable según el puntaje
  tips?: string[]              // Recomendaciones de mejora
}
