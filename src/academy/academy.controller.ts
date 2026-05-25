import { Body, Controller, Post } from "@nestjs/common";
import { AcademyService } from "./academy.service";
import { CreateSemesterDto } from "../semester/semester.dto";
import { ApiOperation } from "@nestjs/swagger";

@Controller("academy")
export class AcademyController {
  constructor(private academyService: AcademyService) {}

  @Post("open-semester")
  @ApiOperation({ summary: "Mở học kỳ mới cho toàn trường" })
  async openNewSemester(@Body() body: CreateSemesterDto) {
    return await this.academyService.openNewSemester(body);
  }
}
