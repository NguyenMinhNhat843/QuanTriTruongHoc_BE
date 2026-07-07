import { ApiProperty } from "@nestjs/swagger";

export class FireStoreResponse {
  @ApiProperty({})
  id: string;

  @ApiProperty({})
  imageUrl: string;

  @ApiProperty({})
  publicId: string;
}
