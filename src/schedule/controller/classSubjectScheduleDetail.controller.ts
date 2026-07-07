import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { ClassSubjectScheduleDetailService } from "../service/classSubjectScheduleDetail.service";
import {
  CreateClassSubjectScheduleDetailDto,
  UpdateClassSubjectScheduleDetailDto,
  SearchClassSubjectScheduleDetailDto,
  ClassSubjectScheduleDetailDto,
} from "../dto/classSubjectScheduleDetail";

@ApiTags("class-subject-schedule-detail")
@Controller("class-subject-schedule-detail")
export class ClassSubjectScheduleDetailController {
  constructor(
    private readonly detailService: ClassSubjectScheduleDetailService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create new schedule detail" })
  @ApiResponse({ status: 201, type: ClassSubjectScheduleDetailDto })
  async create(@Body() createDto: CreateClassSubjectScheduleDetailDto) {
    return this.detailService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all schedule details matching query" })
  @ApiResponse({ status: 200, type: [ClassSubjectScheduleDetailDto] })
  async findAll(@Query() query: SearchClassSubjectScheduleDetailDto) {
    return this.detailService.findAll(query);
  }

  @Get("load-schedule")
  @ApiOperation({
    summary: "Load study schedule of a class, teacher, or semester",
  })
  async loadStudySchedule(
    @Query("classId") classId?: string,
    @Query("semesterId") semesterId?: string,
    @Query("teacherId") teacherId?: string,
    @Query("weekNumber") weekNumber?: string,
  ) {
    return this.detailService.loadStudySchedule({
      classId: classId ? Number(classId) : undefined,
      semesterId: semesterId ? Number(semesterId) : undefined,
      teacherId: teacherId ? Number(teacherId) : undefined,
      weekNumber: weekNumber ? Number(weekNumber) : undefined,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details of a specific schedule detail" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectScheduleDetailDto })
  async findOne(@Param("id") id: string) {
    return this.detailService.findOne(Number(id));
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a specific schedule detail" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectScheduleDetailDto })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateClassSubjectScheduleDetailDto,
  ) {
    return this.detailService.update(Number(id), updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a specific schedule detail" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200 })
  async remove(@Param("id") id: string) {
    return this.detailService.remove(Number(id));
  }
}
