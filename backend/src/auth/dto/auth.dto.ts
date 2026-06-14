import {
  IsEmail, IsString, MinLength, IsEnum,
  IsOptional, MaxLength, IsInt, Min, Max,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserRole } from '../../users/entities/user.entity'

export class LoginDto {
  @ApiProperty({ example: 'matias@colegio.cl' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string
}

export class RegisterDto {
  @ApiProperty({ example: 'matias@colegio.cl' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole

  // Student fields
  @ApiPropertyOptional({ example: 'Matías' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string

  @ApiPropertyOptional({ example: 'Arancibia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string

  @ApiPropertyOptional({ example: 'Informática' })
  @IsOptional()
  @IsString()
  specialty?: string

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  year?: number

  // Company fields
  @ApiPropertyOptional({ example: 'TechCorp Chile' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string

  // School fields
  @ApiPropertyOptional({ example: 'Instituto Técnico Metropolitano' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  schoolName?: string

  // Link student to a school at registration time
  @ApiPropertyOptional({ description: 'userId del colegio al que pertenece el estudiante' })
  @IsOptional()
  @IsString()
  schoolUserId?: string
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'matias@colegio.cl' })
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string
}
