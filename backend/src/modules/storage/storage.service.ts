import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(private readonly config: ConfigService) {
        const endpoint = config.get<string>('MINIO_ENDPOINT');
        const port = config.get<string>('MINIO_PORT') || '9000';
        const region = config.get<string>('AWS_REGION') || 'us-east-1';

        if (endpoint) {
            // MinIO / local S3-compatible
            this.client = new S3Client({
                endpoint: `http://${endpoint}:${port}`,
                region,
                credentials: {
                    accessKeyId: config.get<string>('MINIO_ROOT_USER') || 'minioadmin',
                    secretAccessKey: config.get<string>('MINIO_ROOT_PASSWORD') || 'minioadmin',
                },
                forcePathStyle: true,
            });
            this.bucket = config.get<string>('MINIO_BUCKET') || 'careermate-local';
        } else {
            // Real AWS S3
            this.client = new S3Client({
                region,
                credentials: {
                    accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') || '',
                    secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') || '',
                },
            });
            this.bucket = config.get<string>('AWS_S3_BUCKET') || 'careermate-storage';
        }
    }

    async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));
        this.logger.log(`Uploaded ${key} to bucket ${this.bucket}`);
        return key;
    }

    async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
        return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    }
}
