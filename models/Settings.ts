import { model, models, Schema, Types } from "mongoose";
const SettingsSchema = new Schema({
  businessName: { type: String, default: "Bus Finance Manager" }, currency: { type: String, default: "LKR" },
  dateFormat: { type: String, default: "dd/MM/yyyy" }, createdBy: { type: Types.ObjectId, ref: "User" },
  updatedBy: { type: Types.ObjectId, ref: "User" }
}, { timestamps: true, versionKey: false });
export default models.Settings || model("Settings", SettingsSchema);
