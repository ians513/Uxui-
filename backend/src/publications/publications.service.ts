import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan, In } from 'typeorm'
import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Publication } from './entities/publication.entity'
import { PublicationLike } from './entities/publication-like.entity'
import { Comment } from './entities/comment.entity'
import { FollowsService } from '../follows/follows.service'

export class CreatePublicationDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  title?: string
  @ApiProperty()  @IsString()  content: string
  @ApiPropertyOptional() @IsOptional() @IsString()  imageUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isStory?: boolean
  @ApiPropertyOptional() @IsOptional() @IsInt()     storyDuration?: number
  @ApiPropertyOptional() @IsOptional() @IsArray()   @IsString({ each: true }) tags?: string[]
}

export class CreateCommentDto {
  @ApiProperty() @IsString() content: string
}

@Injectable()
export class PublicationsService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationsRepo: Repository<Publication>,
    @InjectRepository(PublicationLike)
    private readonly likesRepo: Repository<PublicationLike>,
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    private readonly followsService: FollowsService,
  ) {}

  async create(userId: string, role: string, authorName: string, dto: CreatePublicationDto) {
    const pub = this.publicationsRepo.create({
      authorId: userId,
      authorType: role,
      authorName,
      ...dto,
      tags: dto.tags ?? [],
    })
    return this.publicationsRepo.save(pub)
  }

  /** Feed of regular publications with isLiked flag for the requesting user.
   *  If userId provided, shows only posts from followed users (intelligent feed).
   *  Falls back to all posts if user follows no one.
   *  If skillTags provided, publications matching those tags are boosted to the top.
   */
  async findFeed(page = 1, limit = 20, userId?: string, skillTags: string[] = []) {
    let whereClause: any = { isStory: false }

    if (userId) {
      const following = await this.followsService.getFollowing(userId)
      if (following.length > 0) {
        const followedIds = following.map(f => f.id)
        // Include own posts too
        followedIds.push(userId)
        whereClause = { isStory: false, authorId: In(followedIds) }
      }
      // If not following anyone, show all posts (fallback)
    }

    const [data, total] = await this.publicationsRepo.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Boost publications whose tags overlap with the student's skills
    let sorted = data
    if (skillTags.length > 0) {
      sorted = [...data].sort((a, b) => {
        const scoreA = (a.tags ?? []).filter(t => skillTags.includes(t.toLowerCase())).length
        const scoreB = (b.tags ?? []).filter(t => skillTags.includes(t.toLowerCase())).length
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }

    if (userId && sorted.length > 0) {
      const pubIds = sorted.map(p => p.id)
      const liked = await this.likesRepo
        .createQueryBuilder('l')
        .where('l.userId = :userId AND l.publicationId IN (:...pubIds)', { userId, pubIds })
        .getMany()
      const likedSet = new Set(liked.map(l => l.publicationId))
      const enriched = sorted.map(p => ({
        ...p,
        isLiked: likedSet.has(p.id),
        isRelevant: skillTags.length > 0 && (p.tags ?? []).some(t => skillTags.includes(t.toLowerCase())),
      }))
      return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    return { data: sorted, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /** Active stories: within last 24h only (pinned stories are on profile, not wall) */
  async findStories() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return this.publicationsRepo.find({
      where: { isStory: true, createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
      take: 50,
    })
  }

  async findByUser(userId: string, isStory?: boolean) {
    const where: any = { authorId: userId }
    if (isStory !== undefined) where.isStory = isStory
    return this.publicationsRepo.find({
      where,
      order: { createdAt: 'DESC' },
    })
  }

  async findPinned(userId: string) {
    return this.publicationsRepo.find({
      where: { authorId: userId, isPinned: true },
      order: { createdAt: 'DESC' },
    })
  }

  async togglePin(userId: string, id: string): Promise<Publication> {
    const pub = await this.findById(id)
    if (pub.authorId !== userId) throw new ForbiddenException()
    pub.isPinned = !pub.isPinned
    return this.publicationsRepo.save(pub)
  }

  async findById(id: string, userId?: string): Promise<Publication & { isLiked?: boolean }> {
    const pub = await this.publicationsRepo.findOne({ where: { id } })
    if (!pub) throw new NotFoundException('Publicación no encontrada')
    if (userId) {
      const like = await this.likesRepo.findOne({ where: { userId, publicationId: id } })
      return { ...pub, isLiked: !!like }
    }
    return pub
  }

  async remove(userId: string, id: string) {
    const pub = await this.findById(id)
    if (pub.authorId !== userId) throw new ForbiddenException()
    await this.publicationsRepo.remove(pub as Publication)
  }

  /**
   * Toggle like: returns { isLiked, likes, publication }
   * authorId is returned so the controller can create a notification for the correct user.
   */
  async toggleLike(userId: string, id: string): Promise<{ isLiked: boolean; likes: number; authorId: string }> {
    const pub = await this.findById(id)
    const existing = await this.likesRepo.findOne({ where: { userId, publicationId: id } })
    let isLiked: boolean
    if (existing) {
      await this.likesRepo.delete({ userId, publicationId: id })
      pub.likes = Math.max(0, (pub.likes ?? 0) - 1)
      isLiked = false
    } else {
      await this.likesRepo.save(this.likesRepo.create({ userId, publicationId: id }))
      pub.likes = (pub.likes ?? 0) + 1
      isLiked = true
    }
    await this.publicationsRepo.save(pub as Publication)
    return { isLiked, likes: pub.likes, authorId: pub.authorId }
  }

  async incrementViews(id: string) {
    await this.publicationsRepo.increment({ id }, 'views', 1)
  }

  // ── Comments ────────────────────────────────────────────────────────────────

  async getComments(publicationId: string): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { publicationId },
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * Add a comment. Returns the comment and the publication's authorId for notification.
   */
  async addComment(
    userId: string,
    authorName: string,
    publicationId: string,
    content: string,
  ): Promise<{ comment: Comment; publicationAuthorId: string }> {
    const pub = await this.findById(publicationId)
    const comment = await this.commentsRepo.save(
      this.commentsRepo.create({ publicationId, authorId: userId, authorName, content }),
    )
    pub.comments = (pub.comments ?? 0) + 1
    await this.publicationsRepo.save(pub as Publication)
    return { comment, publicationAuthorId: pub.authorId }
  }
}
