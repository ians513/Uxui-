import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('school_profiles')
export class SchoolProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User

  @Column()
  userId: string

  @Column({ length: 200 })
  name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ nullable: true })
  location?: string

  @Column({ nullable: true })
  website?: string

  @Column({ nullable: true })
  logo?: string

  @Column({ nullable: true })
  coverImage?: string

  /** Comma-separated list of offered specialties */
  @Column({ type: 'simple-array', nullable: true })
  specialties: string[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
