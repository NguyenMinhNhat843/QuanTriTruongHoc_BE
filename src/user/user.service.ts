import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE USER
  async create(data: CreateUserDto) {
    // Hash password trước khi lưu
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      return await this.prisma.user.create({
        data: { ...data, password: hashedPassword },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username or Email already exists');
      }
      throw error;
    }
  }

  // 3. UPDATE USER
  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
