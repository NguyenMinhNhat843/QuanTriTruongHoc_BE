import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StaffDto } from "./staff.dto.js";
import { TeacherSubjectResponseDto } from "./teacherSubject.dto.js";
import { Expose, Type } from "class-transformer";
import { UserResponseDto } from "../user/user.response.js";

export class StaffResponseDto extends StaffDto {
  @ApiPropertyOptional({ type: () => UserResponseDto }) // thêm arrow function
  user?: UserResponseDto;

  @ApiPropertyOptional({
    type: () => [TeacherSubjectResponseDto],
  })
  teacherSubjects?: TeacherSubjectResponseDto[];
}

export class TeacherDashboardStatsResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @ApiPropertyOptional()
  @Expose()
  role?: string;

  @ApiPropertyOptional()
  @Expose()
  maGiaoVien?: string;

  @ApiPropertyOptional()
  @Expose()
  department?: string;

  @ApiProperty()
  @Expose()
  @Type(() => Number)
  totalClasses: number;

  @ApiProperty()
  @Expose()
  @Type(() => Number)
  totalSubjects: number;
}
