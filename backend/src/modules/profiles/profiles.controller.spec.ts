import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { NotFoundException } from '@nestjs/common';

// ─────────────────────────────── constants ───────────────────────────────────
const USER_ID = 'user-uuid-123';
const mockUser = { userId: USER_ID, email: 'test@test.com' };

const mockProfile = {
    id: 'profile-uuid-456',
    userId: USER_ID,
    fullName: 'Иван Иванов',
    desiredPosition: 'Frontend Developer',
    skills: ['React'],
    analysisResults: [],
};

// ─────────────────────────────── mock service ────────────────────────────────
const mockProfilesService = {
    getProfile: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
};

// ═════════════════════════════════════════════════════════════════════════════
describe('ProfilesController', () => {
    let controller: ProfilesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfilesController],
            providers: [
                { provide: ProfilesService, useValue: mockProfilesService },
            ],
        })
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ProfilesController>(ProfilesController);
    });

    afterEach(() => jest.clearAllMocks());

    // ─────────────────────────────── getProfile ──────────────────────────────
    describe('GET /profiles/me', () => {
        it('should return the user profile', async () => {
            mockProfilesService.getProfile.mockResolvedValue(mockProfile);

            const result = await controller.getProfile();

            expect(result).toEqual(mockProfile);
            expect(mockProfilesService.getProfile).toHaveBeenCalledWith(undefined);
        });

        it('should propagate NotFoundException from service', async () => {
            mockProfilesService.getProfile.mockRejectedValue(
                new NotFoundException('Profile not found'),
            );

            await expect(controller.getProfile()).rejects.toThrow(NotFoundException);
        });
    });

    // ─────────────────────────────── createProfile ───────────────────────────
    describe('POST /profiles/me', () => {
        it('should create/upsert a profile and return it', async () => {
            mockProfilesService.createProfile.mockResolvedValue(mockProfile);
            const dto = { fullName: 'Иван Иванов', desiredPosition: 'Frontend Developer' };

            const result = await controller.createProfile(dto as any);

            expect(result).toEqual(mockProfile);
            expect(mockProfilesService.createProfile).toHaveBeenCalledWith(undefined, dto);
        });

        it('should pass the full DTO to service', async () => {
            mockProfilesService.createProfile.mockResolvedValue(mockProfile);
            const dto = {
                fullName: 'Test',
                skills: ['React', 'TypeScript'],
                experienceYears: 3,
            };

            await controller.createProfile(dto as any);

            expect(mockProfilesService.createProfile).toHaveBeenCalledWith(undefined, dto);
        });
    });

    // ─────────────────────────────── updateProfile ───────────────────────────
    describe('PUT /profiles/me', () => {
        it('should update profile and return updated data', async () => {
            const updated = { ...mockProfile, fullName: 'Пётр Петров' };
            mockProfilesService.updateProfile.mockResolvedValue(updated);
            const dto = { fullName: 'Пётр Петров' };

            const result = await controller.updateProfile(dto as any);

            expect(result.fullName).toBe('Пётр Петров');
            expect(mockProfilesService.updateProfile).toHaveBeenCalledWith(undefined, dto);
        });

        it('should propagate NotFoundException when profile not found', async () => {
            mockProfilesService.updateProfile.mockRejectedValue(
                new NotFoundException('Profile not found. Create a profile first.'),
            );

            await expect(
                controller.updateProfile({ fullName: 'Test' } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─────────────────────────────── deleteProfile ───────────────────────────
    describe('DELETE /profiles/me', () => {
        it('should delete profile and return success message', async () => {
            mockProfilesService.deleteProfile.mockResolvedValue({
                message: 'Profile deleted successfully',
            });

            const result = await controller.deleteProfile();

            expect(result).toEqual({ message: 'Profile deleted successfully' });
            expect(mockProfilesService.deleteProfile).toHaveBeenCalledWith(undefined);
        });

        it('should propagate NotFoundException when profile not found', async () => {
            mockProfilesService.deleteProfile.mockRejectedValue(
                new NotFoundException('Profile not found'),
            );

            await expect(controller.deleteProfile()).rejects.toThrow(NotFoundException);
        });
    });
});
