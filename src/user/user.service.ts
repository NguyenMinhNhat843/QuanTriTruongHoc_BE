import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateUserDto } from "./user.dto.js";
import { UserResponseDto } from "./user.response.js";
import { generateId } from "../utils/generateId.js";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        userId: `U${generateId()}`,
      },
    });
    return new UserResponseDto(user);
  }

  async updateUser(id: number, data: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return new UserResponseDto(user);
  }
}
