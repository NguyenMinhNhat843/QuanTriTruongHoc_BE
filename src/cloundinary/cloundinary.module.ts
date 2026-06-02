import { Module } from "@nestjs/common";
import { CloudinaryService } from "./cloundinary.service";
import { FileStoreController } from "./cloundinary.controller";
import { CloudinaryProvider } from "./cloundinary.provider";

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  controllers: [FileStoreController],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
