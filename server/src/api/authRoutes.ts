import { Router } from "express";
import passport from "passport";
import * as dotenv from "dotenv";
import "../auth/githubAuth";

dotenv.config()
export const router = Router();

router.get("/github", passport.authenticate("github"));
router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: process.env.CLIENT_URI,
    failureRedirect: "/failure",
  })
);

