import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message: string;
        let errors: any[] | undefined;

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object') {
            const res = exceptionResponse as any;
            message = res.message ?? exception.message;
            // class-validator sends array of errors in message field
            if (Array.isArray(res.message)) {
                errors = res.message.map((msg: string) => ({ message: msg }));
                message = 'Validation failed';
            }
        } else {
            message = exception.message;
        }

        const errorBody = {
            statusCode: status,
            message,
            ...(errors ? { errors } : {}),
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        this.logger.warn(`[${status}] ${request.method} ${request.url} — ${message}`);

        response.status(status).json(errorBody);
    }
}
