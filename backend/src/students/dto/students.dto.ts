import {
  IsString, IsOptional, IsInt, Min, Max,
  IsUrl, IsEnum, IsBoolean, IsArray, MaxLength,
} from 'class-validator'
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { EvidenceType } from '../entities/portfolio-evidence.entity'

export class UpdateStudentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  firstName?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  lastName?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  headline?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  bio?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  specialty?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 6 })
  @IsOptional() @IsInt() @Min(1) @Max(6)
  year?: number

  @ApiPropertyOptional() @IsOptional() @IsString()
  location?: string

  @ApiPropertyOptional() @IsOptional() @IsUrl()
  linkedinUrl?: string

  @ApiPropertyOptional() @IsOptional() @IsUrl()
  githubUrl?: string

  @ApiPropertyOptional() @IsOptional() @IsUrl()
  portfolioUrl?: string
}

export class CreateEvidenceDto {
  @ApiProperty() @IsString() @MaxLength(255)
  title: string

  @ApiProperty() @IsString()
  description: string

  @ApiProperty({ enum: EvidenceType })
  @IsEnum(EvidenceType)
  type: EvidenceType

  @ApiPropertyOptional() @IsOptional() @IsUrl()
  url?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  imageUrl?: string

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isPublic?: boolean
}

export class SearchStudentsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  q?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  specialty?: string

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt()
  year?: number

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  minScore?: number

  /** Comma-separated skill names */
  @ApiPropertyOptional() @IsOptional() @IsString()
  skills?: string

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number
}
