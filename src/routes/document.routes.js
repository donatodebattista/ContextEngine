import { Router } from "express";
import { uploadDocument } from "../controllers/document.controller.js";

const router = Router();

router.post("/", uploadDocument);

export default router;