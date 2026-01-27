import express from "express";
import {
  createQuotation,
  getQuotationById
} from "../controllers/quotationController.js";

const router = express.Router();

router.post("/", createQuotation);
router.get("/:id", getQuotationById);

export default router;
