import {
  ApiProperty,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
} from "@nestjs/swagger";
import { applyDecorators, Type } from "@nestjs/common";

export class Meta {
  @ApiProperty()
  total: number;
}

export class ResponsePagination<T> {
  // Không dùng @ApiProperty ở đây vì T là generic
  data: T[];

  @ApiProperty({ type: () => Meta })
  meta: Meta;
}

// Tạo Decorator để "nhồi" Type vào data
export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(ResponsePagination, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponsePagination) },
          {
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
    }),
  );
