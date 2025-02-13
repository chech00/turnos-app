const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
require("dotenv").config();


const { createClient } = require("@supabase/supabase-js");

// Configurar Supabase con variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Permitir peticiones desde el frontend

// Configurar Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


async function enviarMensajeTelegram(mensaje) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
      const usersSnapshot = await db.collection("usuarios").where("telegram_id", "!=", null).get();
      
      if (usersSnapshot.empty) {
          console.log("❌ No hay usuarios con Telegram ID en Firebase.");
          return;
      }

      usersSnapshot.forEach(async (doc) => {
          const chat_id = doc.data().telegram_id;
          console.log(`📩 Enviando mensaje a: ${chat_id}`);  // <-- 🔍 Verifica qué chat_id obtiene

          try {
              const response = await axios.post(url, {
                  chat_id: chat_id,
                  text: mensaje,
              });
              console.log(`✅ Mensaje enviado a ${chat_id}:`, response.data);
          } catch (error) {
              console.error(`❌ Error enviando mensaje a ${chat_id}:`, error.response ? error.response.data : error.message);
          }
      });

  } catch (error) {
      console.error("❌ Error obteniendo usuarios de Firebase:", error.message);
  }
}

app.post("/send-message", async (req, res) => {
  try {
      const { chatId, message } = req.body;

      if (!chatId || !message) {
          return res.status(400).json({ error: "Faltan datos (chatId o mensaje)." });
      }

      const BOT_TOKEN = process.env.BOT_TOKEN;
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

      const response = await axios.post(url, {
          chat_id: chatId,
          text: message,
      });

      console.log(`✅ Mensaje enviado a ${chatId}:`, response.data);
      res.json({ success: true, response: response.data });

  } catch (error) {
      console.error(`❌ Error enviando mensaje a ${req.body.chatId}:`, error.message);
      res.status(500).json({ error: "Error al enviar el mensaje a Telegram." });
  }
});


/**
 * 📤 SUBIR ARCHIVO A SUPABASE STORAGE
 */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha seleccionado ningún archivo." });
    }

    // Generar un nombre único para el archivo
    const fileName = `${Date.now()}-${req.file.originalname}`;

    // Subir el archivo a Supabase Storage (bucket "documentos-noc")
    const { data, error } = await supabase.storage
      .from("documentos-noc")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (error) {
      throw error;
    }

    // Obtener la URL pública del archivo
    const { publicURL } = supabase.storage.from("documentos-noc").getPublicUrl(fileName);

    // Enviar un mensaje a Telegram notificando la subida del archivo
    await enviarMensajeTelegram(`Nuevo archivo subido: ${fileName}`);

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

    // Enviar mensaje a Telegram notificando la eliminación del archivo
    await enviarMensajeTelegram(`Archivo eliminado: ${fileName}`);

    return res.json({ success: true, message: "Archivo eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    return res.status(500).json({ error: "Error al eliminar archivo." });
  }
});

app.get("/prueba-telegram", async (req, res) => {
    try {
      await enviarMensajeTelegram("Mensaje de prueba desde el servidor");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error al enviar mensaje de prueba" });
    }
  });
  
  
/**
 * 🌐 INICIAR EL SERVIDOR
 */
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
