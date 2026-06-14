import {
  Controller, Post, Delete, Get,
  Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { FollowsService } from './follows.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/public.decorator'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Follows')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(
    private readonly followsService: FollowsService,
    @InjectRepository(StudentProfile) private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile) private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)  private readonly schoolsRepo:  Repository<SchoolProfile>,
  ) {}

  private async resolveName(userId: string, role: string): Promise<string> {
    if (role === UserRole.STUDENT) {
      const p = await this.studentsRepo.findOne({ where: { userId } })
      if (p) return `${p.firstName} ${p.lastName}`
    } else if (role === UserRole.EMPRESA) {
      const p = await this.companiesRepo.findOne({ where: { userId } })
      if (p) return p.name
    } else if (role === UserRole.COLEGIO) {
      const p = await this.schoolsRepo.findOne({ where: { userId } })
      if (p) return p.name
    }
    return 'Usuario'
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Seguir a un usuario' })
  async follow(@CurrentUser() user: any, @Param('userId') followeeId: string) {
    const name = await this.resolveName(user.id, user.role)
    return this.followsService.follow(user.id, followeeId, name)
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dejar de seguir a un usuario' })
  unfollow(@CurrentUser() user: any, @Param('userId') followeeId: string) {
    return this.followsService.unfollow(user.id, followeeId)
  }

  @Get('counts/:userId')
  @ApiOperation({ summary: 'Contadores de seguidores/seguidos de un usuario' })
  getCounts(@Param('userId') userId: string) {
    return this.followsService.getCounts(userId)
  }

  @Get('is-following/:userId')
  @ApiOperation({ summary: 'Verificar si sigo a un usuario' })
  isFollowing(@CurrentUser() user: any, @Param('userId') followeeId: string) {
    return this.followsService.isFollowing(user.id, followeeId).then(r => ({ isFollowing: r }))
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Seguidores de un usuario' })
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId)
  }

  @Get('following-ids')
  @ApiOperation({ summary: 'IDs de usuarios que sigo (para estado inicial del frontend)' })
  getFollowingIds(@CurrentUser() user: any) {
    return this.followsService.getFollowingIds(user.id)
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Usuarios que sigue un usuario' })
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId)
  }
}
