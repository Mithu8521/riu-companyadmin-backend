import { Test, TestingModule } from "@nestjs/testing";
import { ExternalApiCallService } from "./external-api-call.service";

describe("ExternalApiCallService", () => {
	let service: ExternalApiCallService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ExternalApiCallService]
		}).compile();

		service = module.get<ExternalApiCallService>(ExternalApiCallService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
