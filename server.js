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

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);


// Ruta para enviar mensajes de Telegram
app.post('/send-message', async (req, res) => {
    const { chatId, message, turnoId } = req.body;

    if (!chatId || !message || !turnoId) {
        return res.status(400).json({ error: "Faltan chatId, message o turnoId" });
    }

    try {
        const response = await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ Aceptar", callback_data: `aceptar_${turnoId}` },
                            { text: "❌ Rechazar", callback_data: `rechazar_${turnoId}` }
                        ]
                    ]
                }
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


app.post('/webhook-telegram', async (req, res) => {
    const { callback_query } = req.body;

    if (!callback_query) {
        return res.sendStatus(400);
    }

    const chatId = callback_query.message.chat.id;
    const data = callback_query.data; // Esto puede ser "aceptar_turnoId" o "rechazar_turnoId"

    if (data.startsWith("aceptar_")) {
        const turnoId = data.split("_")[1];

        await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
            {
                chat_id: chatId,
                text: `✅ Has aceptado el turno asignado. ¡Gracias!`
            }
        );

        // Aquí podríamos actualizar la base de datos con la asignación del turno
    }

    if (data.startsWith("rechazar_")) {
        const turnoId = data.split("_")[1];

        // Enviar mensaje con opciones de rechazo
        await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
            {
                chat_id: chatId,
                text: "⚠️ Has rechazado el turno. Selecciona un motivo:",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🏖️ Vacaciones", callback_data: `motivo_vacaciones_${turnoId}` },
                            { text: "🩺 Licencia", callback_data: `motivo_licencia_${turnoId}` }
                        ],
                        [
                            { text: "📌 Motivos Personales", callback_data: `motivo_personal_${turnoId}` }
                        ]
                    ]
                }
            }
        );
    }

    res.sendStatus(200);
});

app.listen(3000, () => console.log("Servidor corriendo en el puerto 3000"));
module.exports = { auth, db };