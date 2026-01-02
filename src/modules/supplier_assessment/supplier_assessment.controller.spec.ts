import { Test, TestingModule } from '@nestjs/testing';
import { SupplierAssessmentController } from './supplier_assessment.controller';
import { SupplierAssessmentService } from './supplier_assessment.service';

describe('SupplierAssessmentController', () => {
  let controller: SupplierAssessmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierAssessmentController],
      providers: [SupplierAssessmentService],
    }).compile();

    controller = module.get<SupplierAssessmentController>(SupplierAssessmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
