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

    const emailInput = document.getElementById("recover-email");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const spinner = document.getElementById("loading-spinner");

    emailInput.addEventListener("input", () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(emailInput.value)) {
            emailInput.style.borderColor = "#4caf50"; // Verde válido
        } else {
            emailInput.style.borderColor = "#ff5252"; // Rojo inválido
        }
    });

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
