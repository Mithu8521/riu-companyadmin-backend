import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { JwtModule } from '@nestjs/jwt';
import { CommonUtilityService } from "./common/common-utility/common-utility.service";
import { ExternalApiCallService } from "./common/external-api-call/external-api-call.service";
import { ConfigModule } from "src/config/config.module";
import { HtmlReaderService } from "./common/html-reader/html-reader.service";
import { SendMailService } from "./common/send-mail/send-mail.service";
import { VerifyTokenGuard } from "./guards/verify-token/verify-token.guards";
import { GenerateUpdateTokenService } from "./utility-function/generate-update-token/generate-update-token.service";
import { UserDaoService } from "@modules/dao/setting/user-dao/user-dao.service";
import { RoleMasterDaoService } from "@modules/dao/setting/role-master-dao/role-master-dao.service";
import { PermissionMasterDaoService } from "@modules/dao/setting/permission-master-dao/permission-master-dao.service";
import { SubUserDaoService } from "@modules/dao/setting/sub-user-dao/sub-user-dao.service";

@Module({
	imports: [HttpModule, ConfigModule, JwtModule.register({
		secret: "secret",
		signOptions: { expiresIn: '12h' },
	})],
	providers: [
		CommonUtilityService,
		ExternalApiCallService,
		HtmlReaderService,
		SendMailService,
		GenerateUpdateTokenService,
		UserDaoService,
		SubUserDaoService,
		VerifyTokenGuard,
		RoleMasterDaoService,
		PermissionMasterDaoService
	],
	exports: [
		CommonUtilityService,
		ExternalApiCallService,
		HtmlReaderService,
		SendMailService,
		GenerateUpdateTokenService,
		UserDaoService,
		SubUserDaoService,
		VerifyTokenGuard,
		RoleMasterDaoService,
		PermissionMasterDaoService
	]
})
export class UtilsModule { }
