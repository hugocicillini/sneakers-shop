import express from "express";
import { Tenis } from "../models/tenisModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let query = {};

    if (req.query.search && req.query.search !== "todos") {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = {
        $or: [
          { brand: searchRegex },
          { name: searchRegex }
        ]
      };
    }

    const tenis = await Tenis.find(query);

    return res.status(200).json({
      count: tenis.length,
      data: tenis,
    });
  } catch (error) {
    console.error("Erro ao buscar tênis:", error);
    res.status(500).send({ message: "Erro ao buscar tênis." });
  }
});

router.post("/", async (req, res) => {
  try {
    const tenis = req.body;
    const newTenis = new Tenis(tenis);
    await newTenis.save();
    res.status(201).json(newTenis);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

export default router;
