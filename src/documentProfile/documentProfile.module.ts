import { Module } from "@nestjs/common";
import { DocumentConfigService } from "./service/docConfig.service";
import { DocumentConfigItemService } from "./service/docConfigItem.service";
import { StudentDocumentService } from "./service/studentDoc.service";
import { StudentDocumentController } from "./controller/studentDoc.controller";
import { DocumentConfigController } from "./controller/docConfig.controller";
import { CloudinaryModule } from "../upload/upload.module";
import { DocumentConfigItemController } from "./controller/docConfigItem.controller";

@Module({
  imports: [CloudinaryModule],
  providers: [
    DocumentConfigService,
    DocumentConfigItemService,
    StudentDocumentService,
  ],
  controllers: [
    DocumentConfigController,
    DocumentConfigItemController,
    StudentDocumentController,
  ],
  exports: [
    DocumentConfigService,
    DocumentConfigItemService,
    StudentDocumentService,
  ],
})
export class DocumentProfileModule {}
