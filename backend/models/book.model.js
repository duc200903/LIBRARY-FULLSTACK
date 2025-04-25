import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: String,
    author: { type: String, required: true },
    link: { type: String, required: true },
    review: String,
    user: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Book = mongoose.model.Book || mongoose.model("Book", bookSchema);

export default Book;
