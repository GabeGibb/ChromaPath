import express, { Request, Response } from "express";
import emojis from "./emojis";

const router = express.Router();

// Remove the outer router.get("/") wrapper - it's creating nested routes incorrectly
router.get("/", (req: Request, res: Response) => {
	res.json({
		message: "API - 👋🌎🌍🌏",
	});
});

router.use("/emojis", emojis);

export default router;
