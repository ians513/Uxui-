import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { User, UserRole } from './entities/user.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { FollowsService } from '../follows/follows.service'

export interface UserSearchResult {
  userId: string
  role: string
  name: string
  avatar?: string
  extra?: string  // specialty for students, location for companies/schools
}

export interface PublicProfile {
  userId: string
  role: string
  name: string
  avatar?: string
  coverImage?: string
  bio?: string
  headline?: string
  specialty?: string
  schoolName?: string
  location?: string
  website?: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile)
    private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)
    private readonly schoolsRepo: Repository<SchoolProfile>,
    private readonly followsService: FollowsService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } })
  }

  async findOrFail(id: string): Promise<User> {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return user
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false })
  }

  /** Global search across all user types */
  async search(q: string, limit = 20): Promise<UserSearchResult[]> {
    const results: UserSearchResult[] = []

    const [students, companies, schools] = await Promise.all([
      this.studentsRepo.find({
        where: [
          { firstName: ILike(`%${q}%`) },
          { lastName: ILike(`%${q}%`) },
          { specialty: ILike(`%${q}%`) },
        ],
        take: limit,
      }),
      this.companiesRepo.find({
        where: [{ name: ILike(`%${q}%`) }],
        take: limit,
      }),
      this.schoolsRepo.find({
        where: [{ name: ILike(`%${q}%`) }],
        take: limit,
      }),
    ])

    for (const s of students) {
      results.push({
        userId: s.userId,
        role: UserRole.STUDENT,
        name: `${s.firstName} ${s.lastName}`,
        avatar: s.avatar,
        extra: s.specialty,
      })
    }
    for (const c of companies) {
      results.push({
        userId: c.userId,
        role: UserRole.EMPRESA,
        name: c.name,
        avatar: c.logo,
        extra: c.location,
      })
    }
    for (const sc of schools) {
      results.push({
        userId: sc.userId,
        role: UserRole.COLEGIO,
        name: sc.name,
        avatar: sc.logo,
        extra: sc.location,
      })
    }

    return results.slice(0, limit)
  }

  /** Get a unified public profile for any user, with follow counts + isFollowing */
  async getPublicProfile(targetUserId: string, viewerId?: string): Promise<PublicProfile> {
    const user = await this.repo.findOne({ where: { id: targetUserId } })
    if (!user) throw new NotFoundException(`Usuario ${targetUserId} no encontrado`)

    const { followers, following } = await this.followsService.getCounts(targetUserId)
    const isFollowing = viewerId
      ? await this.followsService.isFollowing(viewerId, targetUserId)
      : false

    if (user.role === UserRole.STUDENT) {
      const p = await this.studentsRepo.findOne({ where: { userId: targetUserId } })
      let schoolName: string | undefined
      if (p?.schoolUserId) {
        const school = await this.schoolsRepo.findOne({ where: { userId: p.schoolUserId } })
        schoolName = school?.name
      }
      return {
        userId: targetUserId,
        role: UserRole.STUDENT,
        name: p ? `${p.firstName} ${p.lastName}` : 'Estudiante',
        avatar: p?.avatar,
        coverImage: p?.coverImage,
        bio: p?.bio,
        headline: p?.headline,
        specialty: p?.specialty,
        schoolName,
        location: p?.location,
        followerCount: followers,
        followingCount: following,
        isFollowing,
      }
    } else if (user.role === UserRole.EMPRESA) {
      const p = await this.companiesRepo.findOne({ where: { userId: targetUserId } })
      return {
        userId: targetUserId,
        role: UserRole.EMPRESA,
        name: p?.name ?? 'Empresa',
        avatar: p?.logo,
        coverImage: p?.coverImage,
        bio: p?.description,
        location: p?.location,
        website: p?.website,
        followerCount: followers,
        followingCount: following,
        isFollowing,
      }
    } else if (user.role === UserRole.COLEGIO) {
      const p = await this.schoolsRepo.findOne({ where: { userId: targetUserId } })
      return {
        userId: targetUserId,
        role: UserRole.COLEGIO,
        name: p?.name ?? 'Institución',
        avatar: p?.logo,
        coverImage: p?.coverImage,
        bio: p?.description,
        location: p?.location,
        website: p?.website,
        followerCount: followers,
        followingCount: following,
        isFollowing,
      }
    }

    throw new NotFoundException('Rol de usuario no reconocido')
  }
}
