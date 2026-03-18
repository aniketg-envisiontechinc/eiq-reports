import { Injectable } from '@nestjs/common';
import { getChatForRequest } from '../common/data-loader';

@Injectable()
export class ChatService {
  async getChat(reportUrl?: string) {
    return getChatForRequest(reportUrl);
  }
}
