import { Module } from "@nestjs/common";
import { AdmissionCampaignController } from "./controller/admission-campaign.controller";
import { DocumentConfigController } from "./controller/document-config.controller";
import { AdmissionCampaignService } from "./service/admission-campaign.service";
import { DocumentConfigService } from "./service/document-config.service";

@Module({
  controllers: [AdmissionCampaignController, DocumentConfigController],
  providers: [AdmissionCampaignService, DocumentConfigService],
  exports: [AdmissionCampaignService, DocumentConfigService],
})
export class AdmissionModule {}
