import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get(':tenantId')
  findAll(@Param('tenantId') tenantId: string, @Request() req) {
    return this.productsService.findAll(tenantId, req.user);
  }

  @Post(':tenantId')
  @ApiOperation({ summary: 'Create product' })
  create(@Param('tenantId') tenantId: string, @Body() body: CreateProductDto, @Request() req) {
    return this.productsService.create(tenantId, body.name, body.description, body.price, body.stock, req.user);
  }

  @Patch(':tenantId/:productId')
  update(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Body() body: UpdateProductDto, @Request() req) {
    return this.productsService.update(tenantId, productId, body.name, body.description, body.price, body.stock, req.user);
  }

  @Delete(':tenantId/:productId')
  remove(@Param('tenantId') tenantId: string, @Param('productId') productId: string, @Request() req) {
    return this.productsService.remove(tenantId, productId, req.user);
  }
}