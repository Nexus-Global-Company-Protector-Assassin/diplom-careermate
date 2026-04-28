import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { MlRankingService } from './ml-ranking.service';
import { PreferenceVector } from '../vacancies/user-preferences.service';

const emptyPrefs = (): PreferenceVector => ({
    archetype: {}, salary_band: {}, work_format: {}, seniority: {},
});

const makeVacancy = (id: string) => ({
    id,
    title: 'Senior Backend Developer',
    descriptionPreview: 'node.js api',
    salaryFrom: 60000,
    salaryTo: 80000,
    schedule: 'Remote',
    location: null,
    skills: ['Node.js', 'TypeScript'],
});

const makeMlResponse = (ranked: Array<{ vacancy_id: string; score: number }>) => ({
    data: { ranked, model_version: 'stub-v0', is_shadow: false },
});

describe('MlRankingService', () => {
    let service: MlRankingService;
    let http: { post: jest.Mock };
    let config: { get: jest.Mock };

    beforeEach(async () => {
        http = { post: jest.fn() };
        config = { get: jest.fn() };

        const module = await Test.createTestingModule({
            providers: [
                MlRankingService,
                { provide: HttpService, useValue: http },
                { provide: ConfigService, useValue: config },
            ],
        }).compile();

        service = module.get(MlRankingService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('isEnabled / isShadowMode', () => {
        it('returns false when ML_SERVICE_URL is not set', () => {
            config.get.mockReturnValue(undefined);
            expect(service.isEnabled()).toBe(false);
        });

        it('returns true when ML_SERVICE_URL is set', () => {
            config.get.mockImplementation((key: string) =>
                key === 'ML_SERVICE_URL' ? 'http://ml:3003' : undefined,
            );
            expect(service.isEnabled()).toBe(true);
        });

        it('shadow mode is on by default (ML_SHADOW_MODE not "false")', () => {
            config.get.mockImplementation((_key: string, def?: string) => def);
            expect(service.isShadowMode()).toBe(true);
        });

        it('shadow mode is off when ML_SHADOW_MODE=false', () => {
            config.get.mockImplementation((key: string) =>
                key === 'ML_SHADOW_MODE' ? 'false' : undefined,
            );
            expect(service.isShadowMode()).toBe(false);
        });
    });

    describe('rank', () => {
        it('returns empty Map when ml-service is not enabled', async () => {
            config.get.mockReturnValue(undefined);
            const result = await service.rank('profile-1', [makeVacancy('v1')], emptyPrefs());
            expect(result.size).toBe(0);
            expect(http.post).not.toHaveBeenCalled();
        });

        it('returns empty Map when vacancy list is empty', async () => {
            config.get.mockReturnValue('http://ml:3003');
            const result = await service.rank('profile-1', [], emptyPrefs());
            expect(result.size).toBe(0);
            expect(http.post).not.toHaveBeenCalled();
        });

        it('returns empty Map in shadow mode even when ml-service responds', async () => {
            config.get.mockImplementation((key: string, def?: string) => {
                if (key === 'ML_SERVICE_URL') return 'http://ml:3003';
                return def ?? 'true'; // ML_SHADOW_MODE defaults to "true"
            });
            http.post.mockReturnValue(of(makeMlResponse([{ vacancy_id: 'v1', score: 0.9 }])));

            const result = await service.rank('profile-1', [makeVacancy('v1')], emptyPrefs());
            expect(result.size).toBe(0);
        });

        it('returns scores from ml-service when shadow mode is off', async () => {
            config.get.mockImplementation((key: string) => {
                if (key === 'ML_SERVICE_URL') return 'http://ml:3003';
                if (key === 'ML_SHADOW_MODE') return 'false';
                return undefined;
            });
            http.post.mockReturnValue(
                of(makeMlResponse([
                    { vacancy_id: 'v1', score: 0.91 },
                    { vacancy_id: 'v2', score: 0.74 },
                ])),
            );

            const result = await service.rank('profile-1', [makeVacancy('v1'), makeVacancy('v2')], emptyPrefs());
            expect(result.size).toBe(2);
            expect(result.get('v1')).toBeCloseTo(0.91);
            expect(result.get('v2')).toBeCloseTo(0.74);
        });

        it('returns empty Map when ml-service call throws', async () => {
            config.get.mockImplementation((key: string) => {
                if (key === 'ML_SERVICE_URL') return 'http://ml:3003';
                if (key === 'ML_SHADOW_MODE') return 'false';
                return undefined;
            });
            http.post.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

            const result = await service.rank('profile-1', [makeVacancy('v1')], emptyPrefs());
            expect(result.size).toBe(0);
        });

        it('sends correct payload to ml-service', async () => {
            config.get.mockImplementation((key: string) => {
                if (key === 'ML_SERVICE_URL') return 'http://ml:3003';
                if (key === 'ML_SHADOW_MODE') return 'false';
                return undefined;
            });
            http.post.mockReturnValue(of(makeMlResponse([])));
            const prefs: PreferenceVector = { archetype: { Backend: 0.8 }, salary_band: {}, work_format: {}, seniority: { senior: 0.9 } };

            await service.rank('profile-42', [makeVacancy('v1')], prefs, 10, 5);

            expect(http.post).toHaveBeenCalledWith(
                'http://ml:3003/ml/rank',
                expect.objectContaining({
                    profile_id: 'profile-42',
                    profile_features: prefs,
                    total_interactions: 10,
                    positive_interactions: 5,
                    candidates: expect.arrayContaining([
                        expect.objectContaining({ id: 'v1' }),
                    ]),
                }),
                expect.objectContaining({ timeout: 3000 }),
            );
        });
    });
});
