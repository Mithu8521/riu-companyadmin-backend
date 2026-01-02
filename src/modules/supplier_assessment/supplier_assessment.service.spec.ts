import { Test, TestingModule } from '@nestjs/testing';
import { SupplierAssessmentService } from './supplier_assessment.service';

describe('SupplierAssessmentService', () => {
  let service: SupplierAssessmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierAssessmentService],
    }).compile();

    service = module.get<SupplierAssessmentService>(SupplierAssessmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
