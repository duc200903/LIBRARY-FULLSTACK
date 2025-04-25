import express from "express";
import dotenv from "dotenv";
import { connectToDB } from "./config/db.js";
import User from "./models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import Book from "./models/book.model.js";
import path from "path"

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();

const PORT = process.env.PORT || 5000;

console.log("PORT is", process.env.PORT);

const __dirname = path.resolve();

//middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

//Sign up
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      throw new Error("All fields are required.");
    }

    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
      return res
        .status(400)
        .json({ message: "Username is taken, try another name." });
    }

    //hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    const userDoc = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    //JWT
    if (userDoc) {
      const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res
      .status(200)
      .json({ user: userDoc, message: "User create successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userDoc = await User.findOne({ email });

    if (!userDoc) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcryptjs.compareSync(
      password,
      userDoc.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    //jwt

    if (userDoc) {
      const token = jwt.sign({ id: userDoc._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      user: {
        id: userDoc._id,
        username: userDoc.username,
        email: userDoc.email,
      },
      message: "Logged in successfully.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fetch user

app.get("/api/fetch-user", async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const userDoc = await User.findById(decoded.id).select("-password");

    if (!userDoc) {
      return res.status(400).json({ message: "User not found." });
    }

    res.status(200).json({ user: userDoc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/logout", async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully." });
});

// ================= Book Functionalities====================

app.post("/api/add-book", async (req, res) => {
  const { image, title, subtitle, author, link, review } = req.body;
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Image processes
    const imageResponse = await cloudinary.uploader.upload(image, {
      folder: "/library",
    });

    console.log("Image Response:", imageResponse);

    const userDoc = await User.findById(decoded.id).select("-password");

    const book = await Book.create({
      image: imageResponse.secure_url,
      title,
      subtitle,
      author,
      link,
      review,
      user: userDoc,
    });

    return res.status(200).json({ book, message: "Book added successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/fetch-books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createAt: -1 });

    return res.status(200).json({ books });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || "";

    const books = await Book.find({
      title: { $regex: searchTerm, $options: "i" },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ books });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/fetch-book/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the book by ID and populate the user field with the username
    const book = await Book.findById(id).populate("user", ["username"]);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    return res.status(200).json({ book });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/delete-book/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const book = await Book.findById(id);

    // Delete the image first
    const parts = book.image.split("/");
    const filename = parts[parts.length - 1];

    const imageId = filename.split(".")[0];

    await cloudinary.uploader
      .destroy(`library/${imageId}`)
      .then((result) => console.log("result", result));

    // Delete the data from db

    await Book.findByIdAndDelete(id);

    return res.status(200).json({ message: "Book delete successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/update-book/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  const { image, title, subtitle, author, link, review } = req.body;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const book = await Book.findById(id);

    if (image) {
      // Delete the prev image first
      const parts = book.image.split("/");
      const filename = parts[parts.length - 1];

      const imageId = filename.split(".")[0];

      await cloudinary.uploader
        .destroy(`library/${imageId}`)
        .then((result) => console.log("result", result));

      // Upload new image

      const imageResponse = await cloudinary.uploader.upload(image, {
        folder: "/library",
      });

      // Update data in DB

      const updateBook = await Book.findByIdAndUpdate(id, {
        image: imageResponse.secure_url,
        title,
        subtitle,
        author,
        link,
        review,
      });
      return res
        .status(200)
        .json({ book: updateBook, message: "Book updated successfully." });
    }
    const updateBook = await Book.findByIdAndUpdate(id, {
      title,
      subtitle,
      author,
      link,
      review,
    });

    return res
      .status(200)
      .json({ book: updateBook, message: "Book updated successfully." });
  } catch {
    res.status(400).json({ message: error.message });
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, async () => {
  await connectToDB();
  console.log("Server started at PORT: ", PORT);
});
