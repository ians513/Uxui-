import { Injectable, BadRequestException } from '@nestjs/common'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export type UploadType = 'avatar' | 'cover' | 'evidence' | 'publication' | 'logo'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB

@Injectable()
export class MediaService {

  /**
   * Devuelve la configuración de destino para Multer según el tipo de upload.
   * Crea el directorio si no existe.
   */
  getUploadPath(type: UploadType): string {
    const basePath = join(process.cwd(), 'uploads', type + 's')
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true })
    }
    return basePath
  }

  /**
   * Valida el archivo subido (tipo MIME y tamaño).
   * Lanza BadRequestException si no pasa.
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo.')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Solo se aceptan: JPEG, PNG, WEBP, GIF.`,
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo de 5 MB.`,
      )
    }
  }

  /**
   * Construye la URL pública del archivo subido.
   * En producción esto se reemplazaría por la URL de S3 u otro CDN.
   */
  buildPublicUrl(type: UploadType, filename: string): string {
    return `/uploads/${type}s/${filename}`
  }
}
