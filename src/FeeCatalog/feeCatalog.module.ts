import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { FeeCatalogController } from "./feeCatalog.controller";
import { FeeCatalogService } from "./feeCatalog.service";

@Module({
  imports: [PrismaModule],
  controllers: [FeeCatalogController],
  providers: [FeeCatalogService],
  exports: [FeeCatalogService],
})
export class FeeCatalogModule {}
