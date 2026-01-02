import { TrainingUserRemovalDto } from '@app/modules/training/trainer/dto/remove-user.dto';
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { TraineeUser } from '@modules/training/trainee/entities/external-trainee-resister.entity';
import { InvitedTrainee } from '@modules/training/trainer/entities/invited-trainee.entity';
import { TrainingPrinciple } from '@modules/training/trainer/entities/training-principle.entity';
import { TrainingTopic } from '@modules/training/trainer/entities/training-topic.entity';
import { Training } from '@modules/training/trainer/entities/training.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, In, Raw } from 'typeorm';


@Injectable()
export class TrainingDaoService {
  constructor(private dataSource: DataSource) { }

  private getRepo(entity: any) {
    return this.dataSource.getRepository(entity);
  }

  // async getAllTriningList(createdBy: number, financialYearId: number,status:number) {
  //     return this.getRepo(Training).find({ where: { financialYearId, createdBy, status} });
  // }

  async removeUsersFromTrainingInBulk(trainingUsers: TrainingUserRemovalDto[], identifierType?: string) {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const trainingUserData of trainingUsers) {
      try {
        const { trainingId, employeeId, email } = trainingUserData;

        const identifier = employeeId || email;
        const currentIdentifierType = identifierType || (employeeId ? 'employeeId' : 'email');

        const training = await this.dataSource
          .getRepository(Training)
          .findOne({
            where: { id: parseInt(trainingId) }
          });

        if (!training) {
          results.push({
            trainingId,
            identifier,
            identifierType: currentIdentifierType,
            success: false,
            message: `Training with ID '${trainingId}' not found`
          });
          failed++;
          continue;
        }
        let user;

        if (employeeId) {
          user = await this.dataSource
            .getRepository(CompanyEntity)
            .createQueryBuilder("company")
            .where("TRIM(LEADING '0' FROM company.employeeId) = :empId", {
              empId: String(employeeId).replace(/^0+/, ''),
            })
            .andWhere("company.status = :status", { status: true })
            .getOne();
        } else if (email) {
          user = await this.dataSource
            .getRepository(CompanyEntity)
            .findOne({
              where: { email: email, status: true },
            });
        }
        if (!user) {
          results.push({
            trainingId,
            identifier,
            identifierType: currentIdentifierType,
            trainingTitle: training.trainingTitle,
            success: false,
            message: `User with ${currentIdentifierType === 'employeeId' ? 'Employee ID' : 'Email'} '${identifier}' not found or inactive`
          });
          failed++;
          continue;
        }

        const userId = user.id;
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

        // Check if user is in any of the training user arrays
        const isInUserId = training.userId?.includes(userId);
        const isInAcceptedUserId = training.acceptedUserId?.includes(userId);
        const isInNonAcceptedUserId = training.nonAcceptedUserId?.includes(userId);
        const isInAttendantUserId = training.attendantUserId?.includes(userId);
        const isInNonAttendantUserId = training.nonAttendantUserId?.includes(userId);

        if (!isInUserId && !isInAcceptedUserId && !isInNonAcceptedUserId &&
          !isInAttendantUserId && !isInNonAttendantUserId) {
          results.push({
            trainingId,
            identifier,
            identifierType: currentIdentifierType,
            trainingTitle: training.trainingTitle,
            userName,
            employeeId: user.employeeId,
            email: user.email,
            success: false,
            message: `User is not enrolled in this training`
          });
          failed++;
          continue;
        }

        // Remove user from all relevant arrays
        const updatedUserIds = training.userId?.filter(id => id !== userId) || [];
        const updatedAcceptedUserIds = training.acceptedUserId?.filter(id => id !== userId) || [];
        const updatedNonAcceptedUserIds = training.nonAcceptedUserId?.filter(id => id !== userId) || [];
        const updatedAttendantUserIds = training.attendantUserId?.filter(id => id !== userId) || [];
        const updatedNonAttendantUserIds = training.nonAttendantUserId?.filter(id => id !== userId) || [];

        // Update the training with user removed from all arrays
        await this.dataSource
          .getRepository(Training)
          .update(training.id, {
            userId: updatedUserIds,
            acceptedUserId: updatedAcceptedUserIds,
            nonAcceptedUserId: updatedNonAcceptedUserIds,
            attendantUserId: updatedAttendantUserIds,
            nonAttendantUserId: updatedNonAttendantUserIds,
            updatedAt: new Date()
          });

        results.push({
          trainingId,
          identifier,
          identifierType: currentIdentifierType,
          trainingTitle: training.trainingTitle,
          userName,
          employeeId: user.employeeId,
          email: user.email,
          success: true,
          message: 'User removed from training successfully'
        });
        successful++;

      } catch (error) {
        const identifier = trainingUserData.employeeId || trainingUserData.email;
        const currentIdentifierType = identifierType || (trainingUserData.employeeId ? 'employeeId' : 'email');

        console.error(`Error processing training user ${trainingUserData.trainingId}-${identifier} (${currentIdentifierType}):`, error);
        results.push({
          trainingId: trainingUserData.trainingId,
          identifier,
          identifierType: currentIdentifierType,
          success: false,
          message: `Error processing training user: ${error.message}`
        });
        failed++;
      }
    }

    return {
      data: results,
      total: trainingUsers.length,
      successful,
      failed
    };
  }

  async getTrainingPrinciples() {
    return await this.getRepo(TrainingPrinciple).find({
      where: { },
      select: ['id', 'title'],
    });
  }


  async getAllTrainingList(createdBy: number, financialYearId: number, status: number) {
    return this.getRepo(Training)
      .createQueryBuilder('training')
      .where('training.financialYearId = :financialYearId', { financialYearId })
      .andWhere('training.status = :status', { status })
      .andWhere(
        new Brackets((qb) => {
          qb.where('training.createdBy = :createdBy', { createdBy })
            .orWhere(
              "JSON_CONTAINS(training.trainers, JSON_OBJECT('user_id', :createdBy), '$')",
              { createdBy }
            );
        })
      )
      .getMany();
  }

  async getAllRecordsForTraining() {
    return this.getRepo(Training).find({ where: { status: 1 } }) 
  }


  async getHeadAllTriningList(financialYearId: number, status: number) {
    const trainings = await this.getRepo(Training).find({ where: { financialYearId, status } });

    const allUserIdsSet = new Set<number>();

    trainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });
    });

    const allUserIds = Array.from(allUserIdsSet);

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    // Filter user arrays to only include active users
    const filteredTrainings = trainings.map((training) => ({
      ...training,
      userId: (training.userId || []).filter(id => validUserIds.has(id)),
      acceptedUserId: (training.acceptedUserId || []).filter(id => validUserIds.has(id)),
      nonAcceptedUserId: (training.nonAcceptedUserId || []).filter(id => validUserIds.has(id)),
      attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
      nonAttendantUserId: (training.nonAttendantUserId || []).filter(id => validUserIds.has(id)),
    }));

    return filteredTrainings;
  }

  async getTrainingDataBasedOnCategory(financialYearId: number, categoryId: number) {
    const trainings = await this.getRepo(Training).find({
      where: {
        financialYearId,
        status: 1,
        categoryIds: Raw(
          (alias) => `JSON_CONTAINS(${alias}, :catId)`,
          { catId: JSON.stringify(categoryId) }
        ),
      },
    });

    const allUserIdsSet = new Set<number>();
    trainings.forEach((t) => {
      [
        ...t.attendantUserId,
      ].forEach((uid) => allUserIdsSet.add(uid));
    });
    const allUserIds = Array.from(allUserIdsSet);

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    const users = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const trainingsWithUserDetails = trainings.map((training) => {
      // Filter user arrays to only include active users
      const filteredAttendantUserId = (training.attendantUserId || []).filter(id => validUserIds.has(id));

      const mapUsers = (ids: number[]) =>
        ids.map((id) => userMap.get(id)).filter(Boolean);

      return {
        fromDate: training.fromDate,
        toTime: training.toDate,
        attendantUsers: mapUsers(filteredAttendantUserId),
      };
    });

    return trainingsWithUserDetails;
  }

  async getEmployeeList(categoryIds: string[]) {
    return this.getRepo(CompanyEntity).find({ where: { categoryId: categoryIds, status: 1 } });
  }

  async getTrainingDataAllBasedOnCategory(financialYearId: number) {
    const trainings = await this.getRepo(Training).find({
      where: { financialYearId, status: 1 },
    });

    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();

    trainings.forEach((t) => {
      [
        ...t.attendantUserId,
      ].forEach((uid) => allUserIdsSet.add(uid));
    });

    trainings.forEach((t) => {
      [
        ...t.trainingTopicID,
      ].forEach((uid) => allTopicIdsSet.add(uid));
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    const users = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
    });

    const topic = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const topicMap = new Map(topic.map((u) => [u.id, u]));

    const trainingsWithUserDetails = trainings.map((training) => {
      // Filter user arrays to only include active users
      const filteredTraining = {
        ...training,
        attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
      };

      const mapUsers = (ids: number[]) =>
        ids.map((id) => userMap.get(id)).filter(Boolean);

      const mapTopic = (ids: number[]) =>
        ids.map((id) => topicMap.get(id)).filter(Boolean);

      return {
        ...filteredTraining,
        attendantUsers: mapUsers(filteredTraining.attendantUserId),
        mapTopic: mapTopic(training.trainingTopicID)
      };
    });

    return trainingsWithUserDetails;
  }

  async getHeadAllTrainingListWithUserDetails(
    financialYearId: number,
    category: any[],
    status: number,
    financialYearStartDate: string,
    financialYearEndDate: string,
  ) {
    const trainings = await this.getRepo(Training).find({
      where: { financialYearId, status },
    });

    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    trainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      (t.trainingTopicID || []).forEach((id) => {
        if (id != null) allTopicIdsSet.add(id);
      });

      (t.principlesId || []).forEach((id) => {
        if (id != null) allPrincipleIdsSet.add(id);
      });
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    let users = [];
    let validUserIds = new Set<number>();
    if (allUserIds && allUserIds.length > 0) {
      // ✅ Build query safely
      const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

      qb.where('user.id IN (:...allUserIds)', { allUserIds })
        .andWhere('DATE(user.joining_date) <= :financialYearEndDate', { financialYearEndDate })
        .andWhere(
          `
        (
          (user.last_working_date IS NULL AND user.status = true)
          OR
          (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :financialYearEndDate)
        )
        `,
          { financialYearStartDate, financialYearEndDate },
        )
        .andWhere('user.register_company_name = :company', { company: 'Kennametal India Limited (KIL)' });

      users = await qb.getMany();
      validUserIds = new Set(users.map(u => u.id));
    }

    const topics = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const allPrinciples = await this.getRepo(TrainingPrinciple).find({
      where: {},
      select: ['id', 'title'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = trainings.map((training) => {
      const {
        attendenceExternalQrLink,
        attendenceInternalQrLink,
        registerExternalQrLink,
        registerInternalQrLink,
        ...cleanedTraining
      } = training;

      // Filter user arrays to only include active users
      const filteredTraining = {
        ...cleanedTraining,
        userId: (training.userId || []).filter(id => validUserIds.has(id)),
        acceptedUserId: (training.acceptedUserId || []).filter(id => validUserIds.has(id)),
        nonAcceptedUserId: (training.nonAcceptedUserId || []).filter(id => validUserIds.has(id)),
        attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
        nonAttendantUserId: (training.nonAttendantUserId || []).filter(id => validUserIds.has(id)),
      };

      const mapUsers = (ids: number[]) =>
        (ids || []).map((id) => userMap.get(id)).filter(Boolean);

      const mapTopics = (ids: number[]) =>
        (ids || []).map((id) => topicMap.get(id)).filter(Boolean);

      const mapPrinciples = (ids: number[]) =>
        (ids || []).map((id) => principleMap.get(id)).filter(Boolean);

      const mappedCategories = category.filter(
        (item) => training.categoryIds.includes(item.id)
      );

      return {
        ...filteredTraining,
        categories: mappedCategories,
        topics: mapTopics(training.trainingTopicID),
        principles: mapPrinciples(training.principlesId),
        allPrinciples: allPrinciples,
        users: mapUsers(filteredTraining.userId),
        acceptedUsers: mapUsers(filteredTraining.acceptedUserId),
        nonAcceptedUsers: mapUsers(filteredTraining.nonAcceptedUserId),
        attendantUsers: mapUsers(filteredTraining.attendantUserId),
        nonAttendantUsers: mapUsers(filteredTraining.nonAttendantUserId),
        counts: {
          totalUsers: filteredTraining.userId.length,
          acceptedCount: filteredTraining.acceptedUserId.length,
          nonAcceptedCount: filteredTraining.nonAcceptedUserId.length,
          attendantCount: filteredTraining.attendantUserId.length,
          nonAttendantCount: filteredTraining.nonAttendantUserId.length,
        },
      };
    });

    return trainingsWithUserDetails;
  }

  async getHeadAllTrainingListWithUserDetailsForGraph(
    financialYearId: number,
    category: any[],
    status: number,
    financialYearStartDate: string,
    financialYearEndDate: string,
  ) {
    const trainings = await this.getRepo(Training).find({
      where: { financialYearId, status },
    });

    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    trainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      (t.trainingTopicID || []).forEach((id) => {
        if (id != null) allTopicIdsSet.add(id);
      });

      (t.principlesId || []).forEach((id) => {
        if (id != null) allPrincipleIdsSet.add(id);
      });
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    let users = [];
    let validUserIds = new Set<number>();
    if (allUserIds && allUserIds.length > 0) {
      // ✅ Build query safely
      const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

      qb.where('user.id IN (:...allUserIds)', { allUserIds })
        .andWhere('DATE(user.joining_date) <= :financialYearEndDate', { financialYearEndDate })
        .andWhere(
          `
        (
          (user.last_working_date IS NULL AND user.status = true)
          OR
          (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :financialYearEndDate)
        )
        `,
          { financialYearStartDate, financialYearEndDate },
        )
        .andWhere('user.register_company_name = :company', { company: 'Kennametal India Limited (KIL)' });

      users = await qb.getMany();
      validUserIds = new Set(users.map(u => u.id));
    }

    const topics = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const allPrinciples = await this.getRepo(TrainingPrinciple).find({
      select: ['id', 'title'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = trainings.map((training) => {
      const {
        attendenceExternalQrLink,
        attendenceInternalQrLink,
        registerExternalQrLink,
        registerInternalQrLink,
        companyId,
        createdBy,
        departmentId,
        description,
        linkOrVenues,
        nonAcceptedUserId,
        nonAcceptedUsers,
        nonAttendantUserId,
        nonAttendantUsers,
        principlesId,
        registrationDeadline,
        targetAudience,
        token,
        trainingCategoryId,
        trainingFacilitator,
        trainingLink,
        trainingTopicID,
        userId,
        users,
        ...cleanedTraining
      } = training;

      const filterValidUsers = (ids: number[]) =>
        (ids || []).filter(id => validUserIds.has(id));

      const mapUsers = (ids: number[]) =>
        filterValidUsers(ids).map((id) => userMap.get(id)).filter(Boolean);

      const mapTopics = (ids: number[]) =>
        (ids || []).map((id) => topicMap.get(id)).filter(Boolean);

      const mapPrinciples = (ids: number[]) =>
        (ids || []).map((id) => principleMap.get(id)).filter(Boolean);

      const mappedCategories = category.filter(
        (item) => training.categoryIds.includes(item.id)
      );

      const filteredUserIds = filterValidUsers(training.userId);
      const filteredAcceptedUserIds = filterValidUsers(training.acceptedUserId);
      const filteredNonAcceptedUserIds = filterValidUsers(training.nonAcceptedUserId);
      const filteredAttendantUserIds = filterValidUsers(training.attendantUserId);
      const filteredNonAttendantUserIds = filterValidUsers(training.nonAttendantUserId);

      return {
        ...cleanedTraining,
        categories: mappedCategories,
        topics: mapTopics(training.trainingTopicID),
        principles: mapPrinciples(training.principlesId),
        allPrinciples,
        users: mapUsers(training.userId),
        acceptedUsers: mapUsers(training.acceptedUserId),
        nonAcceptedUsers: mapUsers(training.nonAcceptedUserId),
        attendantUsers: mapUsers(training.attendantUserId),
        nonAttendantUsers: mapUsers(training.nonAttendantUserId),
        counts: {
          totalUsers: filteredUserIds.length,
          acceptedCount: filteredAcceptedUserIds.length,
          nonAcceptedCount: filteredNonAcceptedUserIds.length,
          attendantCount: filteredAttendantUserIds.length,
          nonAttendantCount: filteredNonAttendantUserIds.length,
        },
      };
    });

    return trainingsWithUserDetails;
  }


  async getAllTrainingListWithUserDetails(
    createdBy: number,
    financialYearId: number,
    category: any[],
    status: number,
    financialYearStartDate: string,
    financialYearEndDate: string,
  ) {
    const trainings = await this.getRepo(Training)
      .createQueryBuilder('training')
      .where('training.financialYearId = :financialYearId', { financialYearId })
      .andWhere('training.status = :status', { status })
      .andWhere(
        new Brackets((qb) => {
          qb.where('training.createdBy = :createdBy', { createdBy })
            .orWhere(
              "JSON_CONTAINS(training.trainers, JSON_OBJECT('user_id', :createdBy), '$')",
              { createdBy }
            );
        })
      )
      .getMany();

    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    trainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      (t.trainingTopicID || []).forEach((id) => {
        if (id != null) allTopicIdsSet.add(id);
      });

      (t.principlesId || []).forEach((id) => {
        if (id != null) allPrincipleIdsSet.add(id);
      });
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    let users = [];
    let validUserIds = new Set<number>();
    if (allUserIds && allUserIds.length > 0) {
      // ✅ Build query safely
      const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

      qb.where('user.id IN (:...allUserIds)', { allUserIds })
        .andWhere('DATE(user.joining_date) <= :financialYearEndDate', { financialYearEndDate })
        .andWhere(
          `
        (
          (user.last_working_date IS NULL AND user.status = true)
          OR
          (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :financialYearEndDate)
        )
        `,
          { financialYearStartDate, financialYearEndDate },
        )

      users = await qb.getMany();
      validUserIds = new Set(users.map(u => u.id));
    }


    const topics = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = trainings.map((training) => {
      const { attendenceExternalQrLink, attendenceInternalQrLink, registerExternalQrLink, registerInternalQrLink, ...cleanedTraining } = training;

      const filterValidUsers = (ids: number[]) =>
        (ids || []).filter(id => validUserIds.has(id));

      const mapUsers = (ids: number[]) =>
        filterValidUsers(ids).map((id) => userMap.get(id)).filter(Boolean);

      const mapTopics = (ids: number[]) =>
        (ids || []).map((id) => topicMap.get(id)).filter(Boolean);

      const mapPrinciples = (ids: number[]) =>
        (ids || []).map((id) => principleMap.get(id)).filter(Boolean);

      const mappedCategories = category.filter(
        (item) => training.categoryIds.includes(item.id)
      );

      const filteredUserIds = filterValidUsers(training.userId);
      const filteredAcceptedUserIds = filterValidUsers(training.acceptedUserId);
      const filteredNonAcceptedUserIds = filterValidUsers(training.nonAcceptedUserId);
      const filteredAttendantUserIds = filterValidUsers(training.attendantUserId);
      const filteredNonAttendantUserIds = filterValidUsers(training.nonAttendantUserId);

      return {
        ...cleanedTraining,
        categories: mappedCategories,
        topics: mapTopics(training.trainingTopicID),
        principles: mapPrinciples(training.principlesId),
        users: mapUsers(training.userId),
        acceptedUsers: mapUsers(training.acceptedUserId),
        nonAcceptedUsers: mapUsers(training.nonAcceptedUserId),
        attendantUsers: mapUsers(training.attendantUserId),
        nonAttendantUsers: mapUsers(training.nonAttendantUserId),
        counts: {
          totalUsers: filteredUserIds.length,
          acceptedCount: filteredAcceptedUserIds.length,
          nonAcceptedCount: filteredNonAcceptedUserIds.length,
          attendantCount: filteredAttendantUserIds.length,
          nonAttendantCount: filteredNonAttendantUserIds.length,
        },
      };
    });

    return trainingsWithUserDetails;
  }

  async getAllTrainingListWithUserDetailsForGraph(
    createdBy: number[],
    financialYearId: number,
    category: any[],
    status: 1,
    financialYearStartDate: string,
    financialYearEndDate: string,
  ) {
    const trainings = await this.getRepo(Training)
      .createQueryBuilder('training')
      .where('training.financialYearId = :financialYearId', { financialYearId })
      .andWhere('training.status = :status', { status })
      .andWhere(
        new Brackets((qb) => {
          qb.where('training.createdBy IN (:...createdBy)', { createdBy })
            .orWhere(
              "JSON_CONTAINS(training.trainers, JSON_OBJECT('user_id', :createdByValue), '$')",
              { createdByValue: createdBy[0] } // For JSON_CONTAINS, pass individual value
            );
        })
      )
      .getMany();

    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    trainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      (t.trainingTopicID || []).forEach((id) => {
        if (id != null) allTopicIdsSet.add(id);
      });

      (t.principlesId || []).forEach((id) => {
        if (id != null) allPrincipleIdsSet.add(id);
      });
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    let users = [];
    let validUserIds = new Set<number>();
    if (allUserIds && allUserIds.length > 0) {
      // ✅ Build query safely
      const qb = this.getRepo(CompanyEntity).createQueryBuilder('user');

      qb.where('user.id IN (:...allUserIds)', { allUserIds })
        .andWhere('DATE(user.joining_date) <= :financialYearEndDate', { financialYearEndDate })
        .andWhere(
          `
        (
          (user.last_working_date IS NULL AND user.status = true)
          OR
          (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :financialYearEndDate)
        )
        `,
          { financialYearStartDate, financialYearEndDate },
        )

      users = await qb.getMany();
      validUserIds = new Set(users.map(u => u.id));
    }

    const topics = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = trainings.map((training) => {
      // Remove QR code links if needed
      const { attendenceExternalQrLink, attendenceInternalQrLink, registerExternalQrLink, registerInternalQrLink, ...cleanedTraining } = training;

      const filterValidUsers = (ids: number[]) =>
        (ids || []).filter((id) => validUserIds.has(id));

      const mapUsers = (ids: number[]) =>
        filterValidUsers(ids).map((id) => userMap.get(id)).filter(Boolean);

      const mapTopics = (ids: number[]) =>
        (ids || []).map((id) => topicMap.get(id)).filter(Boolean);

      const mapPrinciples = (ids: number[]) =>
        (ids || []).map((id) => principleMap.get(id)).filter(Boolean);

      const mappedCategories = category.find(
        (item) => training.categoryIds(item.id)
      );

      const filteredUserIds = filterValidUsers(training.userId);
      const filteredAcceptedUserIds = filterValidUsers(training.acceptedUserId);
      const filteredNonAcceptedUserIds = filterValidUsers(training.nonAcceptedUserId);
      const filteredAttendantUserIds = filterValidUsers(training.attendantUserId);
      const filteredNonAttendantUserIds = filterValidUsers(training.nonAttendantUserId);

      return {
        ...cleanedTraining,
        categories: mappedCategories,
        topics: mapTopics(training.trainingTopicID),
        principles: mapPrinciples(training.principlesId),
        users: mapUsers(training.userId),
        acceptedUsers: mapUsers(training.acceptedUserId),
        nonAcceptedUsers: mapUsers(training.nonAcceptedUserId),
        attendantUsers: mapUsers(training.attendantUserId),
        nonAttendantUsers: mapUsers(training.nonAttendantUserId),
        counts: {
          totalUsers: filteredUserIds.length,
          acceptedCount: filteredAcceptedUserIds.length,
          nonAcceptedCount: filteredNonAcceptedUserIds.length,
          attendantCount: filteredAttendantUserIds.length,
          nonAttendantCount: filteredNonAttendantUserIds.length,
        },
      };
    });

    return trainingsWithUserDetails;
  }

  async getTrainingListForUser(financialYearId: number, userId: number) {
    const trainings = await this.getRepo(Training).find({
      where: { financialYearId, status: 1 },
    });

    // Filter trainings to only include those where userId is in training.userId array
    const filteredTrainings = trainings.filter(training =>
      training.userId && training.userId.includes(userId)
    );

    // Collect all user IDs for validation
    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    filteredTrainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      if (t.trainingTopicID && Array.isArray(t.trainingTopicID)) {
        t.trainingTopicID.forEach((uid) => allTopicIdsSet.add(uid));
      }

      if (t.principlesId && Array.isArray(t.principlesId)) {
        t.principlesId.forEach((pid) => allPrincipleIdsSet.add(pid));
      }
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    const topic = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const topicMap = new Map(topic.map((u) => [u.id, u]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = filteredTrainings.map((training) => {
      // Filter user arrays to only include active users
      const filteredTraining = {
        ...training,
        userId: (training.userId || []).filter(id => validUserIds.has(id)),
        acceptedUserId: (training.acceptedUserId || []).filter(id => validUserIds.has(id)),
        nonAcceptedUserId: (training.nonAcceptedUserId || []).filter(id => validUserIds.has(id)),
        attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
        nonAttendantUserId: (training.nonAttendantUserId || []).filter(id => validUserIds.has(id)),
      };

      const mapTopic = (ids: number[]) =>
        ids && Array.isArray(ids) ? ids.map((id) => topicMap.get(id)).filter(Boolean) : [];

      const mapPrinciple = (ids: number[]) =>
        ids && Array.isArray(ids) ? ids.map((id) => principleMap.get(id)).filter(Boolean) : [];

      return {
        ...filteredTraining,
        mapTopic: mapTopic(training.trainingTopicID),
        mapPrinciple: mapPrinciple(training.principlesId)
      };
    });

    return trainingsWithUserDetails;
  }

  async getTrainingListForTrainer(financialYearId: number, userId: number) {
    const trainings = await this.getRepo(Training).find({
      where: { financialYearId, status: 1, createdBy: userId },
    });

    // Filter trainings to only include those where userId is in training.userId array
    const filteredTrainings = trainings;

    // Collect all user IDs for validation
    const allUserIdsSet = new Set<number>();
    const allTopicIdsSet = new Set<number>();
    const allPrincipleIdsSet = new Set<number>();

    filteredTrainings.forEach((t) => {
      const userGroups = [
        t.userId || [],
        t.acceptedUserId || [],
        t.nonAcceptedUserId || [],
        t.attendantUserId || [],
        t.nonAttendantUserId || [],
      ];
      userGroups.flat().forEach((uid) => {
        if (uid != null) allUserIdsSet.add(uid);
      });

      if (t.trainingTopicID && Array.isArray(t.trainingTopicID)) {
        t.trainingTopicID.forEach((uid) => allTopicIdsSet.add(uid));
      }

      if (t.principlesId && Array.isArray(t.principlesId)) {
        t.principlesId.forEach((pid) => allPrincipleIdsSet.add(pid));
      }
    });

    const allUserIds = Array.from(allUserIdsSet);
    const allTopicIds = Array.from(allTopicIdsSet);
    const allPrincipleIds = Array.from(allPrincipleIdsSet);

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    const topic = await this.getRepo(TrainingTopic).find({
      where: { id: In(allTopicIds) },
      select: ['id', 'topic'],
    });

    const principles = await this.getRepo(TrainingPrinciple).find({
      where: { id: In(allPrincipleIds) },
      select: ['id', 'title'],
    });

    const topicMap = new Map(topic.map((u) => [u.id, u]));
    const principleMap = new Map(principles.map((p) => [p.id, p]));

    const trainingsWithUserDetails = filteredTrainings.map((training) => {
      // Filter user arrays to only include active users
      const filteredTraining = {
        ...training,
        userId: (training.userId || []).filter(id => validUserIds.has(id)),
        acceptedUserId: (training.acceptedUserId || []).filter(id => validUserIds.has(id)),
        nonAcceptedUserId: (training.nonAcceptedUserId || []).filter(id => validUserIds.has(id)),
        attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
        nonAttendantUserId: (training.nonAttendantUserId || []).filter(id => validUserIds.has(id)),
      };

      const mapTopic = (ids: number[]) =>
        ids && Array.isArray(ids) ? ids.map((id) => topicMap.get(id)).filter(Boolean) : [];

      const mapPrinciple = (ids: number[]) =>
        ids && Array.isArray(ids) ? ids.map((id) => principleMap.get(id)).filter(Boolean) : [];

      return {
        ...filteredTraining,
        mapTopic: mapTopic(training.trainingTopicID),
        mapPrinciple: mapPrinciple(training.principlesId)
      };
    });

    return trainingsWithUserDetails;
  }

  async getInvitedEmail(id: number) {
    return this.getRepo(InvitedTrainee).find({ where: { id } });
  }

  // async getExitingTrainingData(id: number) {
  //   return this.getRepo(Training).findOne({ where: { id } });
  // }

  async getExitingTrainingData(id: number) {
    const training = await this.getRepo(Training).findOne({ where: { id } });

    if (!training) {
      return null;
    }

    const allUserIdsSet = new Set<number>();

    const userGroups = [
      training.userId || [],
      training.acceptedUserId || [],
      training.nonAcceptedUserId || [],
      training.attendantUserId || [],
      training.nonAttendantUserId || [],
    ];

    userGroups.flat().forEach((uid) => {
      if (uid != null) allUserIdsSet.add(uid);
    });

    const allUserIds = Array.from(allUserIdsSet);

    if (allUserIds.length === 0) {
      return training;
    }

    // Get only active users (status = 1)
    const validUsers = await this.getRepo(CompanyEntity).find({
      where: {
        id: In(allUserIds),
        status: 1
      },
      select: ['id'],
    });

    // Create a set of valid user IDs
    const validUserIds = new Set(validUsers.map(u => u.id));

    // Filter user arrays to only include active users
    const filteredTraining = {
      ...training,
      id: training.id,
      trainingTitle: training.trainingTitle,
      trainingTopicID: training.trainingTopicID,
      description: training.description,
      fromDate: training.fromDate,
      modeOfTraining: training.modeOfTraining,
      trainers: training.trainers,
      trainingLink: training.trainingLink,
      token: training.token,
      registerInternalQrLink: training.registerInternalQrLink,
      registerExternalQrLink: training.registerExternalQrLink,
      attendenceInternalQrLink: training.attendenceInternalQrLink,
      attendenceExternalQrLink: training.attendenceExternalQrLink,
      createdBy: training.createdBy,
      userId: (training.userId || []).filter(id => validUserIds.has(id)),
      acceptedUserId: (training.acceptedUserId || []).filter(id => validUserIds.has(id)),
      nonAcceptedUserId: (training.nonAcceptedUserId || []).filter(id => validUserIds.has(id)),
      attendantUserId: (training.attendantUserId || []).filter(id => validUserIds.has(id)),
      nonAttendantUserId: (training.nonAttendantUserId || []).filter(id => validUserIds.has(id)),
    };

    return filteredTraining;
  }

  async getExitingRegisterTrainingData(
    userIds: number[],
    financialYearStartDate: string,
    financialYearEndDate: string,
  ) {
    if (!userIds || userIds.length === 0) {
      return []; // Nothing to query
    }
    const start = financialYearStartDate; // YYYY-MM-DD
    const end = financialYearEndDate;     // YYYY-MM-DD

    return this.getRepo(CompanyEntity)
      .createQueryBuilder('user')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('DATE(user.joining_date) <= :end', { end }) // joined before or during FY
      .andWhere(
        `(
                (user.last_working_date IS NULL AND user.status = true)
                OR
                (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :end)
            )`,
        { start, end },
      )
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.gender',
        'user.employeeId',
        'user.businessUnit',
        'user.division',
        'user.categoryId',
        'user.departmentId',
        'user.register_company_name',
        'user.created_at',
        'user.last_working_date',
        'user.status',
      ])
      .getMany();
  }


  async getExitingAttendentTrainingData(userId: number[]) {
    return this.getRepo(CompanyEntity).find({ where: { id: In(userId) } });
  }

  async saveNewInvitedTrainee(training: InvitedTrainee) {
    return this.getRepo(InvitedTrainee).save(training);
  }

  async saveNewTopic(topic: TrainingTopic) {
    return this.getRepo(TrainingTopic).save(topic);
  }

  async saveNewTraining(training: Training) {
    return this.getRepo(Training).save(training);
  }

  async updateTrainingData(trainingId: number, training: Training) {
    return this.getRepo(Training).update({ id: trainingId }, training);
  }

  async updateTrainingQRData(trainingId: number, registerInternalQrLink: string, attendenceInternalQrLink: string, registerExternalQrLink: string, attendenceExternalQrLink: string) {
    return this.getRepo(Training).update({ id: trainingId }, { registerInternalQrLink, registerExternalQrLink, attendenceInternalQrLink, attendenceExternalQrLink });
  }

  async updateTrainingStatus(id: number, status: number) {
    return this.getRepo(Training).update({ id }, { status });
  }

  async updateUserId(id: number, userId: number[]) {
    return this.getRepo(Training).update({ id }, { userId });
  }

  async updateNonAttendantUserId(id: number, nonAttendantUserId: number[]) {
    return this.getRepo(Training).update({ id }, { nonAttendantUserId });
  }

  async updateAttendantUserId(id: number, attendantUserId: number[]) {
    return this.getRepo(Training).update({ id }, { attendantUserId });
  }

  async updateAcceptedUserId(id: number, acceptedUserId: number[]) {
    return this.getRepo(Training).update({ id }, { acceptedUserId });
  }

  async updateNonAcceptedUserId(id: number, nonAcceptedUserId: number[]) {
    return this.getRepo(Training).update({ id }, { nonAcceptedUserId });
  }



  async getTrainingTopicMapping() {
    const query = `
        SELECT
            sh.id,
            sh.topic,
            sh.training_principle_id AS trainingPrincipleId,
            sh.created_by AS createdBy,
            sh.created_at AS createdAt,
            p.title AS principleHeading
        FROM
            riu_training_topic sh
        LEFT JOIN
            riu_training_principles p ON p.id = sh.training_principle_id
        `;
    return await this.getRepo(Training).query(query);
  }


}

