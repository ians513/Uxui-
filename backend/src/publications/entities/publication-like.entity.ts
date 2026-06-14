import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm'

@Entity('publication_likes')
export class PublicationLike {
  @PrimaryColumn()
  userId: string

  @PrimaryColumn()
  publicationId: string

  @CreateDateColumn()
  createdAt: Date
}
