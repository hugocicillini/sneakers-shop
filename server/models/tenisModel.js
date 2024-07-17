import mongoose from "mongoose";

const tenisSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    unique: true,
  },
  brand: {
    type: String,
    required: true,
  },
});

export const Tenis = mongoose.model("Tenis", tenisSchema);