import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateStaffPositionDto,
  SearchStaffPositionDto,
  StaffPositionDto,
  UpdateStaffPositionDto,
} from "../dto/staff-position.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StaffPositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStaffPositionDto): Promise<StaffPositionDto> {
    return this.prisma.staffPosition.create({
      data: dto,
    });
  }

  async findAll(query: SearchStaffPositionDto): Promise<StaffPositionDto[]> {
    const { staffId, positionId, departmentId } = query;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }
    if (positionId) {
      where.positionId = positionId;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    return this.prisma.staffPosition.findMany({
      where,
      include: {
        position: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: number): Promise<StaffPositionDto> {
    const item = await this.prisma.staffPosition.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy StaffPosition với ID: ${id}`);
    }

    return item;
  }

  async update(id: number, dto: UpdateStaffPositionDto): Promise<StaffPositionDto> {
    await this.findOne(id);

    return this.prisma.staffPosition.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<StaffPositionDto> {
    await this.findOne(id);

    return this.prisma.staffPosition.delete({
      where: { id },
    });
  }
}
