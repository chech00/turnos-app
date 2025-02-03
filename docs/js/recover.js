"use strict";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB3shQDdWq--FxY7Q6-of9xkEXg5XWjJWM",
  authDomain: "asignacionturnos-cc578.firebaseapp.com",
  projectId: "asignacionturnos-cc578",
  storageBucket: "asignacionturnos-cc578.firebasestorage.app",
  messagingSenderId: "267782898691",
  appId: "1:267782898691:web:751f881080a7debd67fa36"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Elementos del DOM
const emailInput = document.getElementById("recover-email");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");
const spinner = document.getElementById("loading-spinner");

// Validación en tiempo real del correo
emailInput.addEventListener("input", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailInput.style.borderColor = emailRegex.test(emailInput.value)
    ? "#4caf50"   // Verde para correo válido
    : "#ff5252";  // Rojo para correo inválido
});

// Manejo del envío del formulario
document.getElementById("recover-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  errorMessage.textContent = "";
  successMessage.textContent = "";
  spinner.style.display = "block";

  if (!email) {
    errorMessage.textContent = "Por favor, ingresa un correo válido.";
    spinner.style.display = "none";
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    spinner.style.display = "none";
    successMessage.textContent = "Correo de recuperación enviado. Revisa tu bandeja de entrada.";
    
    // Redirige al login después de 5 segundos
    setTimeout(() => {
      window.location.href = "login.html";
    }, 5000);
  } catch (error) {
    spinner.style.display = "none";
    if (error.code === "auth/user-not-found") {
      errorMessage.textContent = "El correo ingresado no está registrado.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage.textContent = "El formato del correo no es válido.";
    } else {
      errorMessage.textContent = "Ocurrió un error al procesar tu solicitud. Intenta nuevamente.";
    }
  }
});
