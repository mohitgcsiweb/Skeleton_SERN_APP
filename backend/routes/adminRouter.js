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

router.post("/audiences", authenticate, adminOnly, createAudience);

router.get("/audiences", authenticate, adminOnly, getAllAudiences);

router.put("/audiences/:id", authenticate, adminOnly, updateAudience);

router.get("/tiles", authenticate, adminOnly, getAllTiles);

export default router;
