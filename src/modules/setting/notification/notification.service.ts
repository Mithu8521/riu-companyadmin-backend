// src/notification/notification.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebNotificationEntity } from './entity/notification.entity';
import { SocketService } from '@app/modules/socket/socket.service';
import { ReportingModuleService } from '@app/modules/reporting_module/reporting_module.service';
import { CommonUtilityService } from '@app/utils/common/common-utility/common-utility.service';
import { toDate } from 'date-fns';
// import { WebNotificationEntity } from './notification.entity';
// import { SocketService } from '../socket/socket.service';
// import { ReportingModuleService } from '../reporting_module/reporting_module.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(WebNotificationEntity)
    private readonly notificationRepo: Repository<WebNotificationEntity>,
    private readonly socketService: SocketService,
    private readonly reportingModuleService: ReportingModuleService, // use existing mail helper
  ) { }


  async createForChat(
    chatSaved: any,
    roomName: string,
    participants: Array<{ id: number; name?: string; email?: string }>,
    mailContext: any = {},
  ) {
    if (!chatSaved || !roomName || !Array.isArray(participants)) {
      throw new BadRequestException('Invalid parameters for createForChat');
    }

    const mentions = chatSaved.mentions ?? { isAll: false, userIds: [] };
    let recipientIds: number[] = [];

    if (mentions.isAll) {
      recipientIds = participants.map(p => Number(p.id));
    } else if (Array.isArray(mentions.userIds) && mentions.userIds.length > 0) {
      recipientIds = Array.from(new Set(mentions.userIds.map((id: any) => Number(id))));
    } else {
      recipientIds = participants.map(p => Number(p.id));
    }

    const senderId = Number(chatSaved.senderId);
    recipientIds = recipientIds.filter(id => id !== senderId);

    if (recipientIds.length === 0) return [];

    // Tagged participants (for email / extra logic)
    const taggedParticipants = participants.filter(p =>
      mentions.isAll
        ? Number(p.id) !== senderId // everyone except sender
        : mentions.userIds?.map(Number).includes(Number(p.id)),
    );

    // 1️⃣ raw content with @User(11)
    const rawContent: string = chatSaved.content ?? chatSaved.text ?? '';

    // 2️⃣ build id -> name map from participants
    const idToName = new Map<number, string>();
    for (const p of participants) {
      if (!p?.id) continue;
      const nm = (p.name || '').trim();
      idToName.set(
        Number(p.id),
        nm || `User ${p.id}`, // fallback
      );
    }

    // 3️⃣ plainBody: replace @User(11) → "Full Name" (for text-only uses)
    const plainBody = rawContent.replace(/@User\((\d+)\)/g, (_m, idStr) => {
      const id = Number(idStr);
      return idToName.get(id) ?? `User ${id}`;
    });

    // 4️⃣ htmlBody: replace @User(11) → <span class="tagged-name">Full Name</span>
    let htmlBody = rawContent.replace(/@User\((\d+)\)/g, (_m, idStr) => {
      const id = Number(idStr);
      const name = idToName.get(id) ?? `User ${id}`;
      return `<span class="tagged-name">${name}</span>`;
    });

    // Optionally highlight "everyone" if isAll
    if (mentions.isAll) {
      htmlBody = htmlBody.replace(
        /\beveryone\b/gi,
        `<span class="tagged-everyone">Everyone</span>`,
      );
    }

    const now = new Date();
    recipientIds = recipientIds.filter(id => {
    const userIdStr = String(id);
    const isInRoom = this.socketService.isUserInRoom(userIdStr, roomName);
    return !isInRoom; 
  });
    const entities = recipientIds.map((rid) =>
      this.notificationRepo.create({
        recipientUserId: rid,
        senderId: chatSaved.senderId ?? null,
        senderName: mailContext?.senderName ?? null,
        type: mailContext?.type ?? 'chat',
        title: mailContext?.subject ?? `New message from ${mailContext?.senderName}`,

        // ⬇️ SAVE HIGHLIGHTED HTML HERE
        body: htmlBody,

        metadata: {
          chatId: chatSaved.id,
          questionId: chatSaved.questionId,
          financialYearId: chatSaved.financialYearId,
          roomName,
          rawContent,
          plainBody,
          mentions,
          participants,
          taggedParticipants,
          ...mailContext,
          period: CommonUtilityService.formateDateIntoPeriods(
            chatSaved.fromDate,
            chatSaved.toDate,
          ),
        },
        isRead: false,
        isDelivered: false,
        channel: mailContext?.channel ?? { email: true, socket: true },
        createdAt: now,
        updatedAt: now,
      }),
    );

    const savedNotifications = await this.notificationRepo.save(entities);

    // ----- 3. deliver: sockets first, then email fallback -----
    for (const notif of savedNotifications) {
      const userIdStr = String(notif.recipientUserId);

      const isInRoom = this.socketService.isUserInRoom(userIdStr, roomName);

      const payload = {
        notificationId: notif.id,
        title: notif.title,
       
        body: notif.metadata?.plainBody ?? plainBody,
        bodyHtml: notif.body,     
        metadata: notif.metadata,
        createdAt: notif.createdAt,
      };
      if (!isInRoom) {
        try {

          await this.socketService.sendNotificationToUser(
            userIdStr,
            'chatNotification',
            payload,
          );
          await this.socketService.sendNotificationToUser(
            userIdStr,
            `notification${userIdStr}`,
            payload,
          );

          notif.isDelivered = true;
          await this.notificationRepo.save(notif);
          continue;
        } catch (err) {
          this.logger.debug(`Socket send failed for ${userIdStr}: ${err?.message}`);
        }
      } else {
        // notif.isDelivered = true;
        // await this.notificationRepo.save(notif);
        continue;
      }



      // ----- email fallback -----
      try {
        if (notif.channel?.email) {
          const recipient = participants.find(
            p => Number(p.id) === Number(notif.recipientUserId),
          );

          if (!recipient?.email) {
            this.logger.warn(
              `No email for user ${notif.recipientUserId}, skipping mail`,
            );
            continue;
          }

          const mailData = {
            subject: notif.title,
            content: notif.body,
            text: notif.metadata?.plainBody ?? plainBody,
            ...notif.metadata,
            mentionsMeta: mentions,
            mentions: taggedParticipants,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
          };

          await this.reportingModuleService.sendChatToMail(mailData, {
            id: Number(notif.senderId),
            name: notif.senderName,
          });

          notif.isDelivered = true;
          await this.notificationRepo.save(notif);
        }
      } catch (err) {
        this.logger.warn(
          `Failed to send email for notification ${notif.id} to ${notif.recipientUserId}`,
          err,
        );
      }
    }

    return savedNotifications;
  }



  async getNotificationsForUser(userId: number, limit = 50, offset = 0) {
    const [rows, count] = await this.notificationRepo.findAndCount({
      where: { recipientUserId: Number(userId) },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // map shape suitable for frontend
    return {
      total: count,
      data: rows.map(r => ({
        id: r.id,
        title: r.title,
        body: r.body,
        metadata: r.metadata,
        isRead: r.isRead,
        isDelivered: r.isDelivered,
        createdAt: r.createdAt,
      })),
    };
  }

  async markAsRead(notificationId: number, userId: number) {
    const rec = await this.notificationRepo.findOne({ where: { id: Number(notificationId), recipientUserId: Number(userId) } });
    if (!rec) return false;
    rec.isRead = true;
    await this.notificationRepo.save(rec);
    return true;
  }

  async markAllRead(userId: number) {
    await this.notificationRepo.createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('recipientUserId = :userId', { userId: Number(userId) })
      .andWhere('isRead = false')
      .execute();
    return true;
  }

  /**
 * Permanently delete all notifications for a user.
 * Returns true on success.
 */
  async clearAll(userId: number) {
    if (!userId) return false;

    try {
      await this.notificationRepo.createQueryBuilder()
        .delete()
        .from(WebNotificationEntity)
        .where('recipientUserId = :userId', { userId: Number(userId) })
        .execute();

      return true;
    } catch (err) {
      this.logger.warn(`Failed to clear notifications for user ${userId}`, err);
      return false;
    }
  }

}
