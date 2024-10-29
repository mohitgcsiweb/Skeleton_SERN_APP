import { Router } from "express";
import {
  verifySession,
  login,
  verifyMFA,
  setPassword,
  forgotPassword,
  resetPassword,
  getTilesByAudienceId,
} from "../controllers/authController.js";
import authenticate from "../middleware/authMiddleware.js";
const router = Router();

router.get("/verify-session/:id", verifySession);

// Login
//Salesforce
router.post("/login", login);

//Verify MFA
router.post("/verify-mfa", verifyMFA);

router.post("/set-password", setPassword);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/tiles/:audienceId", authenticate, getTilesByAudienceId);

export default router;
