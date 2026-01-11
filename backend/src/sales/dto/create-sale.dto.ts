import { ApiProperty } from '@nestjs/swagger';

class SaleItemDto {
  @ApiProperty({ example: 'prod1' })
  productId: string;

  @ApiProperty({ example: 2 })
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleItemDto] })
  items: SaleItemDto[];
}
