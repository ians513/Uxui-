import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, OneToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Opportunity } from '../../opportunities/entities/opportunity.entity'

@Entity('company_profiles')
export class CompanyProfile {
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

  @Column({ length: 100, nullable: true })
  industry?: string

  @Column({ length: 100, nullable: true })
  size?: string  // e.g. "50-200 empleados"

  @Column({ nullable: true })
  location?: string

  @Column({ nullable: true })
  website?: string

  @Column({ nullable: true })
  logo?: string

  @Column({ nullable: true })
  coverImage?: string

  @OneToMany(() => Opportunity, (o) => o.company, { cascade: true })
  opportunities: Opportunity[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
