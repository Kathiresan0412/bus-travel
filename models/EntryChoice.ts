import { model, models, Schema, Types } from "mongoose";

const EntryChoiceSchema = new Schema({
  kind: { type: String, enum: ["route", "tripLabel"], required: true, index: true },
  value: { type: String, required: true, trim: true, maxlength: 160 },
  createdBy: { type: Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Types.ObjectId, ref: "User", required: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, versionKey: false });
EntryChoiceSchema.index({ kind: 1, value: 1, deletedAt: 1 });

export default models.EntryChoice || model("EntryChoice", EntryChoiceSchema);
