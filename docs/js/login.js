"use strict";

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
const db = firebase.firestore();

// Manejo del inicio de sesión
document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessageElement = document.getElementById("error-message");

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("Usuario autenticado:", user);

    // Limpiar mensaje de error en caso de éxito
    errorMessageElement.style.display = "none";
    errorMessageElement.textContent = "";

    // Redirigir según rol (admin o usuario)
    const userDoc = await db.collection("userRoles").doc(user.uid).get();
    const userRole = userDoc.data().rol;
    if (userRole === "admin") {
      window.location.href = "index.html";
    } else {
      window.location.href = "user.html";
    }
  } catch (error) {
    console.error("Error en el inicio de sesión:", error.message);
    errorMessageElement.style.display = "block";
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessageElement.textContent = "El correo ingresado no está registrado.";
        break;
      case 'auth/wrong-password':
        errorMessageElement.textContent = "La contraseña ingresada es incorrecta.";
        break;
      case 'auth/invalid-email':
        errorMessageElement.textContent = "El formato del correo no es válido.";
        break;
      default:
        errorMessageElement.textContent = "Ocurrió un error inesperado. Por favor, intenta nuevamente.";
    }
  }
});

// ---------------------------
// Toggle para mostrar/ocultar contraseña
// ---------------------------
const passwordInput = document.getElementById("password");
const formGroupPassword = passwordInput.parentElement;

// Crear un contenedor para el input y el ícono
const passwordContainer = document.createElement("div");
passwordContainer.className = "password-container";
formGroupPassword.appendChild(passwordContainer);

// Mover el input al contenedor
passwordContainer.appendChild(passwordInput);

// Crear el ícono para toggle de visibilidad
const togglePasswordIcon = document.createElement("span");
togglePasswordIcon.className = "toggle-password";
togglePasswordIcon.innerHTML = "&#128065;"; // Icono de ojo cerrado
passwordContainer.appendChild(togglePasswordIcon);

// Evento para mostrar/ocultar contraseña
togglePasswordIcon.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordIcon.innerHTML = "&#128064;"; // Icono de ojo abierto
    togglePasswordIcon.style.color = "#8e44ad";
  } else {
    passwordInput.type = "password";
    togglePasswordIcon.innerHTML = "&#128065;";
    togglePasswordIcon.style.color = "#ccc";
  }
});

// ---------------------------
// Validaciones en tiempo real
// ---------------------------
const emailInput = document.getElementById("email");
emailInput.addEventListener("input", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailInput.style.borderColor = emailRegex.test(emailInput.value) ? "#8e44ad" : "#ff4d4f";
});

passwordInput.addEventListener("input", () => {
  passwordInput.style.borderColor = passwordInput.value.length >= 6 ? "#8e44ad" : "#ff4d4f";
});

// Asegurar consistencia en el estilo de los inputs
document.querySelectorAll(".form-group input").forEach(input => {
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
});
