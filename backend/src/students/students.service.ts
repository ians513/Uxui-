import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { StudentProfile } from './entities/student-profile.entity'
import { PortfolioEvidence } from './entities/portfolio-evidence.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { UpdateStudentDto } from './dto/update-student.dto'
import { CreateEvidenceDto } from './dto/create-evidence.dto'
import { ScoreService } from '../score/score.service'
import { FollowsService } from '../follows/follows.service'

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profilesRepo: Repository<StudentProfile>,
    @InjectRepository(PortfolioEvidence)
    private readonly evidencesRepo: Repository<PortfolioEvidence>,
    @InjectRepository(SchoolProfile)
    private readonly schoolsRepo: Repository<SchoolProfile>,
    private readonly scoreService: ScoreService,
    private readonly followsService: FollowsService,
  ) {}

  /** Resolve school name from schoolUserId and attach it to the profile object */
  private async attachSchoolName(profile: StudentProfile): Promise<StudentProfile & { schoolName?: string }> {
    if (!profile.schoolUserId) return profile
    const school = await this.schoolsRepo.findOne({ where: { userId: profile.schoolUserId } })
    return Object.assign(profile, { schoolName: school?.name ?? undefined })
  }

  private async attachSchoolNames(profiles: StudentProfile[]): Promise<(StudentProfile & { schoolName?: string })[]> {
    const userIds = [...new Set(profiles.map(p => p.schoolUserId).filter(Boolean))]
    if (!userIds.length) return profiles
    const schools = await this.schoolsRepo
      .createQueryBuilder('s')
      .where('s.userId IN (:...userIds)', { userIds })
      .getMany()
    const map = new Map(schools.map(s => [s.userId, s.name]))
    return profiles.map(p => Object.assign(p, { schoolName: p.schoolUserId ? map.get(p.schoolUserId) ?? undefined : undefined }))
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  async findByUserId(userId: string): Promise<StudentProfile & { schoolName?: string }> {
    const profile = await this.profilesRepo.findOne({
      where: { userId },
      relations: [
        'skills',
        'evidences',
        'applications',
        'applications.opportunity',
        'applications.opportunity.company',
      ],
    })
    if (!profile) throw new NotFoundException('Perfil de estudiante no encontrado')
    // Exclude applications hidden from profile
    if (profile.applications) {
      profile.applications = profile.applications.filter(a => !a.hiddenFromProfile)
    }
    return this.attachSchoolName(profile)
  }

  async findById(id: string): Promise<StudentProfile & { schoolName?: string }> {
    const profile = await this.profilesRepo.findOne({
      where: { id },
      relations: ['skills', 'evidences'],
    })
    if (!profile) throw new NotFoundException('Perfil no encontrado')
    return this.attachSchoolName(profile)
  }

  async update(userId: string, dto: UpdateStudentDto): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId)
    const prevSchoolUserId = profile.schoolUserId
    Object.assign(profile, dto)
    profile.readinessScore = this.scoreService.calculate(profile).score
    const saved = await this.profilesRepo.save(profile)

    // Auto-follow school when schoolUserId is set for the first time
    if (dto.schoolUserId && dto.schoolUserId !== prevSchoolUserId) {
      this.followsService.autoFollow(userId, dto.schoolUserId).catch(() => {})
    }

    return saved
  }

  /** Devuelve el score completo con desglose y recomendaciones */
  async getScore(userId: string) {
    const profile = await this.findByUserId(userId)
    return this.scoreService.calculate(profile)
  }

  async incrementProfileViews(id: string): Promise<void> {
    await this.profilesRepo.increment({ id }, 'profileViews', 1)
  }

  /** Public listing ordered by readiness score — no auth required */
  async getPublicList(limit = 50) {
    const data = await this.profilesRepo
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.skills', 'sk')
      .orderBy('sp.readinessScore', 'DESC')
      .take(limit)
      .getMany()
    const withSchool = await this.attachSchoolNames(data)
    return { data: withSchool, total: withSchool.length }
  }

  // ── Search (for companies) ─────────────────────────────────────────────────
  async search(filters: {
    specialty?: string
    skills?: string[]
    minScore?: number
    year?: number
    page?: number
    limit?: number
  }) {
    const { specialty, skills, minScore = 0, year, page = 1, limit = 20 } = filters
    const qb = this.profilesRepo
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.user', 'user')
      .leftJoinAndSelect('sp.skills', 'sk')
      .where('sp.readinessScore >= :minScore', { minScore })

    if (specialty) qb.andWhere('sp.specialty ILIKE :specialty', { specialty: `%${specialty}%` })
    if (year)      qb.andWhere('sp.year = :year', { year })

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    // Filter by skills in memory (simple-array column can't be queried easily)
    const filtered = skills?.length
      ? data.filter(s => skills.every(sk => s.skills.some(skill => skill.name === sk)))
      : data

    const withSchool = await this.attachSchoolNames(filtered)
    return { data: withSchool, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ── Evidences ──────────────────────────────────────────────────────────────
  async addEvidence(userId: string, dto: CreateEvidenceDto): Promise<PortfolioEvidence> {
    const profile = await this.findByUserId(userId)
    const evidence = this.evidencesRepo.create({ ...dto, studentId: profile.id })
    return this.evidencesRepo.save(evidence)
  }

  async removeEvidence(userId: string, evidenceId: string): Promise<void> {
    const profile = await this.findByUserId(userId)
    const evidence = await this.evidencesRepo.findOne({ where: { id: evidenceId } })
    if (!evidence) throw new NotFoundException('Evidencia no encontrada')
    if (evidence.studentId !== profile.id) throw new ForbiddenException()
    await this.evidencesRepo.remove(evidence)
  }

}
