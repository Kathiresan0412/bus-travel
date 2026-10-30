import { model, models, Schema } from "mongoose";
const PermissionSchema = new Schema({
  key: { type: String, required: true, unique: true }, resource: { type: String, required: true },
  action: { type: String, required: true }, description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
export default models.Permission || model("Permission", PermissionSchema);
