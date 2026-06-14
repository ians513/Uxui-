import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { PublicationsService, CreatePublicationDto, CreateCommentDto } from './publications.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser, Public } from '../auth/decorators/public.decorator'
import { StudentProfile } from '../students/entities/student-profile.entity'
import { CompanyProfile } from '../companies/entities/company-profile.entity'
import { SchoolProfile } from '../schools/entities/school-profile.entity'
import { UserRole } from '../users/entities/user.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { NotificationType } from '../notifications/entities/notification.entity'

@ApiTags('Publications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('publications')
export class PublicationsController {
  constructor(
    private readonly publicationsService: PublicationsService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(StudentProfile) private readonly studentsRepo: Repository<StudentProfile>,
    @InjectRepository(CompanyProfile) private readonly companiesRepo: Repository<CompanyProfile>,
    @InjectRepository(SchoolProfile)  private readonly schoolsRepo:  Repository<SchoolProfile>,
  ) {}

  // ── Resolve display name from profile ────────────────────────────────────────
  private async resolveAuthorName(userId: string, role: string): Promise<string> {
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

  @Get('feed')
  @ApiOperation({ summary: 'Feed de publicaciones (requiere auth para isLiked y personalización)' })
  getFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('tags') tags: string,
    @CurrentUser() user: any,
  ) {
    const tagList = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
    return this.publicationsService.findFeed(+page, +limit, user?.id, tagList)
  }

  @Public()
  @Get('stories')
  @ApiOperation({ summary: 'Historias activas (últimas 24h)' })
  getStories() {
    return this.publicationsService.findStories()
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mis publicaciones' })
  getMine(@CurrentUser() user: any, @Query('story') story?: string) {
    const isStory = story === 'true' ? true : story === 'false' ? false : undefined
    return this.publicationsService.findByUser(user.id, isStory)
  }

  @Get('pinned/:userId')
  @Public()
  @ApiOperation({ summary: 'Publicaciones/historias destacadas de un usuario' })
  getPinned(@Param('userId') userId: string) {
    return this.publicationsService.findPinned(userId)
  }

  @Get('by-user/:userId')
  @Public()
  @ApiOperation({ summary: 'Publicaciones públicas de un usuario (sin stories)' })
  getByUser(@Param('userId') userId: string) {
    return this.publicationsService.findByUser(userId, false)
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: 'Comentarios de una publicación' })
  getComments(@Param('id') id: string) {
    return this.publicationsService.getComments(id)
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Ver publicación' })
  async getOne(@Param('id') id: string, @CurrentUser() user?: any) {
    await this.publicationsService.incrementViews(id)
    return this.publicationsService.findById(id, user?.id)
  }

  @Post()
  @ApiOperation({ summary: 'Crear publicación o historia' })
  async create(@CurrentUser() user: any, @Body() dto: CreatePublicationDto) {
    const authorName = await this.resolveAuthorName(user.id, user.role)
    return this.publicationsService.create(user.id, user.role, authorName, dto)
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Toggle like en una publicación' })
  async like(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.publicationsService.toggleLike(user.id, id)

    // Notify the publication owner when someone likes (not if liking own content)
    if (result.isLiked && result.authorId !== user.id) {
      const likerName = await this.resolveAuthorName(user.id, user.role)
      this.notificationsService.create({
        userId: result.authorId,
        type: NotificationType.LIKE,
        title: 'Te dieron un like',
        body: `${likerName} le dio me gusta a tu publicación.`,
        link: `/student/muro`,
      }).catch(() => { /* non-critical */ })
    }

    return result
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comentar una publicación' })
  async comment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    const authorName = await this.resolveAuthorName(user.id, user.role)
    const { comment, publicationAuthorId } = await this.publicationsService.addComment(
      user.id,
      authorName,
      id,
      dto.content,
    )

    // Notify publication owner when someone comments (not if commenting own content)
    if (publicationAuthorId !== user.id) {
      this.notificationsService.create({
        userId: publicationAuthorId,
        type: NotificationType.COMMENT,
        title: 'Nuevo comentario',
        body: `${authorName} comentó en tu publicación: "${dto.content.slice(0, 80)}"`,
        link: `/student/muro`,
      }).catch(() => { /* non-critical */ })
    }

    return comment
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Destacar/quitar historia del perfil' })
  togglePin(@CurrentUser() user: any, @Param('id') id: string) {
    return this.publicationsService.togglePin(user.id, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar publicación propia' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.publicationsService.remove(user.id, id)
  }
}
