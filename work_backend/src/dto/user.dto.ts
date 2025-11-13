import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @IsOptional()
  department_id?: number;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  status?: string;
}