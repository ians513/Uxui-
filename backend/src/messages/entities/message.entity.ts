import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  sender: User

  @Column()
  senderId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  receiver: User

  @Column()
  receiverId: string

  @Column({ type: 'text' })
  content: string

  @Column({ default: false })
  isRead: boolean

  @CreateDateColumn()
  createdAt: Date
}
