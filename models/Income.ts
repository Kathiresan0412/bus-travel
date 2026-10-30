import { model, models, Schema, Types } from "mongoose";
const IncomeSchema = new Schema({
  date: { type: Date, required: true, index: true }, bus: { type: Types.ObjectId, ref: "Bus", required: true, index: true },
  route: { type: String, trim: true, maxlength: 160, default: "" }, tripLabel: { type: String, trim: true, maxlength: 100, default: "" }, trip: { type: String, trim: true, maxlength: 100, default: "" },
  ticketCollectionMinor: { type: Number, required: true, min: 0 }, otherIncomeMinor: { type: Number, min: 0, default: 0 },
  otherIncomeType: { type: String, trim: true, maxlength: 80, default: "" }, driver: { type: Types.ObjectId, ref: "Employee", default: null }, conductor: { type: Types.ObjectId, ref: "Employee", default: null }, notes: { type: String, maxlength: 1000, default: "" },
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, updatedBy: { type: Types.ObjectId, ref: "User", required: true }, deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
IncomeSchema.index({ bus: 1, date: 1 });
export default models.Income || model("Income", IncomeSchema);
