import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDate } from "class-validator";
import { Department } from "../../prisma/generated/prisma/client";
import { Type } from "class-transformer";

export class DepartmentDto implements Department {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  headOfDepartmentId: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deptCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deptName: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class ResponseDepartmentDto extends DepartmentDto {
  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  headOfDepartmentName: string | null;

  @ApiProperty()
  @IsInt()
  totalMajors: number;

  @ApiProperty()
  @IsInt()
  totalStaffs: number;

  @ApiProperty()
  @IsInt()
  totalStudents: number;
}

export class CreateDepartmentDto extends OmitType(DepartmentDto, ["id", "createdAt", "updatedAt"]) {}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
