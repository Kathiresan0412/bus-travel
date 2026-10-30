import { model, models, Schema, Types } from "mongoose";
const DocumentSchema = new Schema({
  kind: { type: String, enum: ["insurance", "revenue_license", "permit", "fitness_emission", "driver_license", "other"], required: true, index: true },
  bus: { type: Types.ObjectId, ref: "Bus", default: null, index: true }, employee: { type: Types.ObjectId, ref: "Employee", default: null, index: true },
  reference: { type: String, trim: true, maxlength: 100, default: "" }, issuedAt: { type: Date, default: null }, expiryDate: { type: Date, required: true, index: true }, reminderDays: { type: Number, default: 30, min: 0, max: 365 }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
DocumentSchema.index({ expiryDate: 1, deletedAt: 1 });
export default models.Document || model("Document", DocumentSchema);
