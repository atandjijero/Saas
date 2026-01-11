import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Store 1' })
  name: string;

  @ApiProperty({ example: 'store1.example.com' })
  domain: string;
}
