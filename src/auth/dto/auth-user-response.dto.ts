import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RoleType } from "../../../prisma/generated/prisma/enums";

export class AuthUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({
    enum: RoleType,
  })
  role: RoleType;

  @ApiPropertyOptional({ nullable: true })
  studentId: number | null;

  @ApiPropertyOptional({ nullable: true })
  staffId: number | null;

  @ApiPropertyOptional({ nullable: true })
  fullName: string | null;

  @ApiPropertyOptional({ nullable: true })
  departmentId: number | null;

  @ApiPropertyOptional({ nullable: true })
  deptCode: string | null;

  @ApiPropertyOptional({ nullable: true })
  deptName: string | null;
}
