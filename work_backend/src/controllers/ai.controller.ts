// src/ai/controllers/ai.controller.ts (sửa nhỏ để match service)
import { Controller, Post, Body, Req } from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ChatMessageDto } from '../../dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: AuthenticatedRequest, @Body() dto: ChatMessageDto) {
    const reply = await this.aiService.handleChat(req.user!.userId, dto.message);
    return { reply };
  }

  @Post('suggest')
  async suggest(@Body('taskId') taskId: string) {
    const reply = await this.aiService.suggestAssignment(taskId);
    return { reply };
  }

  @Post('risk')
  async risk(@Body('taskId') taskId: string) {
    const reply = await this.aiService.predictTaskRisk(taskId);
    return { reply };
  }
}