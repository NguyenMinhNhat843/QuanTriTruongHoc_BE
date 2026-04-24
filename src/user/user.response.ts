import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { RoleType } from "../../prisma/generated/prisma/enums.js";
import { User } from "../../prisma/generated/prisma/client.js";

export class UserResponseDto implements User {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: "u_9b1deb4d" })
  @Expose()
  userId: string;

  @ApiProperty({ example: "johndoe" })
  @Expose()
  username: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @Expose()
  email: string | null;

  @ApiPropertyOptional({ example: "John Doe" })
  @Expose()
  fullName: string | null;

  @ApiPropertyOptional({ example: true })
  @Expose()
  gender: boolean | null;

  @ApiPropertyOptional({ example: "1995-12-25" })
  @Expose()
  dob: Date | null;

  @ApiPropertyOptional({ example: "0987654321" })
  @Expose()
  phone: string | null;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @Expose()
  avatarUrl: string | null;

  @ApiProperty({ enum: RoleType })
  @Expose()
  role: RoleType;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  // Ẩn hoàn toàn passwordHash dù nó có tồn tại trong object input
  @Exclude()
  passwordHash: string;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }

  @ApiPropertyOptional({ example: "2024-01-01T12:00:00Z" })
  lastLoginAt: Date | null;
}
