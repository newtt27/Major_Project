// src/dto/department.dto.ts
import { IsString, IsOptional, IsInt, Min, IsEnum } from "class-validator";

export class CreateDepartmentDto {
  @IsString()
  department_name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  manager_id?: number;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  department_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  manager_id?: number;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}