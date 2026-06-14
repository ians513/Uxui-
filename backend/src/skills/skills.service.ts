import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Skill, ValidationStatus } from './entities/skill.entity'
import { SkillEndorsement } from './entities/skill-endorsement.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CreateSkillDto, ValidateSkillDto } from './dto/skill.dto'
import { ScoreService } from '../score/score.service'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationType } from '../notifications/entities/notification.entity'

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillsRepo: Repository<Skill>,
    @InjectRepository(SkillEndorsement)
    private readonly endorsementsRepo: Repository<SkillEndorsement>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    private readonly scoreService: ScoreService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addSkill(userId: string, dto: CreateSkillDto): Promise<Skill> {
    const profile = await this.studentsRepo.findOne({ where: { userId } })
    if (!profile) throw new NotFoundException('Perfil de estudiante no encontrado')

    const skill = this.skillsRepo.create({ ...dto, studentId: profile.id })
    const saved = await this.skillsRepo.save(skill)
    await this.recalculateScore(profile.id)
    return saved
  }

  async removeSkill(userId: string, skillId: string): Promise<void> {
    const profile = await this.studentsRepo.findOne({ where: { userId } })
    if (!profile) throw new NotFoundException('Perfil no encontrado')

    const skill = await this.skillsRepo.findOne({ where: { id: skillId } })
    if (!skill) throw new NotFoundException('Habilidad no encontrada')
    if (skill.studentId !== profile.id) throw new ForbiddenException()

    await this.skillsRepo.remove(skill)
    await this.recalculateScore(profile.id)
  }

  /** Called by school to validate/reject a student skill */
  async validateSkill(schoolUserId: string, dto: ValidateSkillDto): Promise<Skill> {
    const skill = await this.skillsRepo.findOne({ where: { id: dto.skillId } })
    if (!skill) throw new NotFoundException('Habilidad no encontrada')
    if (skill.studentId !== dto.studentId) throw new ForbiddenException()

    const isValidated = dto.status === 'VALIDADA'
    const skillName   = skill.name
    const studentId   = skill.studentId

    // Notify before potentially deleting
    const studentProfile = await this.studentsRepo.findOne({
      where: { id: studentId },
      relations: ['user'],
    })
    if (studentProfile?.user) {
      await this.notificationsService.create({
        userId: studentProfile.user.id,
        type: isValidated ? NotificationType.SKILL_VALIDATED : NotificationType.SKILL_REJECTED,
        title: isValidated ? 'Habilidad validada ✓' : 'Habilidad no aprobada',
        body: isValidated
          ? `Tu habilidad "${skillName}" fue validada por el colegio.${dto.notes ? ` Nota: ${dto.notes}` : ''}`
          : `Tu habilidad "${skillName}" fue rechazada y eliminada de tu perfil.${dto.notes ? ` Motivo: ${dto.notes}` : ''}`,
        link: '/student/habilidades',
      })
    }

    if (!isValidated) {
      // Rejected → delete from profile
      await this.skillsRepo.remove(skill)
      await this.recalculateScore(studentId)
      return { ...skill, validationStatus: ValidationStatus.RECHAZADA } as Skill
    }

    skill.validationStatus = ValidationStatus.VALIDADA
    skill.isValidated      = true
    skill.validatedBy      = schoolUserId
    skill.validatedAt      = new Date()
    skill.validationNotes  = dto.notes

    const saved = await this.skillsRepo.save(skill)
    await this.recalculateScore(studentId)
    return saved
  }

  /** List all pending validations for students of a school */
  async getPendingValidations(schoolUserId: string) {
    // Solo mostrar validaciones de estudiantes vinculados a este colegio
    const students = await this.studentsRepo.find({
      where: { schoolUserId },
      select: ['id'],
    })
    const studentIds = students.map(s => s.id)
    if (!studentIds.length) return []

    return this.skillsRepo.find({
      where: {
        validationStatus: ValidationStatus.PENDIENTE,
        studentId: In(studentIds),
      },
      relations: ['student', 'student.user'],
      order: { createdAt: 'DESC' },
    })
  }

  async endorseSkill(viewerUserId: string, skillId: string): Promise<{ endorsements: number; alreadyEndorsed: boolean }> {
    const skill = await this.skillsRepo.findOne({ where: { id: skillId } })
    if (!skill) throw new NotFoundException('Habilidad no encontrada')

    // Evitar auto-endorse
    const ownerProfile = await this.studentsRepo.findOne({ where: { id: skill.studentId } })
    if (ownerProfile?.userId === viewerUserId) {
      throw new ForbiddenException('No puedes respaldarte a ti mismo')
    }

    // Verificar si ya endorsó
    const existing = await this.endorsementsRepo.findOne({
      where: { skillId, userId: viewerUserId },
    })
    if (existing) {
      const count = await this.endorsementsRepo.count({ where: { skillId } })
      return { endorsements: count, alreadyEndorsed: true }
    }

    // Crear el endorsement
    await this.endorsementsRepo.save(this.endorsementsRepo.create({ skillId, userId: viewerUserId }))

    // Actualizar el contador denormalizado en Skill para queries rápidas
    const count = await this.endorsementsRepo.count({ where: { skillId } })
    await this.skillsRepo.update(skillId, { endorsements: count })

    return { endorsements: count, alreadyEndorsed: false }
  }

  async getEndorsedSkillIds(viewerUserId: string, skillIds: string[]): Promise<string[]> {
    if (!skillIds.length) return []
    const records = await this.endorsementsRepo.find({
      where: skillIds.map(id => ({ skillId: id, userId: viewerUserId })),
      select: ['skillId'],
    })
    return records.map(r => r.skillId)
  }

  private async recalculateScore(studentProfileId: string): Promise<void> {
    const profile = await this.studentsRepo.findOne({
      where: { id: studentProfileId },
      relations: ['skills', 'evidences'],
    })
    if (!profile) return
    profile.readinessScore = this.scoreService.calculate(profile).score
    await this.studentsRepo.save(profile)
  }
}
