import { Module } from "@nestjs/common";
import { DocumentConfigService } from "./docConfig.service";
import { DocumentConfigItemService } from "./docConfigItem.service";
import { StudentDocumentService } from "./studentDoc.service";
import { StudentDocumentController } from "./studentDoc.controller";
import { DocumentConfigItemController } from "./docConfigItem.controller";
import { DocumentConfigController } from "./docConfig.controller";

@Module({
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
