import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Follow, FollowStatus } from './entities/follow.entity'
import { User, UserRole } from '../users/entities/user.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationType } from '../notifications/entities/notification.entity'

export interface FollowUserDto {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  headline?: string
  specialty?: string
}

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followsRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile)
    private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)
    private readonly schoolsRepo: Repository<SchoolProfile>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Resolve display name + avatar for a user by their ID */
  private async resolveProfile(user: User): Promise<FollowUserDto> {
    if (user.role === UserRole.STUDENT) {
      const p = await this.studentsRepo.findOne({ where: { userId: user.id } })
      return {
        id: user.id, email: user.email, role: user.role,
        name: p ? `${p.firstName} ${p.lastName}` : user.email,
        avatar: p?.avatar, headline: p?.headline, specialty: p?.specialty,
      }
    } else if (user.role === UserRole.EMPRESA) {
      const p = await this.companiesRepo.findOne({ where: { userId: user.id } })
      return { id: user.id, email: user.email, role: user.role, name: p?.name ?? user.email, avatar: p?.logo }
    } else {
      const p = await this.schoolsRepo.findOne({ where: { userId: user.id } })
      return { id: user.id, email: user.email, role: user.role, name: p?.name ?? user.email, avatar: p?.logo }
    }
  }

  /** Follow or send follow request to a user */
  async follow(followerId: string, followeeId: string, followerName: string): Promise<Follow> {
    if (followerId === followeeId) throw new ConflictException('No puedes seguirte a ti mismo')

    const existing = await this.followsRepo.findOne({ where: { followerId, followeeId } })
    if (existing) throw new ConflictException('Ya sigues a este usuario')

    const follow = await this.followsRepo.save(
      this.followsRepo.create({ followerId, followeeId, status: FollowStatus.ACCEPTED }),
    )

    // Notify the followee
    this.notificationsService.create({
      userId: followeeId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'Nuevo seguidor',
      body: `${followerName} comenzó a seguirte.`,
    }).catch(() => {})

    return follow
  }

  /** Unfollow */
  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.followsRepo.delete({ followerId, followeeId })
  }

  /** Auto-follow for system use (no duplicate check throws, silently ignores) */
  async autoFollow(followerId: string, followeeId: string): Promise<void> {
    const existing = await this.followsRepo.findOne({ where: { followerId, followeeId } })
    if (existing) return
    await this.followsRepo.save(
      this.followsRepo.create({ followerId, followeeId, status: FollowStatus.ACCEPTED }),
    )
  }

  /** Get followers of a user with full profile info */
  async getFollowers(userId: string): Promise<FollowUserDto[]> {
    const follows = await this.followsRepo.find({
      where: { followeeId: userId, status: FollowStatus.ACCEPTED },
      relations: ['follower'],
    })
    const users = follows.map(f => f.follower).filter(Boolean) as User[]
    return Promise.all(users.map(u => this.resolveProfile(u)))
  }

  /** Get users that a user follows with full profile info */
  async getFollowing(userId: string): Promise<FollowUserDto[]> {
    const follows = await this.followsRepo.find({
      where: { followerId: userId, status: FollowStatus.ACCEPTED },
      relations: ['followee'],
    })
    const users = follows.map(f => f.followee).filter(Boolean) as User[]
    return Promise.all(users.map(u => this.resolveProfile(u)))
  }

  /** Count followers and following */
  async getCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      this.followsRepo.count({ where: { followeeId: userId, status: FollowStatus.ACCEPTED } }),
      this.followsRepo.count({ where: { followerId: userId, status: FollowStatus.ACCEPTED } }),
    ])
    return { followers, following }
  }

  /** Check if followerId follows followeeId */
  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const follow = await this.followsRepo.findOne({
      where: { followerId, followeeId, status: FollowStatus.ACCEPTED },
    })
    return !!follow
  }

  /** Get IDs of all users that followerId follows */
  async getFollowingIds(followerId: string): Promise<string[]> {
    const follows = await this.followsRepo.find({
      where: { followerId, status: FollowStatus.ACCEPTED },
      select: ['followeeId'],
    })
    return follows.map(f => f.followeeId)
  }
}
