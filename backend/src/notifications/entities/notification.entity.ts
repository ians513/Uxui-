import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export enum NotificationType {
  SKILL_VALIDATED    = 'SKILL_VALIDATED',
  SKILL_REJECTED     = 'SKILL_REJECTED',
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  NEW_MESSAGE        = 'NEW_MESSAGE',
  LIKE               = 'LIKE',
  COMMENT            = 'COMMENT',
  FOLLOW_REQUEST     = 'FOLLOW_REQUEST',
  FOLLOW_ACCEPTED    = 'FOLLOW_ACCEPTED',
  NEW_FOLLOWER       = 'NEW_FOLLOWER',
  GENERAL            = 'GENERAL',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User

  @Column()
  userId: string

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType

  @Column({ length: 200 })
  title: string

  @Column({ type: 'text' })
  body: string

  @Column({ default: false })
  isRead: boolean

  @Column({ nullable: true })
  link?: string

  @CreateDateColumn()
  createdAt: Date
}
