require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Permite peticiones desde el frontend

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;

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

// Inicializar Firebase en el backend
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();

// 📌 Ruta para iniciar sesión con Firebase
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await auth.getUserByEmail(email);
        res.json({ success: true, message: "Login exitoso", uid: user.uid });
    } catch (error) {
        res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
});


// 📌 Función para enviar mensaje con botones interactivos
async function enviarMensajeConBotones(chatId) {
    const messageText = "Tienes un nuevo turno asignado. ¿Quieres aceptarlo?";
    
    const options = {
        chat_id: chatId,
        text: messageText,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Aceptar", callback_data: "aceptar_turno" },
                    { text: "❌ Rechazar", callback_data: "rechazar_turno" }
                ]
            ]
        }
    };

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, options);
        console.log("Mensaje enviado:", response.data);
    } catch (error) {
        console.error("Error enviando mensaje:", error.response?.data || error.message);
    }
}

// 📌 Ruta para probar enviar el mensaje con botones
app.post('/send-shift-message', async (req, res) => {
    const { chatId } = req.body;

    if (!chatId) {
        return res.status(400).json({ error: "Falta el chatId" });
    }

    await enviarMensajeConBotones(chatId);
    res.json({ success: true, message: "Mensaje enviado con éxito." });
});


app.listen(3000, () => console.log("Servidor corriendo en el puerto 3000"));
module.exports = { auth, db };