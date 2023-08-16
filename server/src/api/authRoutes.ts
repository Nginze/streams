import "dotenv/config";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import "../auth/githubAuth";
import "../auth/googleAuth";
import createHttpError from "http-errors";

export const router = Router();

router.get("/github", passport.authenticate("github"));
router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
  })
);

router.get("/google", passport.authenticate("google"));
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_CALLBACK_PROD
        : process.env.CLIENT_URI_CALLBACK,
    failureRedirect: "/failure",
  })
);

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  try {
    req.logOut(() => req.session.destroy((error) => {
      if(error) {
        throw createHttpError(400, "Bad/Invalid logout request") 
      }
    }));

    res.status(200).json({
      isAuth: req.isAuthenticated(),
      message: req.isAuthenticated()
        ? "Currently authenicated"
        : " Currently unauthenticated",
    });
  } catch (error) {
    next(error);
  }
});
