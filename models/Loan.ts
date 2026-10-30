import { model, models, Schema, Types } from "mongoose";
const LoanSchema = new Schema({
  bus: { type: Types.ObjectId, ref: "Bus", required: true, index: true }, lender: { type: String, trim: true, maxlength: 120, default: "" },
  principalMinor: { type: Number, required: true, min: 1 }, balanceMinor: { type: Number, required: true, min: 0 }, installmentMinor: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true }, status: { type: String, enum: ["active", "paid_off"], default: "active", index: true }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
export default models.Loan || model("Loan", LoanSchema);
