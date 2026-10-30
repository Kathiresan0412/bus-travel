import { model, models, Schema, Types } from "mongoose";
const AdvanceSchema = new Schema({
  employee: { type: Types.ObjectId, ref: "Employee", required: true, index: true },
  kind: { type: String, enum: ["advance", "deduction"], required: true }, date: { type: Date, required: true, index: true },
  amountMinor: { type: Number, required: true, min: 1 }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
AdvanceSchema.index({ employee: 1, date: 1 });
export default models.Advance || model("Advance", AdvanceSchema);
