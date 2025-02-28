import mongoose from "mongoose";

const mpesaTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  resultCode: { type: String }, // API response code
  createdAt: { type: Date, default: Date.now },
});

const MpesaTransaction = mongoose.model(
  "MpesaTransaction",
  mpesaTransactionSchema,
);

export default MpesaTransaction; // ✅ Correct export
