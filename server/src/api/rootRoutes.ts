import { Request, Response, Router } from "express";
import "dotenv/config";

export const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Drop API");
});

router.get("/user", (req: Request, res: Response) => {
  res.status(200).json(req.user ? { ...req.user } : {});
});
