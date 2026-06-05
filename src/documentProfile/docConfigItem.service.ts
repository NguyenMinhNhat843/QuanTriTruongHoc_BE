import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateDocumentConfigItemDto,
  DocumentConfigItemResponseDto,
} from "./docConfigItem.dto"; // Điều chỉnh đường dẫn file dto của bạn
import { plainToInstance } from "class-transformer";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DocumentConfigItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateDocumentConfigItemDto,
  ): Promise<DocumentConfigItemResponseDto> {
    const newItem = await this.prisma.documentConfigItem.create({
      data: dto,
      include: {
        documentConfig: true,
      },
    });

    return plainToInstance(DocumentConfigItemResponseDto, newItem);
  }

  async findAll(): Promise<DocumentConfigItemResponseDto[]> {
    const items = await this.prisma.documentConfigItem.findMany({
      include: {
        documentConfig: true,
      },
    });

    return plainToInstance(DocumentConfigItemResponseDto, items);
  }

  async findOne(id: number): Promise<DocumentConfigItemResponseDto> {
    const item = await this.prisma.documentConfigItem.findUnique({
      where: { id },
      include: { documentConfig: true },
    });

    if (!item) {
      throw new NotFoundException(
        `DocumentConfigItem với ID ${id} không tồn tại`,
      );
    }

    return plainToInstance(DocumentConfigItemResponseDto, item);
  }
}
