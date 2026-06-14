import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Opportunity } from './entities/opportunity.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { PortfolioEvidence } from '../students/entities/portfolio-evidence.entity'
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  OpportunityQueryDto,
} from './dto/opportunity.dto'
import { MatchService } from '../match/match.service'

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunitiesRepo: Repository<Opportunity>,
    @InjectRepository(CompanyProfile)
    private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(PortfolioEvidence)
    private readonly evidencesRepo: Repository<PortfolioEvidence>,
    private readonly matchService: MatchService,
  ) {}

  async create(userId: string, dto: CreateOpportunityDto): Promise<Opportunity> {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException('Perfil de empresa no encontrado')

    const opportunity = this.opportunitiesRepo.create({ ...dto, companyId: company.id })
    return this.opportunitiesRepo.save(opportunity)
  }

  async findAll(query: OpportunityQueryDto) {
    const { type, specialty, isRemote, location, page = 1, limit = 20 } = query
    const qb = this.opportunitiesRepo
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.company', 'comp')
      .where('opp.isActive = true')

    if (type)      qb.andWhere('opp.type = :type', { type })
    if (specialty) qb.andWhere('opp.specialty ILIKE :specialty', { specialty: `%${specialty}%` })
    if (isRemote !== undefined) qb.andWhere('opp.isRemote = :isRemote', { isRemote })
    if (location)  qb.andWhere('opp.location ILIKE :location', { location: `%${location}%` })

    qb.orderBy('opp.createdAt', 'DESC')

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /** Find opportunities with match score calculated for a specific student */
  async findWithMatchScore(userId: string, query: OpportunityQueryDto) {
    const result = await this.findAll(query)

    const student = await this.studentsRepo.findOne({
      where: { userId },
      relations: ['skills'],
    })
    if (!student) return result

    // Load student evidences for evidence bonus calculation
    const evidences = await this.evidencesRepo.find({
      where: { studentId: student.id },
    })

    const dataWithScore = result.data.map(opp => {
      const match = this.matchService.calculate(
        student.skills,
        opp.skills ?? [],
        evidences,
      )

      return {
        ...opp,
        matchScore:    match.score,
        matchDetails:  match.details,
        matchBreakdown: {
          technicalScore: match.technicalScore,
          softScore:      match.softScore,
          evidenceBonus:  match.evidenceBonus,
          matchedCount:   match.matchedCount,
          totalCount:     match.totalCount,
          explanation:    match.explanation,
          tips:           match.tips,
        },
      }
    })

    // Ordenar por matchScore descendente
    dataWithScore.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))

    return { ...result, data: dataWithScore }
  }

  async findById(id: string): Promise<Opportunity> {
    const opp = await this.opportunitiesRepo.findOne({
      where: { id },
      relations: ['company'],
    })
    if (!opp) throw new NotFoundException('Oportunidad no encontrada')
    return opp
  }

  async findByCompany(userId: string) {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException('Empresa no encontrada')
    return this.opportunitiesRepo.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
    })
  }

  async update(userId: string, id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException()

    const opp = await this.findById(id)
    if (opp.companyId !== company.id) throw new ForbiddenException()

    Object.assign(opp, dto)
    return this.opportunitiesRepo.save(opp)
  }

  async remove(userId: string, id: string): Promise<void> {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException()

    const opp = await this.findById(id)
    if (opp.companyId !== company.id) throw new ForbiddenException()

    await this.opportunitiesRepo.remove(opp)
  }

  async toggleSave(userId: string, id: string): Promise<{ saved: boolean }> {
    const opp = await this.opportunitiesRepo.findOne({ where: { id } })
    if (!opp) throw new NotFoundException('Oportunidad no encontrada')

    const savedBy: string[] = opp.savedBy ?? []
    const idx = savedBy.indexOf(userId)
    if (idx >= 0) {
      savedBy.splice(idx, 1)
    } else {
      savedBy.push(userId)
    }
    opp.savedBy = savedBy
    await this.opportunitiesRepo.save(opp)
    return { saved: idx < 0 }
  }

  async getSaved(userId: string) {
    const all = await this.opportunitiesRepo
      .createQueryBuilder('opp')
      .leftJoinAndSelect('opp.company', 'comp')
      .where('opp.isActive = true')
      .getMany()
    const saved = all.filter(o => (o.savedBy ?? []).includes(userId))
    return { data: saved, total: saved.length }
  }
}
