import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import tenisRoute from "./routes/tenisRoute.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  console.log(req);
  return res.status(200).send("Server running!");
})

app.use("/tenis", tenisRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Conected to: MongoDB!🍃");
    app.listen(process.env.PORT, () => {
      console.log(`Server started at: http://localhost:${process.env.PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.log(error);
  })