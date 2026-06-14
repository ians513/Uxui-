import { Controller, Post, Delete, Param, Body, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { SkillsService } from './skills.service'
import { CreateSkillDto, ValidateSkillDto } from './dto/skill.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/public.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Skills')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Agregar habilidad a mi perfil' })
  addSkill(@CurrentUser() user: any, @Body() dto: CreateSkillDto) {
    return this.skillsService.addSkill(user.id, dto)
  }

  @Delete(':skillId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Eliminar habilidad de mi perfil' })
  removeSkill(@CurrentUser() user: any, @Param('skillId') skillId: string) {
    return this.skillsService.removeSkill(user.id, skillId)
  }

  @Post('validate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COLEGIO)
  @ApiOperation({ summary: 'Validar habilidad de un estudiante (solo colegio)' })
  validateSkill(@CurrentUser() user: any, @Body() dto: ValidateSkillDto) {
    return this.skillsService.validateSkill(user.id, dto)
  }

  @Get('pending-validations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COLEGIO)
  @ApiOperation({ summary: 'Listar validaciones pendientes' })
  getPendingValidations(@CurrentUser() user: any) {
    return this.skillsService.getPendingValidations(user.id)
  }

  @Get('endorsed-by-me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener IDs de skills que el usuario ya endorsó' })
  getEndorsedByMe(@CurrentUser() user: any, @Query('skillIds') skillIds: string) {
    const ids = skillIds ? skillIds.split(',').filter(Boolean) : []
    return this.skillsService.getEndorsedSkillIds(user.id, ids)
  }

  @Post(':skillId/endorse')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Respaldar la habilidad de otro estudiante' })
  endorseSkill(@CurrentUser() user: any, @Param('skillId') skillId: string) {
    return this.skillsService.endorseSkill(user.id, skillId)
  }
}
