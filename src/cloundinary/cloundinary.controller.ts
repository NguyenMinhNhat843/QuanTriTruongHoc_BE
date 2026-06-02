import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { CloudinaryService } from "./cloundinary.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("fileStore")
export class FileStoreController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Vui lòng chọn file hình ảnh để upload");
    }
    return await this.cloudinaryService.uploadImage(file);
  }
}
