import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { Model, Types } from 'mongoose';
import { ReservationDto, ReservationSearchOptions } from './interfaces/reservation.interface';
import { HotelsService } from '../hotels/hotels.service';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
    private readonly hotelsService: HotelsService, // добавляем зависимость от HotelsService
  ) {}

  async addReservation(data: ReservationDto): Promise<Reservation> {
    const newReservation = new this.reservationModel({
      userId: new Types.ObjectId(data.userId),
      hotelId: new Types.ObjectId(data.hotelId),
      roomId: new Types.ObjectId(data.roomId),
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
    });
    return newReservation.save();
  }

  async removeReservation(id: string): Promise<void> {
    const result = await this.reservationModel.findByIdAndDelete(id);
    if (!result) {
      throw new BadRequestException('Бронь с указанным ID не существует');
    }
  }

  async getReservations(filter: ReservationSearchOptions): Promise<any[]> {
    // Получаем броневые записи по userId (фильтрация по бронированиям клиента)
    const reservations = await this.reservationModel.find({
      userId: new Types.ObjectId(filter.userId),
    });

    // Обогащаем каждую бронь дополнительной информацией об отеле и номере
    const enrichedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        let hotelData;
        try {
          hotelData = await this.hotelsService.findHotelById(reservation.hotelId.toString());
        } catch (error) {
          hotelData = null;
        }
        let roomData;
        try {
          roomData = await this.hotelsService.findHotelRoomById(reservation.roomId.toString());
        } catch (error) {
          roomData = null;
        }
        return {
          id: reservation._id,
          startDate: reservation.dateStart,
          endDate: reservation.dateEnd,
          hotel: hotelData
            ? {
                id: hotelData._id,
                title: hotelData.title,
                description: hotelData.description,
              }
            : { id: reservation.hotelId },
          hotelRoom: roomData
            ? {
                id: roomData._id,
                description: roomData.description,
                images: roomData.images,
              }
            : { id: reservation.roomId },
        };
      }),
    );
    return enrichedReservations;
  }

  
}
