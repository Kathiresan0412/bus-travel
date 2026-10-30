import { model, models, Model, Schema } from "mongoose";

interface LoginAttemptRecord {
  key: string;
  count: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
  expiresAt: Date;
}

const LoginAttemptSchema = new Schema<LoginAttemptRecord>({ key: { type: String, required: true, unique: true }, count: { type: Number, default: 0 }, windowStartedAt: { type: Date, default: Date.now }, lockedUntil: { type: Date, default: null }, expiresAt: { type: Date, required: true } }, { versionKey: false });
LoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const LoginAttempt = (models.LoginAttempt as Model<LoginAttemptRecord> | undefined) || model<LoginAttemptRecord>("LoginAttempt", LoginAttemptSchema);
export default LoginAttempt;
