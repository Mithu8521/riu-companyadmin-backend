import { Test, TestingModule } from '@nestjs/testing';
import { OrgChartDaoService } from './org-chart-dao.service';

describe('OrgChartDaoService', () => {
  let service: OrgChartDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrgChartDaoService],
    }).compile();

    service = module.get<OrgChartDaoService>(OrgChartDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
