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

// Manage User Profile
//Salesforce
router.get("/verify-session/:id", verifySession);

// Login
//Salesforce
router.post("/login", login);

//Verify MFA
router.post("/verify-mfa", verifyMFA);

// Set Password
//Salesforce
router.post("/set-password", setPassword);

// Forgot Password
//Salesforce
router.post("/forgot-password", forgotPassword);

// Reset Password
//Salesforce
router.post("/reset-password", resetPassword);

// Get tiles by audience Id
router.get("/tiles/:audienceId", authenticate, getTilesByAudienceId);

export default router;
