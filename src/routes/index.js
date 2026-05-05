import { Router } from "express";
import queryRoutes from "./query.routes.js";
import documentRoutes from "./document.routes.js";

const router = Router();

router.use("/query", queryRoutes);
router.use("/documents", documentRoutes);

router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

export default router;