import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { ClassSubjectScheduleDetail } from "../../../prisma/generated/prisma/client";

export class ClassSubjectScheduleDetailDto implements ClassSubjectScheduleDetail {
    @ApiProperty()
    id: number;

    @ApiPropertyOptional({ nullable: true })
    roomId: number | null;

    @ApiProperty()
    sessionId: number;

    @ApiPropertyOptional({ type: Date, nullable: true })
    studyDate: Date | null;

    @ApiProperty()
    weekNumber: number;
}

export class CreateClassSubjectScheduleDetailDto extends OmitType(ClassSubjectScheduleDetailDto, ["id"]) { }
export class UpdateClassSubjectScheduleDetailDto extends PartialType(CreateClassSubjectScheduleDetailDto) { }
export class SearchClassSubjectScheduleDetailDto extends PartialType(ClassSubjectScheduleDetailDto) { }