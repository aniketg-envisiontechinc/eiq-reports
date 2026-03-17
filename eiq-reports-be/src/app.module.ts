import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttendeesModule } from './attendees/attendees.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PollsModule } from './polls/polls.module';
import { QnaModule } from './qna/qna.module';
import { MetaModule } from './meta/meta.module';

@Module({
  imports: [DashboardModule, AttendeesModule, FeedbackModule, PollsModule, QnaModule, MetaModule],
})
export class AppModule {}
