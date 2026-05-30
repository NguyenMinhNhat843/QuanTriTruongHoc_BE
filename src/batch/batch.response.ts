import { ApiProperty } from "@nestjs/swagger";
import { MajorResponseDto } from "../major/major.response";
import { BatchDto } from "./batch.dto";

export class BatchResponseDto extends BatchDto {
  @ApiProperty({ type: MajorResponseDto, nullable: true })
  major?: MajorResponseDto | null;
}

export class ViewPageTienDoDaoTaoResponseItemDto {
  subject: {
    id: number;
    subjectCode: string;
    subjectName: string;
  };
  teacher: {
    id: number;
    fullName: string;
  };
  room: {
    name: string;
  };
  totalHours: number;
  dayOfWeek: number;
  period: string;
  weekSchedule: {
    weekNumber: number;
    periodCount: number;
  }[];
}
export class ViewPageTienDoDaoTaoResponseDto {
  items: ViewPageTienDoDaoTaoResponseItemDto[];
}
