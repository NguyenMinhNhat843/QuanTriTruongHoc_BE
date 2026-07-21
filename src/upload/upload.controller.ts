import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { UploadFileService } from "./upload.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse } from "@nestjs/swagger";
import { FireStoreResponse } from "./fireStore.response";

@Controller("fileStore")
export class FileStoreController {
  constructor(private cloudinaryService: UploadFileService) {}

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: FireStoreResponse })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn file hình ảnh để upload");
    }
    return await this.cloudinaryService.uploadImageAndSaveDb(file);
  }
}
