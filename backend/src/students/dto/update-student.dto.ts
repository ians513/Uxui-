import { IsString, IsOptional, IsInt, IsUrl, Min, Max, IsEnum, IsArray, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { EvidenceType } from '../entities/portfolio-evidence.entity'

export class UpdateStudentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() headline?: string
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string
  @ApiPropertyOptional() @IsOptional() @IsString() specialty?: string
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(4) year?: number
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string
  @ApiPropertyOptional() @IsOptional() @IsString() avatar?: string
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string
  @ApiPropertyOptional() @IsOptional() @IsString() linkedinUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsString() githubUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsString() portfolioUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsString() schoolUserId?: string
}

export class CreateEvidenceDto {
  @ApiProperty()  @IsString()  title: string
  @ApiProperty()  @IsString()  description: string
  @ApiProperty({ enum: EvidenceType }) @IsEnum(EvidenceType) type: EvidenceType
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean
}

export class StudentSearchDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  specialty?: string
  @ApiPropertyOptional() @IsOptional() @IsArray()   @IsString({ each: true }) skills?: string[]
  @ApiPropertyOptional() @IsOptional() @IsInt()     @Min(0) @Max(100) minScore?: number
  @ApiPropertyOptional() @IsOptional() @IsInt()     @Min(1) @Max(4) year?: number
  @ApiPropertyOptional() @IsOptional() @IsInt()     @Min(1) page?: number
  @ApiPropertyOptional() @IsOptional() @IsInt()     @Min(1) @Max(100) limit?: number
}
