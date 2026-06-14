import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Application } from './entities/application.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { Opportunity } from '../opportunities/entities/opportunity.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { CreateApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationType } from '../notifications/entities/notification.entity'

const statusLabel: Record<string, string> = {
  PENDIENTE:   'Pendiente de revisión',
  EN_REVISION: 'En revisión',
  ENTREVISTA:  'Invitado a entrevista',
  ACEPTADO:    'Aceptado',
  RECHAZADO:   'No seleccionado',
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appsRepo: Repository<Application>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(Opportunity)
    private readonly oppsRepo: Repository<Opportunity>,
    @InjectRepository(CompanyProfile)
    private readonly companiesRepo: Repository<CompanyProfile>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Student applies to an opportunity
  async apply(userId: string, dto: CreateApplicationDto): Promise<Application> {
    const student = await this.studentsRepo.findOne({ where: { userId } })
    if (!student) throw new NotFoundException('Perfil de estudiante no encontrado')

    const opportunity = await this.oppsRepo.findOne({ where: { id: dto.opportunityId } })
    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada')
    if (!opportunity.isActive) throw new ForbiddenException('La oportunidad ya no está activa')

    const existing = await this.appsRepo.findOne({
      where: { studentId: student.id, opportunityId: dto.opportunityId },
    })
    if (existing) throw new ConflictException('Ya postulaste a esta oportunidad')

    const app = this.appsRepo.create({
      studentId: student.id,
      opportunityId: dto.opportunityId,
      coverLetter: dto.coverLetter,
    })
    const saved = await this.appsRepo.save(app)

    // Increment applicant count
    await this.oppsRepo.increment({ id: dto.opportunityId }, 'applicantsCount', 1)

    return saved
  }

  // Student views their own applications
  async findMyApplications(userId: string) {
    const student = await this.studentsRepo.findOne({ where: { userId } })
    if (!student) throw new NotFoundException()
    return this.appsRepo.find({
      where: { studentId: student.id, hiddenFromProfile: false },
      relations: ['opportunity', 'opportunity.company'],
      order: { createdAt: 'DESC' },
    })
  }

  // Company views applicants for their opportunities
  async findApplicantsForCompany(userId: string, opportunityId?: string) {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException('Empresa no encontrada')

    const qb = this.appsRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.student', 'student')
      .leftJoinAndSelect('student.skills', 'skills')
      .leftJoinAndSelect('app.opportunity', 'opp')
      .where('opp.companyId = :companyId', { companyId: company.id })
      .orderBy('app.createdAt', 'DESC')

    if (opportunityId) {
      qb.andWhere('app.opportunityId = :opportunityId', { opportunityId })
    }

    return qb.getMany()
  }

  // Company updates application status
  async updateStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<Application> {
    const company = await this.companiesRepo.findOne({ where: { userId } })
    if (!company) throw new NotFoundException()

    const app = await this.appsRepo.findOne({
      where: { id: applicationId },
      relations: ['opportunity'],
    })
    if (!app) throw new NotFoundException('Postulación no encontrada')
    if (app.opportunity.companyId !== company.id) throw new ForbiddenException()

    app.status = dto.status
    if (dto.notes) app.notes = dto.notes
    const saved = await this.appsRepo.save(app)

    // Notify the student
    const student = await this.studentsRepo.findOne({
      where: { id: app.studentId },
      relations: ['user'],
    })
    if (student?.user) {
      await this.notificationsService.create({
        userId: student.user.id,
        type: NotificationType.APPLICATION_STATUS,
        title: `Actualización de postulación`,
        body: `Tu postulación a "${app.opportunity.title}" cambió a: ${statusLabel[dto.status] ?? dto.status}.${dto.notes ? ` Nota: ${dto.notes}` : ''}`,
        link: '/student/postulaciones',
      })
    }

    return saved
  }

  // Student withdraws
  async withdraw(userId: string, applicationId: string): Promise<void> {
    const student = await this.studentsRepo.findOne({ where: { userId } })
    if (!student) throw new NotFoundException()

    const app = await this.appsRepo.findOne({ where: { id: applicationId } })
    if (!app) throw new NotFoundException()
    if (app.studentId !== student.id) throw new ForbiddenException()

    await this.appsRepo.remove(app)
    await this.oppsRepo.decrement({ id: app.opportunityId }, 'applicantsCount', 1)
  }

  // Student hides an accepted application from their profile
  async hideFromProfile(studentUserId: string, applicationId: string): Promise<void> {
    const app = await this.appsRepo.findOne({
      where: { id: applicationId },
      relations: ['student'],
    })
    if (!app) throw new NotFoundException('Postulación no encontrada')
    if (app.student.userId !== studentUserId) throw new ForbiddenException()
    await this.appsRepo.update(applicationId, { hiddenFromProfile: true })
  }
}
