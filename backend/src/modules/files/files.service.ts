import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class FilesService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('app.upload.dir');
    this.maxFileSize = this.configService.get<number>('app.upload.maxFileSize');
    this.allowedMimeTypes = this.configService.get<string[]>(
      'app.upload.allowedMimeTypes',
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<{ path: string; mimeType: string }> {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected || !this.allowedMimeTypes.includes(detected.mime)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${this.maxFileSize} bytes`,
      );
    }

    const ext = MIME_TO_EXT[detected.mime] ?? '.jpg';
    const filename = `${uuidv4()}${ext}`;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dirPath = path.join(this.uploadDir, String(year), month);

    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, filename);

    try {
      await sharp(file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(filePath);
    } catch {
      throw new BadRequestException('Invalid or corrupted image data');
    }

    return {
      path: `/uploads/${year}/${month}/${filename}`,
      mimeType: detected.mime,
    };
  }

  async deleteImage(relativePath: string): Promise<void> {
    const resolved = path.resolve(this.uploadDir, relativePath);
    const base = path.resolve(this.uploadDir);
    if (!resolved.startsWith(base + path.sep)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      await fs.unlink(resolved);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
