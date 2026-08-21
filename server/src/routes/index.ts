import { Router } from "express";
import { skillsRouter } from "./skills.routes.js";
import { monitorRouter } from "./monitor.routes.js";

export const apiRouter = Router();

apiRouter.use("/skills", skillsRouter);
apiRouter.use("/monitor", monitorRouter);
