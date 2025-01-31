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

      // Redirigir al dashboard principal
      window.location.href = "index.html";
  } catch (error) {
      console.error("Error en el inicio de sesión:", error.message);

      // Mostrar mensaje de error más específico
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

// Mejoras de experiencia del usuario - Mostrar/Ocultar contraseña directamente en el campo
const passwordInput = document.getElementById("password");
const passwordGroup = document.querySelector(".form-group:nth-child(2)");

// Crear un contenedor para el campo de contraseña y el ícono
const passwordContainer = document.createElement("div");
passwordContainer.style.position = "relative";
passwordContainer.style.display = "flex";
passwordContainer.style.alignItems = "center";
passwordContainer.style.width = "100%";
passwordGroup.appendChild(passwordContainer);

// Reinsertar el input de contraseña original
passwordInput.style.flex = "1";
passwordInput.style.paddingRight = "40px";
passwordInput.style.boxSizing = "border-box";
passwordContainer.appendChild(passwordInput);

// Crear el ícono para mostrar/ocultar contraseña
const togglePasswordIcon = document.createElement("span");
togglePasswordIcon.innerHTML = "&#128065;"; // Icono de ojo

togglePasswordIcon.style.position = "absolute";
togglePasswordIcon.style.right = "10px";
togglePasswordIcon.style.top = "50%";
togglePasswordIcon.style.transform = "translateY(-50%)";
togglePasswordIcon.style.cursor = "pointer";
togglePasswordIcon.style.fontSize = "18px";
togglePasswordIcon.style.color = "#aaaaaa";

passwordContainer.appendChild(togglePasswordIcon);

togglePasswordIcon.addEventListener("click", () => {
  if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordIcon.innerHTML = "&#128064;"; // Icono de ojo abierto
      togglePasswordIcon.style.color = "#11689c";
  } else {
      passwordInput.type = "password";
      togglePasswordIcon.innerHTML = "&#128065;"; // Icono de ojo cerrado
      togglePasswordIcon.style.color = "#aaaaaa";
  }
});

// Agregar casilla de verificación para "Mantener sesión iniciada"
const rememberMeContainer = document.createElement("div");
rememberMeContainer.style.display = "flex";
rememberMeContainer.style.alignItems = "center";
rememberMeContainer.style.marginTop = "10px";

const rememberMeCheckbox = document.createElement("input");
rememberMeCheckbox.type = "checkbox";
rememberMeCheckbox.id = "remember-me";
rememberMeCheckbox.style.marginRight = "8px";

const rememberMeLabel = document.createElement("label");
rememberMeLabel.htmlFor = "remember-me";
rememberMeLabel.textContent = "Mantener sesión iniciada";
rememberMeLabel.style.color = "#aaaaaa";

rememberMeContainer.appendChild(rememberMeCheckbox);
rememberMeContainer.appendChild(rememberMeLabel);
document.querySelector(".login-form").insertBefore(rememberMeContainer, document.querySelector(".forgot-password"));

// Validaciones en tiempo real
const emailInput = document.getElementById("email");
emailInput.addEventListener("input", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailInput.style.borderColor = emailRegex.test(emailInput.value) ? "#11689c" : "#ff4d4f";
});
passwordInput.addEventListener("input", () => {
  passwordInput.style.borderColor = passwordInput.value.length >= 6 ? "#11689c" : "#ff4d4f";
});

// Asegurar consistencia entre todos los inputs
document.querySelectorAll(".form-group input").forEach(input => {
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.padding = "12px";
  input.style.margin = "0";
});
