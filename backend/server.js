const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
console.log("🔑 BOT_TOKEN:", process.env.BOT_TOKEN);
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Permite peticiones desde el frontend


// Ruta para enviar mensajes de Telegram
app.post("/send-message", async (req, res) => {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        return res.status(400).json({ error: "Faltan chatId o message" });
    }

    const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });

        const data = await response.json();
        console.log("✅ Mensaje enviado:", data);
        res.json({ success: true, data });

    } catch (error) {
        console.error("🚨 Error enviando mensaje:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


