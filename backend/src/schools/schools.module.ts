import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SchoolProfile } from './entities/school-profile.entity'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { User } from '../users/entities/user.entity'
import { Skill } from '../skills/entities/skill.entity'
import { Opportunity } from '../opportunities/entities/opportunity.entity'
import { Application } from '../applications/entities/application.entity'
import { SchoolsService } from './schools.service'
import { SchoolsController } from './schools.controller'

@Module({
  imports: [TypeOrmModule.forFeature([SchoolProfile, StudentProfile, User, Skill, Opportunity, Application])],
  providers: [SchoolsService],
  controllers: [SchoolsController],
  exports: [SchoolsService],
})
export class SchoolsModule {}
