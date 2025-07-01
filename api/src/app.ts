import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import api from "./api";
import * as middlewares from "./middlewares";

dotenv.config();

const app: Application = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
