import { model, models, Schema, Types } from "mongoose";
const MaintenanceRecordSchema = new Schema({
  bus: { type: Types.ObjectId, ref: "Bus", required: true, index: true }, kind: { type: String, enum: ["service", "repair", "inspection", "other"], default: "service" },
  date: { type: Date, required: true, index: true }, odometerKm: { type: Number, min: 0, default: null }, description: { type: String, required: true, trim: true, maxlength: 500 }, costMinor: { type: Number, min: 0, default: 0 },
  nextServiceDate: { type: Date, default: null }, nextServiceOdometerKm: { type: Number, min: 0, default: null }, note: { type: String, maxlength: 500, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
export default models.MaintenanceRecord || model("MaintenanceRecord", MaintenanceRecordSchema);
