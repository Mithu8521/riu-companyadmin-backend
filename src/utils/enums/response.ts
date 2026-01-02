export class Response {
	errorMessage: string;
	errorCode: number;
	constructor(code, message) {
		this.errorCode = code;
		this.errorMessage = message;
	}
}

export const ResponseData = {
	SUCCESS: new Response(200, "Success"),
	INVALID_INPUTS: new Response(400,"Invalid inputs"),
	INVALID_CREDENCIALS: new Response(403,"Invalid credentials!"),
	DEACTIVEVATE: new Response(400,"Your account is deactivated"),
	
};
