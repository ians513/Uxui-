import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StudentProfile } from './entities/student-profile.entity'
import { PortfolioEvidence } from './entities/portfolio-evidence.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { StudentsService } from './students.service'
import { StudentsController } from './students.controller'
import { ScoreModule } from '../score/score.module'
import { FollowsModule } from '../follows/follows.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, PortfolioEvidence, SchoolProfile]),
    ScoreModule,
    FollowsModule,
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}
