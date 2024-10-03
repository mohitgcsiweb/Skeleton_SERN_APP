import { Schema as _Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const Schema = _Schema;

const UserSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    password: { type: String },
    email: { type: String, required: true, unique: true },
    resetToken: { type: String },
    isMfaEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    mfaSecret: { type: String },
    audience: { type: "ObjectId", ref: "Audience" },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(this.password);
  }
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default model("User", UserSchema);
