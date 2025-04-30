import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { ReservationService } from './reservation.service';
import { ReservationClientController } from './reservation.client.controller';
import { ReservationManagerController } from './reservation.manager.controller';
import { HotelsModule } from '../hotels/hotels.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    HotelsModule,
  ],
  providers: [ReservationService],
  controllers: [ReservationClientController, ReservationManagerController],
})
export class ReservationModule {}
