import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from './entities/message.entity'
import { User, UserRole } from '../users/entities/user.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendMessageDto {
  @ApiProperty() @IsString() receiverId: string
  @ApiProperty() @IsString() content: string
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile)
    private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)
    private readonly schoolsRepo: Repository<SchoolProfile>,
  ) {}

  async send(senderId: string, dto: SendMessageDto): Promise<Message> {
    const message = this.messagesRepo.create({
      senderId,
      receiverId: dto.receiverId,
      content: dto.content,
    })
    return this.messagesRepo.save(message)
  }

  /** Resolve display name and avatar from a userId */
  async resolveParticipant(userId: string): Promise<{ name: string; avatar?: string; role: UserRole }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) return { name: 'Usuario', role: UserRole.STUDENT }

    if (user.role === UserRole.STUDENT) {
      const profile = await this.studentsRepo.findOne({ where: { userId } })
      return {
        name: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
        avatar: profile?.avatar ?? user.avatar,
        role: UserRole.STUDENT,
      }
    }

    if (user.role === UserRole.EMPRESA) {
      const profile = await this.companiesRepo.findOne({ where: { userId } })
      return {
        name: profile?.name ?? user.email,
        avatar: profile?.logo ?? user.avatar,
        role: UserRole.EMPRESA,
      }
    }

    if (user.role === UserRole.COLEGIO) {
      const profile = await this.schoolsRepo.findOne({ where: { userId } })
      return {
        name: profile?.name ?? user.email,
        avatar: profile?.logo ?? user.avatar,
        role: UserRole.COLEGIO,
      }
    }

    return { name: user.email, role: user.role }
  }

  /** Get all conversations for a user (grouped by the other participant) */
  async getConversations(userId: string) {
    const messages = await this.messagesRepo
      .createQueryBuilder('m')
      .where('m.senderId = :userId OR m.receiverId = :userId', { userId })
      .orderBy('m.createdAt', 'DESC')
      .getMany()

    // Group by conversation partner
    const convMap = new Map<string, { participantId: string; lastMessage: Message; unread: number }>()
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          participantId: partnerId,
          lastMessage: msg,
          unread: (!msg.isRead && msg.receiverId === userId) ? 1 : 0,
        })
      } else {
        const existing = convMap.get(partnerId)!
        if (!msg.isRead && msg.receiverId === userId) existing.unread++
      }
    }

    // Enrich with participant profile data
    const result = await Promise.all(
      Array.from(convMap.values()).map(async (conv) => {
        const participant = await this.resolveParticipant(conv.participantId)
        return {
          id:                 conv.participantId,
          participantId:      conv.participantId,
          participantName:    participant.name,
          participantAvatar:  participant.avatar,
          participantRole:    participant.role,
          lastMessage:        conv.lastMessage.content,
          lastMessageAt:      conv.lastMessage.createdAt,
          unreadCount:        conv.unread,
          messages:           [],
        }
      })
    )

    return result
  }

  /** Get messages between two users */
  async getThread(userId: string, partnerId: string) {
    const messages = await this.messagesRepo
      .createQueryBuilder('m')
      .where(
        '(m.senderId = :userId AND m.receiverId = :partnerId) OR (m.senderId = :partnerId AND m.receiverId = :userId)',
        { userId, partnerId },
      )
      .orderBy('m.createdAt', 'ASC')
      .getMany()

    // Mark as read
    const unread = messages.filter(m => !m.isRead && m.receiverId === userId)
    if (unread.length > 0) {
      await this.messagesRepo.update(
        unread.map(m => m.id),
        { isRead: true },
      )
    }

    return messages
  }
}
