import {
  Controller,
  Post,
  Put,
  Param,
  Body,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { HotelsService } from './hotels.service';
import { CreateHotelRoomDto } from './dto/create-hotel-room.dto';
import { UpdateHotelRoomDto } from './dto/update-hotel-room.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Types } from 'mongoose';

@Controller('api/admin/hotel-rooms')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class HotelRoomsAdminController {
  constructor(private readonly hotelsService: HotelsService) {}

  // Создание номера
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
      ],
      {
        storage: diskStorage({
          destination: join(__dirname, '../uploads'),
          filename: (_req, file, cb) => {
            const name    = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext     = extname(file.originalname);
            cb(null, `${name}${ext}`);
          },
        }),
      },
    ),
  )
  async createHotelRoom(
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Body() dto: CreateHotelRoomDto,
  ) {
    const hotelId = new Types.ObjectId(dto.hotelId);
    const imgs    = (files.images || []).map(f => `/uploads/${f.filename}`);

    const room = await this.hotelsService.createHotelRoom({
      description: dto.description,
      hotel: hotelId,
      images: imgs,
      isEnabled: true,
    });

    return {
      id: room._id,
      description: room.description,
      images: room.images,
      isEnabled: room.isEnabled,
      hotel: {
        id: (room.hotel as any)._id.toString(),
        title: (room.hotel as any).title,
        description: (room.hotel as any).description,
      },
    };
  }

  // Обновление номера
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
      ],
      {
        storage: diskStorage({
          destination: join(__dirname, '../uploads'),
          filename: (_req, file, cb) => {
            const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext  = extname(file.originalname);
            cb(null, `${name}${ext}`);
          },
        }),
      },
    ),
  )
  async updateHotelRoom(
    @Param('id') id: string,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Body() dto: UpdateHotelRoomDto,
  ) {
    // Проверяем, что номер есть
    const existing = await this.hotelsService.findHotelRoomById(id);
    if (!existing) throw new NotFoundException('Номер не найден');

    // Разбираем обновлённые существующие картинки
    let keptImages: string[] = [];
    if (dto.existingImages) {
      try {
        keptImages = JSON.parse(dto.existingImages);
      } catch {
        throw new BadRequestException('Поле existingImages должно быть JSON-массивом строк');
      }
    } else {
      keptImages = existing.images || [];
    }

    // Новые файлы
    const newImgs = (files.images || []).map(f => `/uploads/${f.filename}`);

    // Финальный список картинок
    const finalImages = [...keptImages, ...newImgs];

    // Подготовка данных к обновлению
    const updateData: any = {
      description: dto.description,
      images: finalImages,
      isEnabled: dto.isEnabled,
    };
    if (dto.hotelId) {
      updateData.hotel = new Types.ObjectId(dto.hotelId);
    }

    // Сохраняем
    const room = await this.hotelsService.updateHotelRoom(id, updateData);

    return {
      id: room._id,
      description: room.description,
      images: room.images,
      isEnabled: room.isEnabled,
      hotel: {
        id: (room.hotel as any)._id.toString(),
        title: (room.hotel as any).title,
        description: (room.hotel as any).description,
      },
    };
  }
}