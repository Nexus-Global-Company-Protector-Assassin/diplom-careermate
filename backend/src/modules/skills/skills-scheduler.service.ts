import { Injectable } from '@nestjs/common';

export interface SchedulerStatus {
    lastRun: string | null;
    status: 'idle' | 'running' | 'failed';
    consecutiveFailures: number;
}

@Injectable()
export class SkillsSchedulerService {
    getStatus(): SchedulerStatus {
        return { lastRun: null, status: 'idle', consecutiveFailures: 0 };
    }
}
