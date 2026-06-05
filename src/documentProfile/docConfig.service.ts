import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateDocumentConfigDto,
  DocumentConfigResponseDto,
  DocumentConfigWithItemsResponseDto,
} from "./docConfig.dto";

@Injectable()
export class DocumentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateDocumentConfigDto,
  ): Promise<DocumentConfigResponseDto> {
    const newConfig = await this.prisma.documentConfig.create({
      data: dto,
    });

    return plainToInstance(DocumentConfigResponseDto, newConfig);
  }

  async findAll(): Promise<DocumentConfigResponseDto[]> {
    const configs = await this.prisma.documentConfig.findMany();

    return plainToInstance(DocumentConfigResponseDto, configs);
  }

  async findOne(id: number): Promise<DocumentConfigWithItemsResponseDto> {
    const config = await this.prisma.documentConfig.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!config) {
      throw new NotFoundException(`DocumentConfig với ID ${id} không tồn tại`);
    }

    return plainToInstance(DocumentConfigWithItemsResponseDto, config);
  }
}
