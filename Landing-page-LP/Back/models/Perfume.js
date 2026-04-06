import mongoose from "mongoose";

const perfumeSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    imagen: {
        type: String,
        required: true
    },
    marca: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    }
});

export default mongoose.model(
  "Perfume",      // Nombre del MODELO (singular)
    perfumeSchema,
  "Perfumes"      // Nombre EXACTO de la colección en MongoDB
);
