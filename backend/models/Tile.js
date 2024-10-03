import { Schema as _Schema, model } from "mongoose";

const Schema = _Schema;

const TileSchema = new Schema(
  {
    name: { type: String },
    url: { type: String }
  },
  { timestamps: true }
);

export default model("Tile", TileSchema);
