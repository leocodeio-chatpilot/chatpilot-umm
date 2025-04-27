import { Router } from "express";
import {
  saveApikey,
  queryModelApi,
  getApiByUserId,
} from "../../controllers/model";
import { isAuthenticated, isApikeyAuthenticated } from "../../middleware/user";

const modelRouter = Router();

modelRouter.post(
  "/add-api",
  isAuthenticated,
  isApikeyAuthenticated,
  saveApikey
);
modelRouter.post(
  "/query",
  isAuthenticated,
  isApikeyAuthenticated,
  queryModelApi
);

modelRouter.get("/get-api/:userId", isAuthenticated, getApiByUserId);
export default modelRouter;
