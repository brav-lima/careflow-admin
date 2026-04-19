import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator'

export class OrganizationOwnerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ description: 'CPF (somente números)', example: '11122233344' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF deve ter exatamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter apenas números' })
  cpf!: string

  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string
}

export class CreateOrganizationWithOwnerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ description: 'CNPJ (somente números)', example: '12345678000190' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos' })
  document!: string

  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ type: () => OrganizationOwnerDto })
  @ValidateNested()
  @Type(() => OrganizationOwnerDto)
  owner!: OrganizationOwnerDto
}
