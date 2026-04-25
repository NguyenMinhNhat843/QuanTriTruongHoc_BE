import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: number;
    username: string;
    role: string;
  };
}
