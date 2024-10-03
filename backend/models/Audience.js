import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const AudienceSchema = new Schema(
  {
    role: { type: String, required: true, unique: true },
    tiles: [{ type: 'ObjectId', ref: 'Tile', default: [{type: 'ObjectId'}]}],
    isActive: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    seeNotes: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default model("Audience", AudienceSchema);
