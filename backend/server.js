const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Configurar Supabase con variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend

// Configurar Multer para manejar la subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * 📤 SUBIR ARCHIVO A SUPABASE STORAGE
 */
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se ha seleccionado ningún archivo." });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const { data, error } = await supabase.storage
            .from("documentos-noc")
            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

        if (error) {
            throw error;
        }

        // Obtener la URL pública del archivo
        const { publicURL } = supabase
            .storage
            .from("documentos-noc")
            .getPublicUrl(fileName);

        return res.json({ success: true, url: publicURL, fileName: fileName });
    } catch (error) {
        console.error("❌ Error al subir archivo:", error);
        return res.status(500).json({ error: "Error al subir el archivo." });
    }
});

/**
 * 📂 LISTAR ARCHIVOS EN SUPABASE STORAGE
 */
app.get("/files", async (req, res) => {
    try {
        const { data, error } = await supabase.storage.from("documentos-noc").list();

        if (error) {
            throw error;
        }

        const files = data.map((file) => ({
            name: file.name,
            url: `${process.env.SUPABASE_URL}/storage/v1/object/public/documentos-noc/${file.name}`,
        }));

        return res.json(files);
    } catch (error) {
        console.error("❌ Error al obtener archivos:", error);
        return res.status(500).json({ error: "Error al obtener archivos." });
    }
});

/**
 * ❌ ELIMINAR ARCHIVO DE SUPABASE STORAGE
 */
app.delete("/delete/:fileName", async (req, res) => {
    try {
        const fileName = req.params.fileName;

        const { error } = await supabase.storage.from("documentos-noc").remove([fileName]);

        if (error) {
            throw error;
        }

        return res.json({ success: true, message: "Archivo eliminado correctamente." });
    } catch (error) {
        console.error("❌ Error al eliminar archivo:", error);
        return res.status(500).json({ error: "Error al eliminar archivo." });
    }
});

/**
 * 🌐 INICIAR EL SERVIDOR
 */
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
