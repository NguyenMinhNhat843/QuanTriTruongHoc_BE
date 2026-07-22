import { Module } from "@nestjs/common";
import { UploadFileService } from "./upload.service";
import { FileStoreController } from "./upload.controller";
import { CloudinaryProvider } from "./upload.provider";

@Module({
  providers: [UploadFileService, CloudinaryProvider],
  controllers: [FileStoreController],
  exports: [UploadFileService, CloudinaryProvider],
})
export class UploadFileModule {}
