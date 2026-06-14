import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { SchoolProfile } from './entities/school-profile.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { User, UserRole } from '../users/entities/user.entity'
import { Skill, ValidationStatus } from '../skills/entities/skill.entity'
import { Opportunity } from '../opportunities/entities/opportunity.entity'
import { Application } from '../applications/entities/application.entity'
import { IsString, IsOptional, IsArray, IsInt, Min, Max, IsEmail } from 'class-validator'
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'

export class UpdateSchoolDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) specialties?: string[]
}

export class CreateStudentDto {
  @ApiProperty()  @IsEmail()   email: string
  @ApiProperty()  @IsString()  firstName: string
  @ApiProperty()  @IsString()  lastName: string
  @ApiPropertyOptional() @IsOptional() @IsString()  specialty?: string
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(7) year?: number
}

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(SchoolProfile)
    private readonly schoolsRepo: Repository<SchoolProfile>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepo: Repository<Skill>,
    @InjectRepository(Opportunity)
    private readonly oppsRepo: Repository<Opportunity>,
    @InjectRepository(Application)
    private readonly appsRepo: Repository<Application>,
  ) {}

  async findAll(): Promise<{ id: string; userId: string; name: string }[]> {
    return this.schoolsRepo.find({
      select: ['id', 'userId', 'name'],
      order: { name: 'ASC' },
    }) as Promise<{ id: string; userId: string; name: string }[]>
  }

  async findByUserId(userId: string): Promise<SchoolProfile> {
    const profile = await this.schoolsRepo.findOne({ where: { userId } })
    if (!profile) throw new NotFoundException('Perfil del colegio no encontrado')
    return profile
  }

  async findById(id: string): Promise<SchoolProfile> {
    const profile = await this.schoolsRepo.findOne({ where: { id } })
    if (!profile) throw new NotFoundException('Colegio no encontrado')
    return profile
  }

  async getStudents(schoolUserId: string): Promise<StudentProfile[]> {
    return this.studentsRepo.find({
      where: { schoolUserId },
      relations: ['user', 'evidences'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    })
  }

  async update(userId: string, dto: UpdateSchoolDto): Promise<SchoolProfile> {
    const profile = await this.findByUserId(userId)
    Object.assign(profile, dto)
    return this.schoolsRepo.save(profile)
  }

  /** Create a student account linked to this school */
  async createStudent(schoolUserId: string, dto: CreateStudentDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Ya existe una cuenta con ese correo')

    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const user = this.usersRepo.create({
      email: dto.email,
      password: hashedPassword,
      role: UserRole.STUDENT,
    })
    await this.usersRepo.save(user)

    const student = this.studentsRepo.create({
      userId: user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      specialty: dto.specialty ?? '',
      year: dto.year ?? 1,
      schoolUserId,
      readinessScore: 0,
    })
    await this.studentsRepo.save(student)

    return {
      userId: user.id,
      email: user.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      tempPassword,  // School must share this with the student
    }
  }

  async getStats(schoolUserId: string) {
    // Resolve students belonging to this school
    const schoolStudents = await this.studentsRepo.find({
      where: { schoolUserId },
      select: ['id'],
    })
    const studentIds = schoolStudents.map(s => s.id)

    const pendingValidations = studentIds.length > 0
      ? await this.skillsRepo.count({
          where: {
            validationStatus: ValidationStatus.PENDIENTE,
            studentId: In(studentIds),
          },
        })
      : 0

    const [totalStudents, totalOpportunities, totalApplications] = await Promise.all([
      this.studentsRepo.count({ where: { schoolUserId } }),
      this.oppsRepo.count({ where: { isActive: true } }),
      this.appsRepo.count(),
    ])

    const studentsWithScore = await this.studentsRepo
      .createQueryBuilder('sp')
      .select('AVG(sp.readinessScore)', 'avg')
      .where('sp.schoolUserId = :schoolUserId', { schoolUserId })
      .getRawOne()

    const avgScore = Math.round(parseFloat(studentsWithScore?.avg ?? '0'))

    const studentsWithValidations = await this.studentsRepo
      .createQueryBuilder('sp')
      .innerJoin('sp.skills', 'sk', 'sk.isValidated = true')
      .where('sp.schoolUserId = :schoolUserId', { schoolUserId })
      .getCount()

    const studentsWithApplications = await this.studentsRepo
      .createQueryBuilder('sp')
      .innerJoin('sp.applications', 'app')
      .where('sp.schoolUserId = :schoolUserId', { schoolUserId })
      .getCount()

    return {
      totalStudents,
      pendingValidations,
      totalOpportunities,
      totalApplications,
      avgScore,
      studentsWithValidations,
      studentsWithApplications,
    }
  }
}
