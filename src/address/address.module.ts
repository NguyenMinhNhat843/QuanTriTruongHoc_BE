import { Module } from "@nestjs/common";
import { ProvinceController } from "./controller/province.controller";
import { VillageController } from "./controller/village.controller";
import { WardController } from "./controller/ward.controller";
import { ProvinceService } from "./service/province.service";
import { VillageService } from "./service/village.service";
import { WardService } from "./service/ward.service";

@Module({
  controllers: [ProvinceController, WardController, VillageController],
  providers: [ProvinceService, WardService, VillageService],
  exports: [ProvinceService, WardService, VillageService],
})
export class AddressModule {}
