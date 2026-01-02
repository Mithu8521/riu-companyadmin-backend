import { Request, Response, NextFunction } from "express";

const multer = require("multer");
const upload = multer();

export function MulterMiddleware(req: Request, res: Response, next: NextFunction) {
	upload.single("image");
	next();
}
