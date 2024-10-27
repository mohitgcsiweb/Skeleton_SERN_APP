import { Router } from "express";
import authenticate from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
  createUser,
  getAllUsers,
  updateUser,
  createAudience,
  getAllAudiences,
  updateAudience,
  getAllTiles,
} from "../controllers/adminController.js";
const router = Router();

//Salesforce
router.post("/users", authenticate, adminOnly, createUser);

//Salesforce
router.get("/users", authenticate, adminOnly, getAllUsers);

//Salesforce
router.put("/users/:id", authenticate, adminOnly, updateUser);

//Salesforce
router.post("/audiences", authenticate, adminOnly, createAudience);

//Salesforce
router.get("/audiences", authenticate, adminOnly, getAllAudiences);

//Salesforce Done for Manage Audience.
// Remaning for ManageTiles
router.put("/audiences/:id", authenticate, adminOnly, updateAudience);

//Salesforce
router.get("/tiles", authenticate, adminOnly, getAllTiles);

export default router;
