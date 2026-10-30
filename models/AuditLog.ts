import { model, models, Schema, Types } from "mongoose";
const AuditLogSchema = new Schema({
  actor: { type: Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true }, resource: { type: String, required: true, index: true },
  resourceId: { type: String, default: null }, oldValue: { type: Schema.Types.Mixed, default: null },
  newValue: { type: Schema.Types.Mixed, default: null }, ipAddress: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}, { versionKey: false });
export default models.AuditLog || model("AuditLog", AuditLogSchema);
