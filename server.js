require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Usar solo un puerto

app.use(express.json());
app.use(cors()); // ✅ Permite peticiones desde el frontend

// 🔹 Inicializar Firebase con credenciales desde variables de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = admin.firestore();
const auth = admin.auth();

// 📌 Ruta para enviar mensajes con botones a Telegram
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
        console.error("🔥 Error enviando mensaje a Telegram:", error?.response?.data || error);
        res.status(500).json({ error: "Error enviando mensaje a Telegram", details: error?.response?.data || error });
    }
});

// 📌 Ruta para manejar las respuestas de los botones de Telegram
app.post('/webhook-telegram', async (req, res) => {
    console.log("📩 Recibiendo datos de Telegram:", JSON.stringify(req.body, null, 2)); // ✅ Mejor log para Render

    const { callback_query } = req.body;

    if (!callback_query) {
        console.log("⚠️ No hay callback_query en la solicitud.");
        return res.status(400).json({ error: "No se recibió callback_query" });
    }

    const chatId = callback_query.message.chat.id;
    const userId = callback_query.from.id; // ID del usuario que responde
    const data = callback_query.data; // Ejemplo: "aceptar_12345" o "rechazar_12345"

    console.log(`✅ Callback recibido: ${data}`);

    try {
        if (data.startsWith("aceptar_")) {
            const turnoId = data.split("_")[1];

            // Guardar en Firebase
            await db.collection("turnos").doc(turnoId).set({
                estado: "Asignado",
                usuario: userId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
                {
                    chat_id: chatId,
                    text: `✅ Turno asignado correctamente. ¡Gracias por confirmar!`
                }
            );
        }

        if (data.startsWith("rechazar_")) {
            const turnoId = data.split("_")[1];

            // Enviar opciones de rechazo
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

        res.json({ success: true }); // ✅ Confirmamos a Telegram que la solicitud fue procesada correctamente
    } catch (error) {
        console.error("🔥 Error en webhook-telegram:", error);
        res.status(500).json({ error: "Error procesando el callback", details: error });
    }
});

// 📌 Ruta de prueba para verificar si el backend está funcionando
app.get("/", (req, res) => {
    res.send("🚀 Backend de Telegram Bot corriendo en Render");
});

// 🔹 Iniciar el servidor en el puerto correcto
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
