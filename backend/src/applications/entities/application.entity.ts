import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { StudentProfile } from '../../students/entities/student-profile.entity'
import { Opportunity } from '../../opportunities/entities/opportunity.entity'

export enum ApplicationStatus {
  PENDIENTE   = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  ENTREVISTA  = 'ENTREVISTA',
  ACEPTADO    = 'ACEPTADO',
  RECHAZADO   = 'RECHAZADO',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => StudentProfile, (s) => s.applications, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentProfile

  @Column()
  studentId: string

  @ManyToOne(() => Opportunity, (o) => o.applications, { onDelete: 'CASCADE' })
  @JoinColumn()
  opportunity: Opportunity

  @Column()
  opportunityId: string

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDIENTE })
  status: ApplicationStatus

  @Column({ type: 'text', nullable: true })
  coverLetter?: string

  @Column({ type: 'text', nullable: true })
  notes?: string  // internal company notes

  @Column({ default: false })
  hiddenFromProfile: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
