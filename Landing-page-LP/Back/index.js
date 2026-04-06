import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";
import Perfume from "./models/Perfume.js";
import User from "./models/User.js";

dotenv.config();

// Desactivar caché de sharp para evitar bloqueos de archivos en Windows/OneDrive
sharp.cache(false);

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
// Una petición a /img/file.png buscará en public/img/file.png
// Una petición a /uploads/file.webp buscará en public/uploads/file.webp
app.use(express.static("public"));

// Configuración de Multer para subir imágenes
// Usamos memoryStorage para tener el archivo en buffer y procesarlo con Sharp antes de guardar
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.error("Error Mongo:", err));

// Ruta para obtener perfumes (con filtro opcional por marca)
app.get("/perfumes", async (req, res) => {
    try {
    const { marca } = req.query;

    let filtro = {};
    if (marca) {
        // Búsqueda flexible: ignora mayúsculas y espacios al inicio/final
        filtro = { marca: { $regex: new RegExp(`^\\s*${marca}\\s*$`, 'i') } };
    }

    // Usamos una agregación para poder ordenar por categoría de forma personalizada
    const perfumes = await Perfume.aggregate([
        // 1. Filtramos por marca si es necesario
        { $match: filtro },
        // 2. Añadimos un campo temporal para el orden
        {
            $addFields: {
                categoryOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: [{ $toLower: "$categoria" }, "masculino"] }, then: 1 },
                            { case: { $eq: [{ $toLower: "$categoria" }, "femenino"] }, then: 2 },
                            { case: { $eq: [{ $toLower: "$categoria" }, "unisex"] }, then: 3 }
                        ],
                        default: 4 // Otros casos van al final
                    }
                }
            }
        },
        // 3. Ordenamos por nuestro campo personalizado y luego por nombre
        { $sort: { categoryOrder: 1, nombre: 1 } }
    ]);

    res.json(perfumes);
    } catch (error) {
    res.status(500).json({ error: "Error al obtener perfumes" });
    }
});

// Endpoint de Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        // 1. Buscar el usuario
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        // 2. Comparar contraseñas
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });

        res.json({ message: "Login exitoso", isAdmin: true });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Función auxiliar para reintentar la escritura de archivos en caso de bloqueo (común en OneDrive)
async function writeFileWithRetry(filePath, data, retries = 3, delay = 100) {
    for (let i = 0; i < retries; i++) {
        try {
            await fs.promises.writeFile(filePath, data);
            return; // Si tiene éxito, salimos de la función
        } catch (err) {
            if (i === retries - 1) throw err; // Si es el último reintento, lanzamos el error
            console.warn(`Reintento ${i + 1} de escritura de archivo debido a: ${err.message}`);
            // Esperamos un poco antes de volver a intentar (aumentando el tiempo en cada reintento)
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// Endpoint para subir imagen
app.post("/upload", upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        // Forzamos la ruta a ser absoluta y limpia
        const dir = path.resolve(__dirname, 'public', 'uploads');

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(dir, filename);

        // --- CAMBIO CLAVE ---
        // 1. Procesamos la imagen y obtenemos el buffer
        const buffer = await sharp(req.file.buffer)
            .ensureAlpha() // Asegura que maneje bien transparencias de PNG
            .webp({ quality: 80, lossless: false })
            .toBuffer();

        // 2. Escribimos el archivo usando la función con reintentos para evitar errores de OneDrive
        await writeFileWithRetry(filepath, buffer);
        
        console.log(`Imagen guardada exitosamente: ${filename}`);
        res.json({ path: `uploads/${filename}` });

    } catch (error) {
        console.error("Error detallado en Sharp:", error);
        res.status(500).json({ 
            error: "Error al procesar la imagen", 
            details: error.message 
        });
    }
});

// Endpoint para AGREGAR perfumes (Solo Admin debería usarlo, pero por ahora lo dejamos abierto para que funcione con tu form)
app.post("/perfumes", async (req, res) => {
    try {
        const nuevoPerfume = new Perfume(req.body);
        await nuevoPerfume.save();
        res.status(201).json(nuevoPerfume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al guardar el perfume" });
    }
});

// Endpoint para convertir imágenes existentes a WebP (USO ÚNICO)
// Visita http://localhost:3000/convert-images en tu navegador UNA SOLA VEZ para ejecutar.
/*app.get("/convert-images", async (req, res) => {
    try {
        const perfumes = await Perfume.find({});
        let convertedCount = 0;
        let errors = [];

        for (const perfume of perfumes) {
            const imagePath = perfume.imagen;

            // Omitir si no hay imagen, ya es webp, es una URL externa o es el placeholder
            if (!imagePath || imagePath.endsWith('.webp') || imagePath.startsWith('http') || imagePath.includes('placeholder.jpg')) {
                continue;
            }

            // Normalizamos la ruta (quitamos barra inicial si la tiene)
            let relativePath = imagePath.replace(/\\/g, '/');
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);

            // Definimos la ruta hacia la carpeta 'public' del Frontend
            // process.cwd() es la carpeta 'Back', así que subimos un nivel y entramos a 'Front/public'
            const frontPublicPath = path.resolve(process.cwd(), '../Front/public');
            
            // Construimos la ruta completa. NO quitamos 'img/' porque esa carpeta existe físicamente en Front/public
            let oldFilePath = path.join(frontPublicPath, relativePath);

            // Verificación de seguridad: si no está en Front, miramos en Back (fallback)
            if (!fs.existsSync(oldFilePath)) {
                oldFilePath = path.join(process.cwd(), 'public', relativePath);
            }

            if (fs.existsSync(oldFilePath)) {
                try {
                    const dirName = path.dirname(oldFilePath);
                    const fileName = path.basename(oldFilePath, path.extname(oldFilePath)) + '.webp';
                    const newFilePath = path.join(dirName, fileName);

                    await sharp(oldFilePath).webp({ quality: 80 }).toFile(newFilePath);
                    
                    // Actualizar BD manteniendo la ruta original pero con extensión .webp
                    const pathInfo = path.parse(imagePath);
                    const newDbPath = path.join(pathInfo.dir, pathInfo.name + '.webp').replace(/\\/g, '/');
                    perfume.imagen = newDbPath;
                    
                    await perfume.save();
                    
                    // Intentar borrar el archivo viejo con tolerancia a fallos (OneDrive/Locks)
                    try {
                        await new Promise(resolve => setTimeout(resolve, 200)); // Pausa de 200ms para liberar locks
                        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
                    } catch (unlinkErr) {
                        console.warn(`Advertencia: Se convirtió ${fileName} pero no se pudo borrar el original: ${unlinkErr.message}`);
                    }
                    
                    convertedCount++;
                } catch (e) {
                    errors.push(`Error con ${imagePath}: ${e.message}`);
                }
            } else {
                // Solo reportar como error si NO es un archivo que ya se convirtió parcialmente antes
                // (A veces la BD no se actualizó pero el archivo ya se borró en un intento previo)
                errors.push(`Archivo físico no encontrado para convertir: ${oldFilePath}`);
            }
        }

        res.json({ message: `Proceso finalizado.`, converted: convertedCount, errors: errors });

    } catch (error) {
        console.error("Error general en la conversión:", error);
        res.status(500).json({ error: "Error fatal durante el proceso de conversión." });
    }
});*/

// Endpoint para ACTUALIZAR perfume
app.put("/perfumes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPerfume = await Perfume.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedPerfume);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar el perfume" });
    }
});

// Endpoint para ELIMINAR perfume
app.delete("/perfumes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPerfume = await Perfume.findByIdAndDelete(id);
        if (!deletedPerfume) {
            return res.status(404).json({ error: "Perfume no encontrado" });
        }
        res.json({ message: "Perfume eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar el perfume" });
    }
});

// Exportar para Vercel
export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log("Backend en http://localhost:3000"));
}
