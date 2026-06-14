import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { StudentProfile } from './student-profile.entity'

export enum EvidenceType {
  PROYECTO     = 'PROYECTO',
  CERTIFICADO  = 'CERTIFICADO',
  FOTO         = 'FOTO',
  DESCRIPCION  = 'DESCRIPCION',
  VIDEO        = 'VIDEO',
}

@Entity('portfolio_evidences')
export class PortfolioEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => StudentProfile, (s) => s.evidences, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentProfile

  @Column()
  studentId: string

  @Column({ length: 200 })
  title: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: EvidenceType, default: EvidenceType.PROYECTO })
  type: EvidenceType

  @Column({ nullable: true })
  url?: string

  @Column({ nullable: true })
  imageUrl?: string

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  @Column({ default: true })
  isPublic: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
