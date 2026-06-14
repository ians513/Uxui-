import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { StudentProfile } from '../../students/entities/student-profile.entity'

export enum SkillCategory {
  TECNICA      = 'TECNICA',
  BLANDA       = 'BLANDA',
  CERTIFICACION = 'CERTIFICACION',
}

export enum ValidationStatus {
  PENDIENTE = 'PENDIENTE',
  VALIDADA  = 'VALIDADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => StudentProfile, (s) => s.skills, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentProfile

  @Column()
  studentId: string

  @Column({ length: 100 })
  name: string

  @Column({ type: 'enum', enum: SkillCategory })
  category: SkillCategory

  @Column({ type: 'int', nullable: true })
  level?: number  // 1–5

  @Column({ default: false })
  isValidated: boolean

  @Column({ type: 'enum', enum: ValidationStatus, default: ValidationStatus.PENDIENTE })
  validationStatus: ValidationStatus

  /** UUID of SchoolProfile that validated this skill */
  @Column({ nullable: true })
  validatedBy?: string

  @Column({ type: 'timestamp', nullable: true })
  validatedAt?: Date

  @Column({ nullable: true })
  validationNotes?: string

  @Column({ type: 'int', default: 0 })
  endorsements: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
