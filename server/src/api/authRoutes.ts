import "dotenv/config";
import { Router } from "express";
import passport from "passport";
import "../auth/githubAuth";

export const router = Router();

router.get("/github", passport.authenticate("github"));
router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
  })
);
