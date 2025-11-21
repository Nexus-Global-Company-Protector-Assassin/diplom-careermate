import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  async createProfile(userId: string, profileData: any) {
    return this.prisma.profile.create({
      data: {
        ...profileData,
        userId,
      },
    });
  }

  async updateProfile(userId: string, profileData: any) {
    return this.prisma.profile.update({
      where: { userId },
      data: profileData,
    });
  }

  async deleteProfile(userId: string) {
    return this.prisma.profile.delete({
      where: { userId },
    });
  }
}