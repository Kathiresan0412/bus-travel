import { model, models, Schema, Types } from "mongoose";
const BusSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  registrationNumber: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
  route: { type: String, trim: true, default: "", maxlength: 160 }, seatCapacity: { type: Number, min: 1, max: 100, default: null },
  purchaseDate: { type: Date, default: null }, status: { type: String, enum: ["active", "in_service", "sold"], default: "active", index: true },
  assignedDriver: { type: Types.ObjectId, ref: "Employee", default: null }, assignedConductor: { type: Types.ObjectId, ref: "Employee", default: null },
  currentOdometerKm: { type: Number, min: 0, default: 0 }, notes: { type: String, maxlength: 1000, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
BusSchema.index({ registrationNumber: 1 }, { unique: true });
export default models.Bus || model("Bus", BusSchema);
