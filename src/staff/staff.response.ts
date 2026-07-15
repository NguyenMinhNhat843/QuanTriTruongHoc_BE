import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { StaffDto } from "./staff.dto.js";
import { TeacherSubjectResponseDto } from "./teacherSubject.dto.js";
import { Expose, Type } from "class-transformer";
import { UserResponseDto } from "../user/user.response.js";
import { DepartmentDto } from "../department/department.dto.js";

export class StaffResponseDto extends StaffDto {
  @ApiPropertyOptional({ type: () => UserResponseDto })
  user?: UserResponseDto;

  @ApiPropertyOptional({ type: () => DepartmentDto })
  department?: DepartmentDto;

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
