import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm'

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  publicationId: string

  @Column()
  authorId: string

  @Column({ nullable: true })
  authorName?: string

  @Column({ type: 'text' })
  content: string

  @CreateDateColumn()
  createdAt: Date
}
