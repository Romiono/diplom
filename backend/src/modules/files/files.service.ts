import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

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

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    // Create upload directory structure (year/month)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dirPath = path.join(this.uploadDir, String(year), month);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, filename);

    // Optimize image with sharp
    await sharp(file.buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // Return relative path
    return `/${year}/${month}/${filename}`;
  }

  async deleteImage(relativePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, relativePath);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File may not exist, ignore error
      console.error('Error deleting file:', error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${this.maxFileSize} bytes`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }
}
