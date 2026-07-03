import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ClassSubjectScheduleDetailService } from '../service/classSubjectScheduleDetail.service';
import { CreateClassSubjectScheduleDetailDto, UpdateClassSubjectScheduleDetailDto, SearchClassSubjectScheduleDetailDto, ClassSubjectScheduleDetailDto } from '../dto/classSubjectScheduleDetail';

@ApiTags('class-subject-schedule-detail')
@Controller('class-subject-schedule-detail')
export class ClassSubjectScheduleDetailController {
  constructor(private readonly detailService: ClassSubjectScheduleDetailService) {}

  @Post()
  @ApiOperation({ summary: 'Create new schedule detail' })
  @ApiResponse({ status: 201, type: ClassSubjectScheduleDetailDto })
  async create(@Body() createDto: CreateClassSubjectScheduleDetailDto) {
    return this.detailService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedule details matching query' })
  @ApiResponse({ status: 200, type: [ClassSubjectScheduleDetailDto] })
  async findAll(@Query() query: SearchClassSubjectScheduleDetailDto) {
    return this.detailService.findAll(query);
  }

  @Get('load-schedule')
  @ApiOperation({ summary: 'Load study schedule of a class, teacher, or semester' })
  async loadStudySchedule(
    @Query('classId') classId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('weekNumber') weekNumber?: string,
  ) {
    return this.detailService.loadStudySchedule({
      classId: classId ? Number(classId) : undefined,
      semesterId: semesterId ? Number(semesterId) : undefined,
      teacherId: teacherId ? Number(teacherId) : undefined,
      weekNumber: weekNumber ? Number(weekNumber) : undefined,
    });
  }

  @Get('export-excel')
  @ApiOperation({ summary: 'Export excel study schedule of a class in a semester' })
  async exportStudyScheduleToExcel(
    @Query('classId') classId: string,
    @Query('semesterId') semesterId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.detailService.exportStudyScheduleToExcel({
      classId: Number(classId),
      semesterId: Number(semesterId),
    });

    const fileName = `Tien_Do_Dao_Tao_Class_${classId}_Sem_${semesterId}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific schedule detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectScheduleDetailDto })
  async findOne(@Param('id') id: string) {
    return this.detailService.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a specific schedule detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ClassSubjectScheduleDetailDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateClassSubjectScheduleDetailDto) {
    return this.detailService.update(Number(id), updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific schedule detail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    return this.detailService.remove(Number(id));
  }
}
