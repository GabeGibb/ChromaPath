import { NextFunction, Request, Response } from "express";

function notFound(req: Request, res: Response, next: NextFunction): void {
	res.status(404);
	const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
	next(error);
}

/* eslint-disable no-unused-vars */
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
	/* eslint-enable no-unused-vars */
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);
	res.json({
		message: err.message,
		stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
	});
}

export { errorHandler, notFound };
