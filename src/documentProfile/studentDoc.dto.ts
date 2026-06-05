import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from "@nestjs/swagger";
import { StudentDocument } from "../../prisma/generated/prisma/client";
import { IsDate, IsInt, IsNotEmpty, IsString } from "class-validator";
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
export class CreateStudentDocumentDto extends OmitType(StudentDocumentDto, [
  "id",
  "uploadedAt",
]) {}
export class UpdateStudentDocumentDto extends PartialType(
  CreateStudentDocumentDto,
) {}
