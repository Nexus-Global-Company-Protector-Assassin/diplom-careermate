import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error';

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002':
                    // Unique constraint violation
                    status = HttpStatus.CONFLICT;
                    const field = (exception.meta?.target as string[])?.join(', ') ?? 'field';
                    message = `A record with this ${field} already exists`;
                    break;
                case 'P2025':
                    // Record not found
                    status = HttpStatus.NOT_FOUND;
                    message = 'Record not found';
                    break;
                case 'P2003':
                    // Foreign key constraint failed
                    status = HttpStatus.BAD_REQUEST;
                    message = 'Related record not found';
                    break;
                case 'P2014':
                    // Relation violation
                    status = HttpStatus.BAD_REQUEST;
                    message = 'Invalid relation data';
                    break;
                default:
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    message = `Database error: ${exception.code}`;
            }
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided to database';
        }

        const errorBody = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        this.logger.error(
            `[Prisma ${(exception as any).code ?? 'Validation'}] ${request.method} ${request.url} — ${message}`,
            exception.stack,
        );

        response.status(status).json(errorBody);
    }
}
