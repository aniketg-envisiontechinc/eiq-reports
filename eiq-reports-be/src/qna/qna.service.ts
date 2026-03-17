import { Injectable } from '@nestjs/common';
import { getQnaForRequest } from '../common/data-loader';

@Injectable()
export class QnaService {
  async getQna(reportUrl?: string) {
    const report = await getQnaForRequest(reportUrl);

    // Flatten all question_details into a list for easy table rendering
    const flatQuestions: any[] = [];
    (report.questions || []).forEach((participant: any) => {
      (participant.question_details || []).forEach((qd: any) => {
        flatQuestions.push({
          participantName: participant.name,
          participantEmail: participant.email,
          question: qd.question,
          questionId: qd.question_id,
          answer: qd.answer || null,
          status: qd.question_status,
          createTime: qd.create_time,
          isAnswered: !!qd.answer,
          answerDetails: qd.answer_details
            ? qd.answer_details.map((ad: any) => ({
                answeredBy: ad.name,
                answeredByEmail: ad.email,
                content: ad.content,
                answeredAt: ad.create_time,
                type: ad.type,
              }))
            : [],
        });
      });
    });

    const totalQuestions = flatQuestions.length;
    const answeredCount = flatQuestions.filter((q) => q.isAnswered).length;
    const unansweredCount = totalQuestions - answeredCount;

    return {
      eventId: report.id,
      startTime: report.start_time,
      totalQuestions,
      answeredCount,
      unansweredCount,
      questions: flatQuestions,
    };
  }
}
