import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProcessDto } from './dto/create-process.dto';
import { ProcessDaoService } from '@modules/dao/setting/process-dao/process-dao.service';
import { ProcessEntity } from './entities/process.entity';
import { UpdateProcessDto } from './dto/update-process.dto';
import { DeleteProcessDto } from './dto/delete-process.dto';

@Injectable()
export class ProcessService {
  constructor(private processDaoService: ProcessDaoService) {}

  async createProcess(createProcessDto: CreateProcessDto, req: any) {
    const { process } = createProcessDto;
    const systemUserId = req.headers.userid;
    const insertedData = await this.processDaoService.insertProcessData(new ProcessEntity(process, systemUserId, true));
    throw new HttpException({ status: 200, message: 'Created successfully' }, HttpStatus.OK);
  }

  async getProcess(req: any) {
    const systemUserId = req.headers.userid;
    const getProcessDeatls = req.query.type === "ALL" ? await this.processDaoService.getProcess() : await this.processDaoService.getProcessBasedOnId(systemUserId);
    throw new HttpException({ status: 200, message: 'Data Found', data: getProcessDeatls }, HttpStatus.OK);
  }

  async updateProcess(updateProcessDto: UpdateProcessDto, req: any) {
    const { id, process } = updateProcessDto;
    const updatedData = await this.processDaoService.updateProcessData(id, process);
    throw new HttpException({ status: 200, message: 'Updated successfully' }, HttpStatus.OK);
  }

  async deleteProcess(deleteProcessDto: DeleteProcessDto, req: any) {
    const { id } = deleteProcessDto;
    const deletedData = await this.processDaoService.deleteProcessData(id);
    throw deletedData
      ? new HttpException({ status: 200, message: 'Deleted successfully' }, HttpStatus.OK)
      : new HttpException({ status: 404, message: 'Designation not found' }, HttpStatus.NOT_FOUND);
  }
}
