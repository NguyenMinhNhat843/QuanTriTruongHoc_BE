import { ApiProperty } from "@nestjs/swagger";
import { GradeComponent } from "../../prisma/generated/prisma/client";

export class GradeComponentDto implements GradeComponent {
  @ApiProperty({
    example: 1,
    description: "ID định danh cấu hình thành phần điểm",
  })
  id: number;

  @ApiProperty({
    example: "midterm",
    description: "Tên thành phần điểm (Ví dụ: attendance, midterm, final)",
  })
  name: string;

  @ApiProperty({
    example: 0.3,
    description:
      "Trọng số điểm hệ số thập phân (Ví dụ: Giữa kỳ chiếm 30% = 0.3)",
  })
  weight: number;
}
