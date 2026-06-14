import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne
} from 'typeorm'
import { Exclude } from 'class-transformer'
import type { StudentProfile } from '../../students/entities/student-profile.entity'
import type { CompanyProfile } from '../../companies/entities/company-profile.entity'
import type { SchoolProfile } from '../../schools/entities/school-profile.entity'

export enum UserRole {
  STUDENT = 'STUDENT',
  EMPRESA = 'EMPRESA',
  COLEGIO = 'COLEGIO',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ length: 255 })
  @Exclude()  // never serialise password in API responses
  password: string

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole

  @Column({ default: true })
  isActive: boolean

  @Column({ nullable: true })
  avatar?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // ── Relations ─────────────────────────────────────────────────────────────
  // OneToOne back-refs are typed via import() to avoid circular dependency issues
  // The actual @OneToOne decorators live on the profile entities.
}
