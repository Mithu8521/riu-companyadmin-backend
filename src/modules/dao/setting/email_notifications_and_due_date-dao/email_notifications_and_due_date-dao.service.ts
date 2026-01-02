import { QuestionDueDateEntity } from '@modules/setting/email_notifications_and_due_date/entities/email_notifications_and_due_date.entity';
import { EmailNotificationsEntity } from '@modules/setting/email_notifications_and_due_date/entities/emial_notifications.entity';
import { Injectable } from '@nestjs/common';
import { EmailNotificationsStatus, NotificationsTypeEnum, QuestionFrequencyType } from '@utils/enums/Status';
import { Between, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class EmailNotificationsAndDueDateDaoService {

  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  async saveQuestionDueDate(data: Partial<QuestionDueDateEntity>) {
    const repo = this.getRepo(QuestionDueDateEntity);
    const date = repo.create(data);
    return await repo.save(date);
  }

  async saveNotification(data: Partial<EmailNotificationsEntity>) {
    const repo = this.getRepo(EmailNotificationsEntity);
    const date = repo.create(data);
    return await repo.save(date);
  }

  async findExistingQuestionDueDateByPeriodDates(
    userId: number,
    financialYearId: number,
    questionFrequencyType: QuestionFrequencyType,
    fromDate: string,
    toDate: string
  ): Promise<QuestionDueDateEntity | null> {
    try {
      const repo = this.getRepo(QuestionDueDateEntity);
      const existingConfig = await repo
        .createQueryBuilder('config')
        .where('config.userId = :userId', { userId })
        .andWhere('config.financialYearId = :financialYearId', { financialYearId })
        .andWhere('config.questionFrequencyType = :questionFrequencyType', { questionFrequencyType })
        .andWhere("JSON_EXTRACT(config.periodRecord, '$.fromDate') = :fromDate", {
          fromDate: fromDate
        })
        .andWhere("JSON_EXTRACT(config.periodRecord, '$.toDate') = :toDate", {
          toDate: toDate
        })
        .getOne() as QuestionDueDateEntity | null;

      return existingConfig;
    } catch (error) {
      console.error('Error finding existing question due date by period dates:', error);
      return null;
    }
  }

  async updateQuestionDueDate(
    id: number,
    updateData: Partial<QuestionDueDateEntity>
  ): Promise<QuestionDueDateEntity> {
    try {
      const repo = this.getRepo(QuestionDueDateEntity);
      await repo.update(id, updateData);
      const updatedConfig = await repo.findOneBy({
        id,
      }) as QuestionDueDateEntity | null;

      if (!updatedConfig) {
        throw new Error(`QuestionDueDateEntity with id ${id} not found after update`);
      }

      return updatedConfig;
    } catch (error) {
      console.error('Error updating question due date:', error);
      throw error;
    }
  }

  async deleteNotificationsByDueDateConfigId(dueDateConfigId: number): Promise<void> {
    try {
      const repo = this.getRepo(EmailNotificationsEntity);
      await repo.delete({
        dueDateConfigId,
      });
      console.log(`Deleted all notifications for dueDateConfigId: ${dueDateConfigId}`);
    } catch (error) {
      console.error('Error deleting notifications by dueDateConfigId:', error);
      throw error;
    }
  }

  async deleteAllDataByFinancialYear(financialYearId: number): Promise<void> {
    try {
      const repo = this.getRepo(QuestionDueDateEntity);
      await repo.delete({ financialYearId });
      const notificationRepo = this.getRepo(EmailNotificationsEntity);
      await notificationRepo.delete({ financialYearId });
    } catch (error) {
      console.error('Error deleting data by financialYearId:', error);
      throw error;
    }
  }

  async deleteAllNotificationsDataByFinancialYearId(financialYearId: number): Promise<void> {
    try {
      const repo = this.getRepo(EmailNotificationsEntity);
      await repo.delete({ financialYearId, status: EmailNotificationsStatus.PENDING });
    } catch (error) {
      console.error('Error deleting data by financialYearId:', error);
      throw error;
    }
  }

  async getEmailDueDateRemindersByFinancialYear(
    financialYearId: number,
    notificationsType?: NotificationsTypeEnum
  ) {
    try {
      const repo = this.getRepo(QuestionDueDateEntity);

      const query = repo
        .createQueryBuilder('dueDate')
        .leftJoinAndSelect('dueDate.notifications', 'notification')
        .where('dueDate.financialYearId = :financialYearId', { financialYearId })
        .orderBy('dueDate.createdAt', 'DESC');

      if (notificationsType) {
        query.andWhere('notification.notificationsType = :notificationsType', {
          notificationsType,
        });
      }

      const results = await query.getMany();

      return results.map((dueDate) => {
        if (notificationsType) {
          return {
            ...dueDate,
            notifications: dueDate.notifications.map((notification) => ({
              id: notification.id,
              notificationsType: notification.notificationsType,
              notificationsDateTime: notification.notificationsDateTime,
              status: notification.status,
              recipientEmailsStautsId: notification.recipientEmailsStautsId,
            })),
          };
        } else {
          return {
            ...dueDate,
            emailsByType: dueDate.notifications.reduce((acc, notification) => {
              if (!acc[notification.notificationsType]) {
                acc[notification.notificationsType] = [];
              }
              acc[notification.notificationsType].push({
                id: notification.id,
                notificationsDateTime: notification.notificationsDateTime,
                status: notification.status,
                recipientEmailsStautsId: notification.recipientEmailsStautsId,
              });
              return acc;
            }, {} as Record<NotificationsTypeEnum, any[]>),
          };
        }
      });
    } catch (error) {
      console.error(
        `Error in getEmailDueDateRemindersByFinancialYear (financialYearId: ${financialYearId}, notificationsType: ${notificationsType}):`,
        error
      );
      throw new Error('Failed to fetch notification due date reminders');
    }
  }

  async getEmailNotifications(notificationsType: NotificationsTypeEnum) {
    const nowUtc = new Date();
  
    // ✅ Build where clause
    const where = {
      notificationsType,
      notificationsDateTime: LessThanOrEqual(nowUtc),
      validTillTime: MoreThanOrEqual(nowUtc),
      status: EmailNotificationsStatus.PENDING,
    };

    // ✅ Apply filters for actual return
    return await this.getRepo(EmailNotificationsEntity).find({ where });
  }
  

  async getConfigurations(financialYearId: number, questionFrequencyType: QuestionFrequencyType) {
    return this.getRepo(QuestionDueDateEntity).findOne({
      where: { financialYearId, questionFrequencyType }
    });
  }

  async updateStatusAndUser(
    id: number,
    recipientEmailsStautsId: number[],
    status: EmailNotificationsStatus,
  ) {
    return this.getRepo(EmailNotificationsEntity).update(
      { id },
      { recipientEmailsStautsId, status }
    );
  }

  async getPeriodDueDate(id: number) {
    return this.getRepo(QuestionDueDateEntity).findOne({
      where: { id }
    });
  }


  async checkExistingReminder(locationId: number, periodId: number, financialYearId: number, questionId: number, companyId: number) {
    return this.getRepo(QuestionDueDateEntity).findOne({
      where: {
        locationId,
        periodId,
        financialYearId,
        questionId,
        companyId,
        status: EmailNotificationsStatus.ACTIVE
      }
    });
  }

  async updateEmailReminders(id: number, reminders: any) {
    const repo = this.getRepo(QuestionDueDateEntity);
    const result = await repo.update(
      { id },
      { reminders, updatedAt: new Date() }
    );
    return result.affected;
  }


  async getRemindersByLocationIds(locationIds: number[], companyId: number, financialYearId?: number) {
    const whereCondition: any = {
      locationId: { $in: locationIds } as any,
      companyId,
      status: EmailNotificationsStatus.ACTIVE
    };

    if (financialYearId) {
      whereCondition.financialYearId = financialYearId;
    }

    return this.getRepo(QuestionDueDateEntity).find({
      where: whereCondition
    });
  }

  async getRemindersByLocationAndPeriod(locationId: number, periodId: number, companyId: number, financialYearId?: number) {
    const whereCondition: any = {
      locationId,
      periodId,
      companyId,
      status: EmailNotificationsStatus.ACTIVE
    };

    if (financialYearId) {
      whereCondition.financialYearId = financialYearId;
    }

    return this.getRepo(QuestionDueDateEntity).find({
      where: whereCondition
    });
  }

  async countActiveRemindersByFinancialYear(financialYearId: number, companyId: number) {
    return this.getRepo(QuestionDueDateEntity).count({
      where: {
        financialYearId,
        companyId,
        status: EmailNotificationsStatus.ACTIVE,
        isActive: true
      }
    });
  }
}