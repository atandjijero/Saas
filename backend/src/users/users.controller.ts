import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':tenantId')
  findAll(@Param('tenantId') tenantId: string, @Request() req) {
    return this.usersService.findAll(tenantId, req.user);
  }

  @Post(':tenantId')
  @ApiOperation({ summary: 'Create user' })
  create(@Param('tenantId') tenantId: string, @Body() body: CreateUserDto, @Request() req) {
    return this.usersService.create(tenantId, body.email, body.password, body.role, req.user);
  }

  @Patch(':tenantId/:userId')
  update(@Param('tenantId') tenantId: string, @Param('userId') userId: string, @Body() body: UpdateUserDto, @Request() req) {
    return this.usersService.update(tenantId, userId, body.email, body.role, req.user);
  }

  @Delete(':tenantId/:userId')
  remove(@Param('tenantId') tenantId: string, @Param('userId') userId: string, @Request() req) {
    return this.usersService.remove(tenantId, userId, req.user);
  }
}