import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserResponseDto } from "../user/user.response.js";
import { CreateStaffDto } from "./staff.dto.js";
import { TeacherSubjectResponseDto } from "./teacherSubject.dto.js";
import { Expose, Type } from "class-transformer";

export class StaffResponseDto extends CreateStaffDto {
  @ApiPropertyOptional({ type: UserResponseDto })
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
