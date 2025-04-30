import { Body, Controller, Get, Param, Post, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkMessagesAsReadDto } from './dto/mark-messages-as-read.dto';

@Controller('api/common/support-requests')
@UseGuards(AuthenticatedGuard) // Дополнительная проверка по ролям будет вручную
export class SupportCommonController {
  constructor(private readonly supportService: SupportService) {}

  // Получение истории сообщений из обращения
  @Get(':id/messages')
  async getMessages(@Param('id') supportRequestId: string, @Req() req: Request) {
    const supportReq = await this.supportService.getSupportRequestById(supportRequestId);
    
    // Сравниваем id (преобразуем в строки)
    if (
      req.user &&
      (req.user as any)['role'] === 'client' &&
      (req.user as any)['_id'].toString() !== (supportReq.user as any)._id.toString()
    ) {
      throw new ForbiddenException('Доступ запрещен');
    }
    
    return supportReq.messages.map(msg => ({
      id: (msg as any)._id.toString(),
      createdAt: (msg as any).sentAt,
      text: msg.text,
      readAt: msg.readAt,
      author: {
        id: (msg.author as any)._id.toString(),
        name: (msg.author as any).name,
        role: (msg.author as any).role,
      },
    }));
  }

   // Отправка сообщения
   @Post(':id/messages')
   async sendMessage(
     @Param('id') supportRequestId: string,
     @Body() dto: SendMessageDto,
     @Req() req: Request,
   ) {
     // проверяем доступ, например для клиента:
     const supportReq = await this.supportService.getSupportRequestById(supportRequestId);
     if ((req.user as any).role === 'client' &&
         (req.user as any)._id.toString() !== (supportReq.user as any)._id.toString()) {
       throw new ForbiddenException('Доступ запрещён');
     }
 
     const authorId = (req.user as any)._id.toString();
     return this.supportService.sendMessage({
       author: authorId,
       supportRequest: supportRequestId,
       text: dto.text,
     });
   }
}
