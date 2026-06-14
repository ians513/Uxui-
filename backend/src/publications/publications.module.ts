import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Publication } from './entities/publication.entity'
import { PublicationLike } from './entities/publication-like.entity'
import { Comment } from './entities/comment.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { PublicationsService } from './publications.service'
import { PublicationsController } from './publications.controller'
import { NotificationsModule } from '../notifications/notifications.module'
import { FollowsModule } from '../follows/follows.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Publication,
      PublicationLike,
      Comment,
      StudentProfile,
      CompanyProfile,
      SchoolProfile,
    ]),
    NotificationsModule,
    FollowsModule,
  ],
  providers: [PublicationsService],
  controllers: [PublicationsController],
  exports: [PublicationsService],
})
export class PublicationsModule {}
