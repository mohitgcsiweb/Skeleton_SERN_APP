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
} from "../controllers/adminController.js";
const router = Router();

router.post("/users", authenticate, adminOnly, createUser);

router.get("/users", authenticate, adminOnly, getAllUsers);

router.put("/users/:id", authenticate, adminOnly, updateUser);

router.post("/audiences", authenticate, adminOnly, createAudience);

router.get("/audiences", authenticate, adminOnly, getAllAudiences);

router.put("/audiences/:id", authenticate, adminOnly, updateAudience);

export default router;
