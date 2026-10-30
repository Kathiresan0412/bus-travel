import { model, models, Schema } from "mongoose";
const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true, enum: ["owner", "manager", "driver", "viewer"] },
  label: { type: String, required: true }, description: { type: String, default: "" },
  permissions: { type: [String], default: [] }, isSystem: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });
export default models.Role || model("Role", RoleSchema);
