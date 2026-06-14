import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Skill } from '../../skills/entities/skill.entity'
import { PortfolioEvidence } from './portfolio-evidence.entity'
import { Application } from '../../applications/entities/application.entity'

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @OneToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User

  @Column()
  userId: string

  @Column({ length: 100 })
  firstName: string

  @Column({ length: 100 })
  lastName: string

  @Column({ length: 255, nullable: true })
  headline?: string

  @Column({ type: 'text', nullable: true })
  bio?: string

  @Column({ length: 150 })
  specialty: string

  @Column({ type: 'int', default: 1 })
  year: number  // 1–4

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  gpa?: number

  @Column({ nullable: true })
  phone?: string

  @Column({ nullable: true })
  location?: string

  @Column({ nullable: true })
  avatar?: string

  @Column({ nullable: true })
  coverImage?: string

  @Column({ nullable: true })
  linkedinUrl?: string

  @Column({ nullable: true })
  githubUrl?: string

  @Column({ nullable: true })
  portfolioUrl?: string

  /** School user ID — when set, student auto-follows the school */
  @Column({ nullable: true })
  schoolUserId?: string

  /** Computed score stored for fast queries — recalculated on profile update */
  @Column({ type: 'int', default: 0 })
  readinessScore: number

  @Column({ type: 'int', default: 0 })
  profileViews: number

  // ── Relations ─────────────────────────────────────────────────────────────
  @OneToMany(() => Skill, (skill) => skill.student, { cascade: true, eager: true })
  skills: Skill[]

  @OneToMany(() => PortfolioEvidence, (ev) => ev.student, { cascade: true })
  evidences: PortfolioEvidence[]

  @OneToMany(() => Application, (app) => app.student)
  applications: Application[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
