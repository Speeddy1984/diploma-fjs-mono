import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { SearchHotelRoomDto } from './dto/search-hotel-room.dto';
import { Types } from 'mongoose';

@Controller('api/common/hotel-rooms')
export class HotelsCommonController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  async searchHotelRooms(@Query() searchHotelRoomDto: SearchHotelRoomDto) {
    // Извлекаем параметры запроса
    const { hotel, limit = 10, offset = 0, isEnabled } = searchHotelRoomDto;

    const filter: any = {};

    if (hotel) {
      // Если переданная строка соответствует формату ObjectId, используем её
      if (/^[0-9a-fA-F]{24}$/.test(hotel)) {
        try {
          filter.hotel = new Types.ObjectId(hotel);
        } catch (e) {
          console.error('Ошибка преобразования ID:', e);
          throw new BadRequestException('Некорректный идентификатор гостиницы');
        }
      } else {
        // Иначе, считаем, что это поисковый запрос по названию
        const matchedHotels = await this.hotelsService.searchHotels({
          title: hotel,
          limit: 10,
          offset: 0,
        });
        const hotelIds = matchedHotels.map((h: any) => h._id.toString());
        console.log('Matched hotel IDs:', hotelIds);
        const validHotelIds = hotelIds.filter((id: string) => /^[0-9a-fA-F]{24}$/.test(id));
        console.log('Valid hotel IDs:', validHotelIds);
        if (validHotelIds.length > 0) {
          filter.hotel = { $in: validHotelIds.map((id: string) => new Types.ObjectId(id)) };
        }
      }
    }
    // Фильтрация по статусу доступности
    if (typeof isEnabled === 'boolean') {
      filter.isEnabled = isEnabled;
    } else {
      filter.isEnabled = true;
    }

    // Вызываем сервис поиска номеров
    const rooms = await this.hotelsService.searchHotelRooms({
      limit,
      offset,
      hotel: filter.hotel,
      isEnabled: filter.isEnabled,
    });
    console.log('Rooms found:', rooms);

    // Формируем ответ
    return rooms.map((room: any) => ({
      id: room._id,
      description: room.description,
      images: room.images,
      hotel: {
        id: room.hotel?._id || room.hotel,
        title: room.hotel?.title,
      },
    }));
  }

  @Get(':id')
  async getHotelRoomById(@Param('id') id: string) {
    const room = await this.hotelsService.findHotelRoomById(id);
    return {
      id: (room as any)._id,
      description: room.description,
      images: room.images,
      hotel: {
        id: ((room.hotel as any)?._id) || room.hotel,
        title: (room.hotel as any)?.title,
        description: (room.hotel as any)?.description,
      },
    };
  }
}
