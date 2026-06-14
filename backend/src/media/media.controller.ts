import {
  Controller, Post, UploadedFile, UseInterceptors,
  UseGuards, Query, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { randomUUID } from 'crypto'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger'
import { MediaService, UploadType } from './media.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

const VALID_TYPES: UploadType[] = ['avatar', 'cover', 'evidence', 'publication', 'logo']

@ApiTags('Media')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /api/media/upload?type=avatar|cover|evidence|publication|logo
   *
   * Sube una imagen y retorna la URL pública.
   * La URL se puede guardar en el campo correspondiente del perfil o evidencia.
   *
   * Límites:
   *   - Tipos aceptados: JPEG, PNG, WEBP, GIF
   *   - Tamaño máximo: 5 MB
   */
  @Post('upload')
  @ApiOperation({ summary: 'Subir imagen al servidor' })
  @ApiQuery({ name: 'type', enum: ['avatar', 'cover', 'evidence', 'publication', 'logo'] })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const type = (req.query.type as UploadType) ?? 'evidence'
          const service = new MediaService()
          const path = service.getUploadPath(type)
          cb(null, path)
        },
        filename: (req, file, cb) => {
          // Nombre único: uuid + extensión original
          const ext      = extname(file.originalname).toLowerCase()
          const filename = `${randomUUID()}${ext}`
          cb(null, filename)
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF)'), false)
        }
        cb(null, true)
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: UploadType = 'evidence',
  ) {
    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Tipo inválido. Usa: ${VALID_TYPES.join(', ')}`)
    }

    this.mediaService.validateFile(file)

    const url = this.mediaService.buildPublicUrl(type, file.filename)

    return {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type,
    }
  }
}
