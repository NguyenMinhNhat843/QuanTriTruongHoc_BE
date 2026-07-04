import { Injectable, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateDocumentConfigDto,
  DocumentConfigResponseDto,
  DocumentConfigWithItemsResponseDto,
} from "../dto/docConfig.dto";

@Injectable()
export class DocumentConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentConfigDto) {
    const { items, ...documentConfigData } = dto;

    await this.prisma.$transaction(async (tx) => {
      const newConfig = await tx.documentConfig.create({
        data: documentConfigData,
      });

      await tx.documentConfigItem.createMany({
        data: items.map((item) => ({
          ...item,
          documentConfigId: newConfig.id,
        })),
      });
    });

    return {
      message: "Tạo cấu hình tài liệu thành công",
    };
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
