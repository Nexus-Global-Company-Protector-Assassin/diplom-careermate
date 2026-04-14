import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AgentRunnerService } from '../agent.service';
import { TEST_PROFILES } from './test-profiles.data';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
    console.log('🚀 Starting Agent Eval...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const runner = app.get(AgentRunnerService);

    const results = [];
    let successfulRuns = 0;
    let totalLatency = 0;

    for (const profile of TEST_PROFILES) {
        console.log(`\n================================`);
        console.log(`Running eval for: ${profile.name}`);
        console.log(`================================`);

        try {
            const start = Date.now();
            const result = await runner.runPocFlow({ profileData: profile.data, topVacancies: 1 });
            const latency = Date.now() - start;

            console.log(`✅ Success in ${latency}ms`);
            console.log(`- Detected Level: ${result.analysis.level}`);
            console.log(`- Profile Score: ${result.analysis.score}`);
            console.log(`- Skill Gaps: ${result.analysis.skillGaps.length} found`);
            console.log(`- Matched Vacancy: ${result.vacancies.vacancies[0]?.title ?? 'None'}`);
            console.log(`- Resume Target Role: ${result.resume.targetPosition}`);

            results.push({
                profile: profile.name,
                success: true,
                latencyMs: latency,
                metrics: {
                    level: result.analysis.level,
                    score: result.analysis.score,
                }
            });

            successfulRuns++;
            totalLatency += latency;
        } catch (err) {
            console.error(`❌ Failed: ${(err as Error).message}`);
            results.push({
                profile: profile.name,
                success: false,
                error: (err as Error).message,
            });
        }
    }

    const avgLatency = successfulRuns > 0 ? Math.round(totalLatency / successfulRuns) : 0;

    console.log(`\n================================`);
    console.log(`🏆 Eval Summary`);
    console.log(`================================`);
    console.log(`Total Profiles: ${TEST_PROFILES.length}`);
    console.log(`Success Rate: ${(successfulRuns / TEST_PROFILES.length) * 100}%`);
    console.log(`Average Latency: ${avgLatency}ms`);

    const reportPath = path.join(__dirname, '../../../eval-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Detailed report saved to: eval-report.json`);

    await app.close();
    process.exit(0);
}

bootstrap();
