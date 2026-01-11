import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: 'user-id' })
  userId: string;

  @ApiProperty({ example: '123456' })
  token: string;
}
