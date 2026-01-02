import { Test, TestingModule } from '@nestjs/testing';
import { SupplierAssessmentDaoService } from './supplier-assessment-dao.service';

describe('SupplierAssessmentDaoService', () => {
  let service: SupplierAssessmentDaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierAssessmentDaoService],
    }).compile();

    service = module.get<SupplierAssessmentDaoService>(SupplierAssessmentDaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
