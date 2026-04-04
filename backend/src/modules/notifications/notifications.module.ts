import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailNotification } from './entities/email-notification.entity';
import { User } from '../users/entities/user.entity';
import { EmailProcessor, EMAIL_QUEUE } from './processors/email.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailNotification, User]),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
