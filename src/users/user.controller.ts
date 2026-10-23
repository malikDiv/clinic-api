import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.userService.createByAdmin(createUserDto, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.userService.findAll(req.user);
  }

  @Patch('me')
  updateMe(@Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    return this.userService.updateProfile(req.user, updateUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.userService.findOneSafe(+id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.userService.updateByAdmin(+id, updateUserDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.userService.removeByAdmin(+id, req.user);
  }
}
