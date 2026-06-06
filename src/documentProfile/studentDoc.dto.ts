import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { StudentDocument } from "../../prisma/generated/prisma/client";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { StudentResponseDto } from "../student/student.response";
import { DocumentConfigItemResponseDto } from "./docConfigItem.dto";

export class StudentDocumentDto implements StudentDocument {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  documentConfigItemId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ type: String, format: "date-time" })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  uploadedAt: Date;
}
export class StudentDocumentResponseDto extends StudentDocumentDto {
  @ApiPropertyOptional({ type: StudentResponseDto })
  student?: StudentResponseDto;

  @ApiPropertyOptional({ type: DocumentConfigItemResponseDto })
  documentConfigItem?: DocumentConfigItemResponseDto;
}
export class CreateStudentDocumentDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  documentConfigItemId: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  studentId: number;
}
export class CreateManyStudentDocumentDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ type: [Number] })
  @Type(() => Number)
  documentConfigItemIds: number[];
}
export class UpdateStudentDocumentDto extends PartialType(
  CreateStudentDocumentDto,
) {}
export class SearchStudentDocDto {
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  studentId?: number;
}
