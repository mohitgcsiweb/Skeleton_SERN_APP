import { Router } from "express";
import { verifySession, login, verifyMFA, setPassword, forgotPassword, resetPassword, getTilesByAudienceId } from "../controllers/authController.js";
import authenticate from "../middleware/authMiddleware.js";
const router = Router();

// Manage User Profile
router.get("/verify-session/:id", verifySession);

// Login
router.post("/login", login);

//Verify MFA
router.post("/verify-mfa", verifyMFA);

// Set Password
router.post("/set-password", setPassword);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Get tiles by audience Id 
router.get("/tiles/:audienceId", authenticate, getTilesByAudienceId);

export default router;
