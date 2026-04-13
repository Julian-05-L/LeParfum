import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

export const config = {
    api: {
        bodyParser: false
    }
};

export default function handler(req, res){
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(500).json({ error: 'Error al subir el archivo' });

        try {
            const result = new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "perfumes" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            res.status(200).json({ url: result.secure_url });
        } catch (error) {
            res.status(500).json({ error: 'Error al subir a Cloudinary' });
        }
    });
};