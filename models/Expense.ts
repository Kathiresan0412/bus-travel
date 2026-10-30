import { model, models, Schema, Types } from "mongoose";
const ExpenseSchema = new Schema({
  date: { type: Date, required: true, index: true }, bus: { type: Types.ObjectId, ref: "Bus", default: null, index: true }, route: { type: String, trim: true, maxlength: 160, default: "" }, tripLabel: { type: String, trim: true, maxlength: 100, default: "" }, trip: { type: String, trim: true, maxlength: 100, default: "" }, isShared: { type: Boolean, default: false },
  allocations: [{ bus: { type: Types.ObjectId, ref: "Bus", required: true }, ratioBps: { type: Number, required: true, min: 1, max: 10000 }, amountMinor: { type: Number, required: true, min: 0 } }],
  category: { type: Types.ObjectId, ref: "ExpenseCategory", required: true, index: true }, amountMinor: { type: Number, required: true, min: 1 }, currency: { type: String, default: "LKR", maxlength: 3 },
  paymentMethod: { type: String, enum: ["cash", "bank", "card"], default: "cash" }, vendor: { type: String, trim: true, maxlength: 120, default: "" }, receiptUrl: { type: String, default: "" }, notes: { type: String, maxlength: 1000, default: "" },
  fuelLitres: { type: Number, min: 0, default: null }, pricePerLitreMinor: { type: Number, min: 0, default: null }, odometerKm: { type: Number, min: 0, default: null },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
ExpenseSchema.index({ bus: 1, date: 1 }); ExpenseSchema.index({ category: 1, date: 1 });
export default models.Expense || model("Expense", ExpenseSchema);
