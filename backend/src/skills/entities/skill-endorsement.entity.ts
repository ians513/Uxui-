import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Skill } from './skill.entity'

@Entity('skill_endorsements')
@Unique(['skillId', 'userId'])  // ← evita duplicados a nivel BD
export class SkillEndorsement {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  skillId: string

  @Column()
  userId: string  // quien respalda

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  skill: Skill
}
