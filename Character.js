const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    series: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    images: {
      type: [String], // array of image URLs
      default: [],
    },
    videoId: {
      type: String, // YouTube video ID
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    isTopCharacter: {
      type: Boolean,
      default: false,
    },
    isFanFavorite: {
      type: Boolean,
      default: false,
    },
    sources: {
      anilistId: { type: String, default: "" },
      malId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Character", characterSchema);
