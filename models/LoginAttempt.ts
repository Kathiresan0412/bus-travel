import { model, models, Schema } from "mongoose";
const LoginAttemptSchema = new Schema({ key: { type: String, required: true, unique: true }, count: { type: Number, default: 0 }, windowStartedAt: { type: Date, default: Date.now }, lockedUntil: { type: Date, default: null }, expiresAt: { type: Date, required: true } }, { versionKey: false });
LoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default models.LoginAttempt || model("LoginAttempt", LoginAttemptSchema);
