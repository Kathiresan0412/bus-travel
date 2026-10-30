import { model, models, Schema, Types } from "mongoose";

const RouteTripOptionSchema = new Schema({
  route: { type: String, required: true, trim: true, maxlength: 160 },
  tripLabel: { type: String, required: true, trim: true, maxlength: 100 },
  trip: { type: String, trim: true, maxlength: 100, default: "" },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Types.ObjectId, ref: "User", required: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, versionKey: false });
RouteTripOptionSchema.index({ route: 1, tripLabel: 1 });

export default models.RouteTripOption || model("RouteTripOption", RouteTripOptionSchema);
