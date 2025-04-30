import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SupportRequest, SupportRequestDocument } from './schemas/support-request.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetChatListParams } from './interfaces/support-request.interface';
import { SupportGateway } from './support.gateway';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportRequest.name) private supportRequestModel: Model<SupportRequestDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private eventEmitter: EventEmitter2,
    private readonly supportGateway: SupportGateway, // инъекция шлюза
  ) {}

  // Сервис для клиента
  async createSupportRequest(data: { user: string; text: string }): Promise<SupportRequestDocument> {
    const newRequest = new this.supportRequestModel({
      user: new Types.ObjectId(data.user),
      messages: [{
        author: new Types.ObjectId(data.user),
        text: data.text,
      }],
      isActive: true,
    });
    return newRequest.save();
  }

  async markMessagesAsReadClient(params: { user: string; supportRequest: string; createdBefore: Date }): Promise<void> {
    // Обновляем все сообщения, которые были отправлены не этим пользователем и не прочитаны
    await this.supportRequestModel.updateOne(
      { _id: new Types.ObjectId(params.supportRequest) },
      {
        $set: {
          'messages.$[elem].readAt': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.author': { $ne: new Types.ObjectId(params.user) }, 'elem.sentAt': { $lte: params.createdBefore } }],
      },
    );
  }

  async getUnreadCountClient(supportRequest: string, user: string): Promise<number> {
    const request = await this.supportRequestModel.findById(supportRequest);
    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }
    // Считаем сообщения, отправленные не этим пользователем и без readAt
    return request.messages.filter(
      msg => msg.author.toString() !== user && !msg.readAt,
    ).length;
  }

  // Сервис для менеджера
  async markMessagesAsReadEmployee(params: { user: string; supportRequest: string; createdBefore: Date }): Promise<void> {
    // Обновляем сообщения, отправленные пользователем (клиентом), которые не прочитаны
    await this.supportRequestModel.updateOne(
      { _id: new Types.ObjectId(params.supportRequest) },
      {
        $set: {
          'messages.$[elem].readAt': new Date(),
        },
      },
      {
        arrayFilters: [
          {
            // НЕ авторизованный менеджер, т.е. автор = клиент
            'elem.author': { $ne: new Types.ObjectId(params.user) },
            'elem.sentAt': { $lte: params.createdBefore },
          },
        ],
      },
    );
  }

  async getUnreadCountEmployee(supportRequest: string, user: string): Promise<number> {
    const request = await this.supportRequestModel.findById(supportRequest);
    if (!request) throw new NotFoundException('Запрос не найден');
    // Считаем все сообщения, автором которых НЕ является менеджер, и которые ещё не прочитаны
    return request.messages.filter(
      msg => msg.author.toString() !== user && !msg.readAt
    ).length;
  }

  async closeRequest(supportRequest: string): Promise<void> {
    await this.supportRequestModel.findByIdAndUpdate(supportRequest, { isActive: false });
  }

  async getSupportRequests(filter: { user?: string; isActive?: boolean; limit?: number; offset?: number }): Promise<SupportRequestDocument[]> {
    const query: any = {};
    if (filter.user) {
      query.user = new Types.ObjectId(filter.user);
    }
    if (typeof filter.isActive === 'boolean') {
      query.isActive = filter.isActive;
    }
  
    const results = await this.supportRequestModel
      .find(query)
      .populate('user', 'name email contactPhone')
      .limit(filter.limit ?? 10)
      .skip(filter.offset ?? 0)
      .exec();
  
    console.log('Найдено запросов:', results.length);
    console.log('getSupportRequests: ', results);
    return results;
  }

  async getMessages(supportRequest: string): Promise<Message[]> {
    const request = await this.supportRequestModel.findById(supportRequest);
    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }
    return request.messages;
  }

  async sendMessage(data: { author: string; supportRequest: string; text: string }): Promise<any> {
    // 1) Найти и проверить запрос
    const reqDoc = await this.supportRequestModel.findById(data.supportRequest);
    if (!reqDoc) throw new NotFoundException('Запрос не найден');

    // 2) Добавить новое сообщение
    reqDoc.messages.push({
      author: new Types.ObjectId(data.author),
      text: data.text,
      sentAt: new Date(),
    } as any);
    await reqDoc.save();

    // 3) Перезагрузить полностью с populate, чтобы достать только что добавленное сообщение
    const updated = await this.supportRequestModel
      .findById(data.supportRequest)
      .populate('messages.author', 'name role')
      .exec();

      if (!updated) {
        throw new NotFoundException('Запрос после сохранения не найден');
      }
      
      const raw = updated.messages[updated.messages.length - 1] as any;
      
      const result = {
        id: (raw._id as Types.ObjectId).toString(),
        text: raw.text as string,
        createdAt: raw.sentAt as Date,
        readAt: raw.readAt as Date | null,
        author: {
          id: (raw.author._id as Types.ObjectId).toString(),
          name: raw.author.name as string,
          role: raw.author.role as string,
        },
      };

    // 5) Разослать по WebSocket тем, кто подписан на этот чат
    this.supportGateway.broadcastNewMessage(data.supportRequest, result);

    return result;
  }

  subscribe(handler: (supportRequest: SupportRequest, message: Message) => void): () => void {
    this.eventEmitter.on('support.message', handler);
    return () => this.eventEmitter.off('support.message', handler);
  }

  async getSupportRequestById(id: string): Promise<SupportRequestDocument> {
    const supportReq = await this.supportRequestModel
      .findById(id)
      .populate('user', 'name email contactPhone')
      .populate('messages.author', 'name role');
    if (!supportReq) {
      throw new NotFoundException('Запрос не найден');
    }
    return supportReq;
  }
}
