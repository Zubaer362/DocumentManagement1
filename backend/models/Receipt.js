import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  receiptId: String,
  invoiceId: String,

  clientName: String,
  clientEmail: String,

  amountPaid: Number,
  paymentMethod: String,

  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model("Receipt", receiptSchema);
