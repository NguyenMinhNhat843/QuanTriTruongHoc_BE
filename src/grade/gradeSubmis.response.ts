import { ApiProperty } from "@nestjs/swagger";

export class SubmitGradeResponse {
  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: Boolean })
  status: boolean;
}
