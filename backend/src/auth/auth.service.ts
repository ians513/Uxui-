import {
  Injectable, UnauthorizedException, ConflictException, BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from '../users/entities/user.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { LoginDto, RegisterDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)          private readonly usersRepo:    Repository<User>,
    @InjectRepository(StudentProfile) private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile) private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)  private readonly schoolsRepo:  Repository<SchoolProfile>,
    private readonly jwtService:  JwtService,
    private readonly config:      ConfigService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Ya existe una cuenta con ese correo')

    const hashedPassword = await bcrypt.hash(dto.password, 12)

    const user = this.usersRepo.create({
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    })
    await this.usersRepo.save(user)

    // Create role-specific profile
    await this.createProfile(user, dto)

    return this.generateTokens(user)
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Credenciales incorrectas')
    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada')

    const passwordValid = await bcrypt.compare(dto.password, user.password)
    if (!passwordValid) throw new UnauthorizedException('Credenciales incorrectas')

    return this.generateTokens(user)
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  async refreshTokens(userId: string, _refreshToken: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('Usuario no encontrado')
    // In production: verify refreshToken against hashed version stored in DB
    return this.generateTokens(user)
  }

  // ── Me (load full profile) ─────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()

    let profile: StudentProfile | CompanyProfile | SchoolProfile | null = null
    if (user.role === UserRole.STUDENT) {
      profile = await this.studentsRepo.findOne({
        where: { userId },
        relations: ['skills', 'evidences'],
      })
    } else if (user.role === UserRole.EMPRESA) {
      profile = await this.companiesRepo.findOne({ where: { userId } })
    } else if (user.role === UserRole.COLEGIO) {
      profile = await this.schoolsRepo.findOne({ where: { userId } })
    }

    const { password: _, ...safeUser } = user as any
    return { ...safeUser, profile }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private async createProfile(user: User, dto: RegisterDto) {
    if (user.role === UserRole.STUDENT) {
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException('Nombre y apellido requeridos para estudiantes')
      }
      const profile = this.studentsRepo.create({
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        specialty: dto.specialty ?? '',
        year: dto.year ?? 1,
        readinessScore: 0,
        schoolUserId: dto.schoolUserId ?? undefined,
      })
      await this.studentsRepo.save(profile)
    } else if (user.role === UserRole.EMPRESA) {
      if (!dto.companyName) throw new BadRequestException('Nombre de empresa requerido')
      await this.companiesRepo.save(
        this.companiesRepo.create({ userId: user.id, name: dto.companyName }),
      )
    } else if (user.role === UserRole.COLEGIO) {
      if (!dto.schoolName) throw new BadRequestException('Nombre del colegio requerido')
      await this.schoolsRepo.save(
        this.schoolsRepo.create({ userId: user.id, name: dto.schoolName }),
      )
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role }

    const accessToken = this.jwtService.sign(payload, {
      secret:    this.config.get('app.jwtSecret'),
      expiresIn: this.config.get('app.jwtExpiresIn'),
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret:    this.config.get('app.refreshSecret'),
      expiresIn: this.config.get('app.refreshExpires'),
    })

    return { accessToken, refreshToken, role: user.role, userId: user.id }
  }
}
