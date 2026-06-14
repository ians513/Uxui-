import {
  IsString, IsEnum, IsOptional, IsBoolean,
  IsArray, IsDateString, IsInt, Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OpportunityType } from '../entities/opportunity.entity'

export class CreateOpportunityDto {
  @ApiProperty() @IsString() title: string
  @ApiProperty() @IsString() description: string
  @ApiProperty({ enum: OpportunityType }) @IsEnum(OpportunityType) type: OpportunityType
  @ApiProperty() @IsString() location: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRemote?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() salary?: string
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) requirements?: string[]
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[]
  @ApiPropertyOptional() @IsOptional() @IsString() specialty?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() salary?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string
}

export class OpportunityQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  type?: string
  @ApiPropertyOptional() @IsOptional() @IsString()  specialty?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRemote?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString()  location?: string
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) limit?: number
}
