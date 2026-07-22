import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { StudentModule } from "../student/student.module.js";

// Controllers
import { AdmissionCampaignController } from "./controllers/admission-campaign.controller.js";
import { AdmissionCampaignMajorController } from "./controllers/admission-campaign-major.controller.js";
import { SubjectCombinationController } from "./controllers/subject-combination.controller.js";
import { AdmissionProfileController } from "./controllers/admission-profile.controller.js";
import { AdmissionDocumentController } from "./controllers/admission-document.controller.js";
import { DocumentConfigController } from "./controllers/document-config.controller.js";
import { PriorityRuleController } from "./controllers/priority-rule.controller.js";
import { AdmissionInterestController } from "./controllers/admission-interest.controller.js";

// Services
import { AdmissionCampaignService } from "./services/admission-campaign.service.js";
import { AdmissionCampaignMajorService } from "./services/admission-campaign-major.service.js";
import { SubjectCombinationService } from "./services/subject-combination.service.js";
import { AdmissionProfileService } from "./services/admission-profile.service.js";
import { AdmissionDocumentService } from "./services/admission-document.service.js";
import { DocumentConfigService } from "./services/document-config.service.js";
import { PriorityRuleService } from "./services/priority-rule.service.js";
import { AdmissionInterestService } from "./services/admission-interest.service.js";

@Module({
  imports: [PrismaModule, forwardRef(() => StudentModule)],
  controllers: [
    AdmissionCampaignController,
    AdmissionCampaignMajorController,
    SubjectCombinationController,
    AdmissionProfileController,
    AdmissionDocumentController,
    DocumentConfigController,
    PriorityRuleController,
    AdmissionInterestController,
  ],
  providers: [
    AdmissionCampaignService,
    AdmissionCampaignMajorService,
    SubjectCombinationService,
    AdmissionProfileService,
    AdmissionDocumentService,
    DocumentConfigService,
    PriorityRuleService,
    AdmissionInterestService,
  ],
  exports: [
    AdmissionCampaignService,
    AdmissionCampaignMajorService,
    SubjectCombinationService,
    AdmissionProfileService,
    AdmissionDocumentService,
    DocumentConfigService,
    PriorityRuleService,
    AdmissionInterestService,
  ],
})
export class AdmissionModule {}

