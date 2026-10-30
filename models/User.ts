import { model, models, Schema, Types } from "mongoose";
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: Types.ObjectId, ref: "Role", required: true, index: true },
  assignedBus: { type: Types.ObjectId, ref: "Bus", default: null },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Types.ObjectId, ref: "User", default: null }, updatedBy: { type: Types.ObjectId, ref: "User", default: null },
  deletedAt: { type: Date, default: null, index: true }
}, { timestamps: true, versionKey: false });
export default models.User || model("User", UserSchema);
