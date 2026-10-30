import { model, models, Schema, Types } from "mongoose";
const LoanPaymentSchema = new Schema({
  loan: { type: Types.ObjectId, ref: "Loan", required: true, index: true }, bus: { type: Types.ObjectId, ref: "Bus", required: true },
  date: { type: Date, required: true, index: true }, amountMinor: { type: Number, required: true, min: 1 }, method: { type: String, enum: ["cash", "bank", "card"], default: "bank" }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });
LoanPaymentSchema.index({ loan: 1, date: 1 });
export default models.LoanPayment || model("LoanPayment", LoanPaymentSchema);
