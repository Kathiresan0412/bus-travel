import { model, models, Schema, Types } from "mongoose";
const SalaryRecordSchema = new Schema({
  employee: { type: Types.ObjectId, ref: "Employee", required: true, index: true }, period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  grossMinor: { type: Number, required: true, min: 0 }, advanceDeductionMinor: { type: Number, min: 0, default: 0 }, otherDeductionMinor: { type: Number, min: 0, default: 0 },
  netMinor: { type: Number, required: true, min: 0 }, status: { type: String, enum: ["draft", "paid"], default: "draft" }, paidAt: { type: Date, default: null }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
SalaryRecordSchema.index({ employee: 1, period: 1 }, { unique: true });
export default models.SalaryRecord || model("SalaryRecord", SalaryRecordSchema);
