import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import multer from "multer";

import Perfume from "../models/Perfume.js";
import User from "../models/User.js";

dotenv.config();

const app = express();

// ⚠️ IMPORTANTE: config CORS para Vercel
app.use(cors({
    origin: "*",
}));

app.use(express.json());

// ⚠️ MULTER en memoria (sin fs)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Conexión Mongo (IMPORTANTE en serverless)
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
}

// ----------------------
// TEST
// ----------------------
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "API funcionando" });
});

// ----------------------
// GET PERFUMES
// ----------------------
app.get("/perfumes", async (req, res) => {
    try {
        await connectDB();

        const { marca } = req.query;

        let filtro = {};
        if (marca) {
            filtro = {
                marca: { $regex: new RegExp(`^\\s*${marca}\\s*$`, 'i') }
            };
        }

        const perfumes = await Perfume.find(filtro).sort({ nombre: 1 });

        res.json(perfumes);

    } catch (error) {
        console.error("ERROR BACK:", error);
        res.status(500).json({ error: error.message });
    }
});

// ----------------------
// LOGIN
// ----------------------
app.post("/login", async (req, res) => {
    try {
        await connectDB();

        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        res.json({ message: "Login exitoso", isAdmin: true });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------
// ⚠️ UPLOAD SIMULADO (SIN FS)
// ----------------------
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        // ⚠️ En Vercel NO podés guardar archivos
        // Solución: usar URL directa o base64 (temporal)

        return res.json({
            path: "https://via.placeholder.com/300"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------
// CREATE
// ----------------------
app.post("/perfumes", async (req, res) => {
    try {
        await connectDB();

        const nuevo = new Perfume(req.body);
        await nuevo.save();

        res.status(201).json(nuevo);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------
// UPDATE
// ----------------------
app.put("/perfumes/:id", async (req, res) => {
    try {
        await connectDB();

        const updated = await Perfume.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ----------------------
// DELETE
// ----------------------
app.delete("/perfumes/:id", async (req, res) => {
    try {
        await connectDB();

        await Perfume.findByIdAndDelete(req.params.id);

        res.json({ message: "Eliminado" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// EXPORT VERCEL
export default app;