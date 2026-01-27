import Quotation from "../models/Quotation.js";
import { generateId } from "../utils/generateId.js";

/**
 * CREATE QUOTATION
 * POST /api/quotations
 */
export const createQuotation = async (req, res) => {
  try {
    // Count existing quotations
    const count = await Quotation.countDocuments();

    // Generate quotation ID (AT-Q-0001)
    const quotationId = generateId("AT-Q", count + 1);

    // Create new quotation document
    const quotation = new Quotation({
      ...req.body,
      quotationId,
    });

    // Save to MongoDB
    const saved = await quotation.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET QUOTATION BY ID
 * GET /api/quotations/:id
 */
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      quotationId: req.params.id,
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
