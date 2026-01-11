import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Product 1' })
  name: string;

  @ApiProperty({ example: 'Description' })
  description: string;

  @ApiProperty({ example: 10.0 })
  price: number;

  @ApiProperty({ example: 100 })
  stock: number;
}
