import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { CompanyProfile } from '../../companies/entities/company-profile.entity'
import { Application } from '../../applications/entities/application.entity'

export enum OpportunityType {
  PASANTIA = 'PASANTIA',
  PRACTICA = 'PRACTICA',
  TRABAJO  = 'TRABAJO',
  PROYECTO = 'PROYECTO',
}

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => CompanyProfile, (c) => c.opportunities, { onDelete: 'CASCADE' })
  @JoinColumn()
  company: CompanyProfile

  @Column()
  companyId: string

  @Column({ length: 200 })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'enum', enum: OpportunityType })
  type: OpportunityType

  @Column({ length: 150 })
  location: string

  @Column({ default: false })
  isRemote: boolean

  @Column({ nullable: true })
  salary?: string

  /** Stored as JSON text array */
  @Column({ type: 'simple-array', nullable: true })
  requirements: string[]

  @Column({ type: 'simple-array', nullable: true })
  skills: string[]

  @Column({ nullable: true })
  specialty?: string

  @Column({ type: 'date', nullable: true })
  startDate?: Date

  @Column({ type: 'date', nullable: true })
  endDate?: Date

  @Column({ type: 'date', nullable: true })
  deadline?: Date

  @Column({ default: true })
  isActive: boolean

  @Column({ type: 'int', default: 0 })
  applicantsCount: number

  /** Array of userIds that have saved/bookmarked this opportunity */
  @Column({ type: 'simple-array', nullable: true, default: null })
  savedBy: string[]

  @OneToMany(() => Application, (a) => a.opportunity)
  applications: Application[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
