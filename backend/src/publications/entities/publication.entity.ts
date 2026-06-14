import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User

  @Column()
  authorId: string

  @Column({ nullable: true })
  authorType?: string

  @Column({ nullable: true })
  authorName?: string

  @Column({ type: 'text' })
  content: string

  @Column({ nullable: true })
  imageUrl?: string

  @Column({ default: false })
  isStory: boolean

  @Column({ type: 'int', nullable: true })
  storyDuration?: number  // seconds

  @Column({ type: 'int', default: 0 })
  likes: number

  @Column({ type: 'int', default: 0 })
  comments: number

  @Column({ type: 'int', default: 0 })
  views: number

  @Column({ type: 'simple-array', nullable: true, default: null })
  tags: string[] | null

  /** Story or publication pinned/highlighted on the author's profile */
  @Column({ default: false })
  isPinned: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
