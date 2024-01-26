const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true },
  timestamp: Date,
  text: { type: String, required: true },
  username: { type: ObjectId, ref: "User", required: true },
});

postSchema.virtual("url").get(function () {
  return `/post/${this._id}/delete`;
});

module.exports = mongoose.model("Post", postSchema);
