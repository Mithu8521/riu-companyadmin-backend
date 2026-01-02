
import { CompanyEntity } from '@modules/setting/user/entities/user.entity';
import { TraineeUser } from '@modules/training/trainee/entities/external-trainee-resister.entity';
import { Training } from '@modules/training/trainer/entities/training.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';

@Injectable()
export class TraineeDaoService {
    constructor(private dataSource: DataSource) { }

    private getRepo(entity: any) {
        return this.dataSource.getRepository(entity);
    }

    async getExitingTrainingDataBasedOnToken(token: string) {
        return this.getRepo(Training).findOne({ where: { token } });
    }

    async getExitingUserBasedId(id: number) {
        return this.getRepo(TraineeUser).findOne({ where: { id } });
    }

    async getExitingUser(firstName: string, mobileNumber: string) {
        return this.getRepo(TraineeUser).findOne({ where: { firstName, mobileNumber } });
    }

    async inserTraineeData(traineeUser: TraineeUser) {
        return this.getRepo(TraineeUser).save(traineeUser);
    }

    async getAllRegisteredTrainees(
        financialYearStartDate: string,
        financialYearEndDate: string,
    ) {
        const start = financialYearStartDate;
        const end = financialYearEndDate;

        return this.getRepo(CompanyEntity)
            .createQueryBuilder('user')
            .where('DATE(user.joining_date) <= :end', { end })
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


      async getRegisteredTraineesBasedOnCompanys(
        register_company_name: string,
        financialYearStartDate: string,
        financialYearEndDate: string,
    ) {
        const start = financialYearStartDate;
        const end = financialYearEndDate;

        return this.getRepo(CompanyEntity)
            .createQueryBuilder('user')
            .where('DATE(user.joining_date) <= :end', { end })
            .andWhere(
                `(
                (user.last_working_date IS NULL AND user.status = true)
                OR
                (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :end)
            )`,
                { start, end },
            )
            .andWhere('user.register_company_name = :register_company_name', { register_company_name })

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


    // async getRegisteredTraineesBasedOnCompanys(
    //     register_company_name: string,
    //     financialYearStartDate: string,
    //     financialYearEndDate: string,
    // ) {
    //     const start = financialYearStartDate; // YYYY-MM-DD
    //     const end = financialYearEndDate;     // YYYY-MM-DD

    //     return this.getRepo(CompanyEntity)
    //         .createQueryBuilder('user')
    //         .where('DATE(user.created_at) <= :end', { end }) // joined before or during FY
    //         .andWhere(
    //             `(
    //             (user.last_working_date IS NULL AND user.status = true)
    //             OR
    //             (user.last_working_date IS NOT NULL AND user.status = false AND DATE(user.last_working_date) >= :end)
    //         )`,
    //             { end },
    //         )
    //         .andWhere('user.register_company_name = :register_company_name', { register_company_name })
    //         .select([
    //             'user.id',
    //             'user.email',
    //             'user.first_name',
    //             'user.last_name',
    //             'user.gender',
    //             'user.employee_id',
    //             'user.business_unit',
    //             'user.division',
    //             'user.category_id',
    //             'user.department_id',
    //             'user.register_company_name',
    //             'user.created_at',
    //             'user.last_working_date',
    //             'user.status',
    //         ])
    //         .getMany();
    // }


    async getRegisteredTraineesBasedOnCompany(register_company_name: string) {
        return this.getRepo(CompanyEntity).find({
            where: { status: true, register_company_name },
            select: ['id', 'email', 'first_name', 'last_name', 'gender', 'employeeId', 'businessUnit', 'division', 'categoryId', 'departmentId', "register_company_name"],
        });
    }


    async getAllTrainingListByUserId(userId: number, financialYearId: number) {
        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.userId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }

    async getAllRegisteredTrainingList(userId: number, financialYearId: number) {
        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.userId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('JSON_CONTAINS(training.acceptedUserId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('NOT JSON_CONTAINS(training.attendantUserId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('NOT JSON_CONTAINS(training.nonAcceptedUserId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }



    async getUpcomingTrainings(userId: number, financialYearId: number) {
        const currentDateTime = new Date();
        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.userId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('NOT JSON_CONTAINS(training.attendantUserId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere('NOT JSON_CONTAINS(training.nonAcceptedUserId, :userId)', { userId: JSON.stringify([userId]) })
            // .andWhere('CONCAT(training.date, " ", training.toTime) > :currentDateTime', {
            //     currentDateTime: currentDateTime.toISOString().slice(0, 19).replace('T', ' ')
            // })
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }


    async getHistoryTrainings(userId: number, financialYearId: number) {
        const currentDateTime = new Date();

        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.userId, :userId)', { userId: JSON.stringify([userId]) })
            .andWhere(
                new Brackets(qb => {
                    qb.where('JSON_CONTAINS(training.nonAcceptedUserId, :userId)', { userId: JSON.stringify([userId]) })
                    //   .orWhere('CONCAT(training.date, " ", training.toTime) < :currentDateTime', {
                    //       currentDateTime: currentDateTime.toISOString().slice(0, 19).replace('T', ' ')
                    //   });
                })
            )
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }



    async getAllAttentdantTrainingList(attendantUserId: number, financialYearId: number) {
        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.attendantUserId, :attendantUserId)', { attendantUserId: JSON.stringify([attendantUserId]) })
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }

    async getAllNonAttentdantTrainingList(nonAttendantUserId: number, financialYearId: number) {
        return this.getRepo(Training).createQueryBuilder('training')
            .where('JSON_CONTAINS(training.nonAttendantUserId, :nonAttendantUserId)', { nonAttendantUserId: JSON.stringify([nonAttendantUserId]) })
            .andWhere('training.status = :status', { status: true })
            .andWhere('training.financialYearId = :financialYearId', { financialYearId })
            .getMany();
    }


}