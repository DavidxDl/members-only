const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, min: 3 },
  password: String,
  status: String,
  admin: Boolean,
});

userSchema.virtual("fullname").get(function () {
  return `${this.name} ${this.last_name}`;
});

module.exports = mongoose.model("User", userSchema);
