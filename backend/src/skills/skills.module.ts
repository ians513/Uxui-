import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Skill } from './entities/skill.entity'
import { SkillEndorsement } from './entities/skill-endorsement.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { PortfolioEvidence } from '../students/entities/portfolio-evidence.entity'
import { SkillsService } from './skills.service'
import { SkillsController } from './skills.controller'
import { ScoreModule } from '../score/score.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, SkillEndorsement, StudentProfile, PortfolioEvidence]),
    ScoreModule,
    NotificationsModule,
  ],
  providers: [SkillsService],
  controllers: [SkillsController],
  exports: [SkillsService],
})
export class SkillsModule {}
