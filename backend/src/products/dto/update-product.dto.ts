import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({ example: 'Updated product', required: false })
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  description?: string;

  @ApiProperty({ example: 15.0, required: false })
  price?: number;

  @ApiProperty({ example: 80, required: false })
  stock?: number;
}
