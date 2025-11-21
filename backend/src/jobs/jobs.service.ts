import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JobsService {
    constructor(private prisma: PrismaService) { }
}
