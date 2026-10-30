import { model, models, Schema, Types } from "mongoose";
const EmployeeSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 }, role: { type: String, enum: ["driver", "conductor"], required: true, index: true },
  phone: { type: String, trim: true, maxlength: 30, default: "" }, licenseNumber: { type: String, trim: true, maxlength: 50, default: "" }, licenseExpiry: { type: Date, default: null },
  salaryType: { type: String, enum: ["fixed", "daily", "percentage"], default: "fixed" }, salaryAmountMinor: { type: Number, min: 0, default: 0 },
  assignedBus: { type: Types.ObjectId, ref: "Bus", default: null, index: true }, isActive: { type: Boolean, default: true },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
EmployeeSchema.index({ name: 1, role: 1 });
export default models.Employee || model("Employee", EmployeeSchema);
