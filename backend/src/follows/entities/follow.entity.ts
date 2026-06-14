import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Unique,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export enum FollowStatus {
  PENDING  = 'PENDING',
  ACCEPTED = 'ACCEPTED',
}

@Entity('follows')
@Unique(['followerId', 'followeeId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: User

  @Column()
  followerId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followeeId' })
  followee: User

  @Column()
  followeeId: string

  @Column({ type: 'enum', enum: FollowStatus, default: FollowStatus.ACCEPTED })
  status: FollowStatus

  @CreateDateColumn()
  createdAt: Date
}
