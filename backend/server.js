require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Permite peticiones desde el frontend

// Ruta para enviar mensajes de Telegram
app.post('/send-message', async (req, res) => {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        return res.status(400).json({ error: "Faltan chatId o message" });
    }

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
            {
                chat_id: chatId,
                text: message
            }
        );

        res.json({ success: true, response: response.data });
    } catch (error) {
        res.status(500).json({ error: "Error enviando mensaje", details: error.response.data });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


