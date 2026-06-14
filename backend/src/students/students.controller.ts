import {
  Controller, Get, Patch, Post, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { StudentsService } from './students.service'
import { UpdateStudentDto, CreateEvidenceDto, StudentSearchDto } from './dto/update-student.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser, Public } from '../auth/decorators/public.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('Students')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ── Public directory (no auth needed — used by /public/observar) ────────────
  @Get('public-list')
  @Public()
  @ApiOperation({ summary: 'Listado público ordenado por score (sin autenticación)' })
  getPublicList(@Query('limit') limit = 50) {
    return this.studentsService.getPublicList(Number(limit))
  }

  // ── Public search (companies can use this) ────────────────────────────────
  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPRESA, UserRole.COLEGIO)
  @ApiOperation({ summary: 'Buscar estudiantes por filtros' })
  search(@Query() query: StudentSearchDto) {
    return this.studentsService.search(query)
  }

  // ── Own profile ───────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Obtener mi perfil de estudiante' })
  getMyProfile(@CurrentUser() user: any) {
    return this.studentsService.findByUserId(user.id)
  }

  @Get('me/score')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Score de empleabilidad con desglose y recomendaciones' })
  getMyScore(@CurrentUser() user: any) {
    return this.studentsService.getScore(user.id)
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(user.id, dto)
  }

  // ── Public profile view by userId ────────────────────────────────────────
  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Ver perfil público de un estudiante por userId' })
  getByUserId(@Param('userId') userId: string) {
    return this.studentsService.findByUserId(userId)
  }

  // ── Public profile view ───────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Ver perfil público de un estudiante' })
  async getProfile(@Param('id') id: string) {
    await this.studentsService.incrementProfileViews(id)
    return this.studentsService.findById(id)
  }

  // ── Evidences ─────────────────────────────────────────────────────────────
  @Post('me/evidences')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Agregar evidencia al portafolio' })
  addEvidence(@CurrentUser() user: any, @Body() dto: CreateEvidenceDto) {
    return this.studentsService.addEvidence(user.id, dto)
  }

  @Delete('me/evidences/:evidenceId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar evidencia' })
  removeEvidence(@CurrentUser() user: any, @Param('evidenceId') evidenceId: string) {
    return this.studentsService.removeEvidence(user.id, evidenceId)
  }
}
