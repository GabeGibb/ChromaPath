import express, { Request, Response, Router } from "express";
import boards from "./boards";

const router: Router = express.Router();

// Remove the outer router.get("/") wrapper - it's creating nested routes incorrectly
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/boards", boards);

export default router;
