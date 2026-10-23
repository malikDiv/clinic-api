import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { MedicalRecordService } from '../medical-records/medical-record.service.js';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;
  private readonly primaryModel = 'gemini-3.8-flash';
  private readonly fallbackModel = 'gemini-3.5-flash-lite';

  constructor(private readonly medicalRecordService: MedicalRecordService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 60000 } });
  }

  async generateMedicalSummary(
    recordId: number,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['doctor']);

    const record = await this.medicalRecordService.findWithRelations(recordId);
    if (record.doctor.user.id !== currentUser.id) {
      throw new ForbiddenException('لا تملك صلاحية توليد ملخص لسجل لا يخصك');
    }

    const prompt = `أنت مساعد طبي داخل نظام إدارة عيادات.

ملاحظات الطبيب عن الزيارة:

${record.notes}

المطلوب:

- استخرج ملخصاً طبياً موجزاً ومنظماً باللغة العربية.
- استخدم المعلومات الواردة في الملاحظات فقط.
- لا تضف تشخيصاً أو دواءً أو معلومة غير موجودة.
- لا تخترع أي قيمة.
- إذا كانت الملاحظات غير كافية، اذكر ذلك صراحة.
- اجعل الملخص في حدود 150 كلمة.`;

    const response = await this.generateWithRetry(prompt, {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      temperature: 0.3,
      maxOutputTokens: 400,
    });

    const summary = response.text?.trim();
    if (!summary) {
      throw new InternalServerErrorException('فشل توليد الملخص الطبي');
    }

    return { recordId, summary };
  }

  private async generateWithRetry(prompt: string, config: any) {
    try {
      return await this.generateUsingModel(this.primaryModel, prompt, config);
    } catch (error) {
      if (this.getErrorStatus(error) !== 503) {
        throw error;
      }

      for (const delay of [3000, 6000]) {
        await this.sleep(delay);
        try {
          return await this.generateUsingModel(
            this.primaryModel,
            prompt,
            config,
          );
        } catch (retryError) {
          if (this.getErrorStatus(retryError) !== 503) {
            throw retryError;
          }
        }
      }

      try {
        return await this.generateUsingModel(
          this.fallbackModel,
          prompt,
          config,
        );
      } catch {
        throw new InternalServerErrorException(
          'خدمة الذكاء الاصطناعي غير متاحة حالياً، حاول لاحقاً',
        );
      }
    }
  }

  private async generateUsingModel(model: string, prompt: string, config: any) {
    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: { ...config },
    });
    return response;
  }

  private getErrorStatus(error: any): number | undefined {
    return error?.status ?? error?.code ?? error?.response?.status;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
