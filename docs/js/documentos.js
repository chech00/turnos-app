document.addEventListener("DOMContentLoaded", function () {
    console.log("📂 documentos.js cargado con Cloudinary");

    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("main-content");
    const menuToggleBtns = document.querySelectorAll("#menu-toggle");
    const logoutBtn = document.getElementById("logout-btn");

    menuToggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            mainContent.classList.toggle("shift");
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            firebase.auth().signOut().then(() => {
                console.log("✅ Sesión cerrada correctamente.");
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("❌ Error al cerrar sesión:", error);
            });
        });
    }

    lucide.createIcons();

    // =============================
    //  Inicializar Firebase (Asegurar que existe antes de usarlo)
    // =============================
    const firebaseConfig = {
        apiKey: "AIzaSyB3shQDdWq--FxY7Q6-of9xkEXg5XWjJWM",
  authDomain: "asignacionturnos-cc578.firebaseapp.com",
  projectId: "asignacionturnos-cc578",
  storageBucket: "asignacionturnos-cc578.firebasestorage.app",
  messagingSenderId: "267782898691",
  appId: "1:267782898691:web:751f881080a7debd67fa36"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // =============================
    //  Configuración de Cloudinary
    // =============================
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dqaszkagj/upload"; 
    const UPLOAD_PRESET = "documentos_noc"; // 

    // ------------------------------
    // Autenticación de usuario y validación de rol
    // ------------------------------
    let currentUserRole = "";

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log("❌ No hay usuario autenticado. Redirigiendo...");
            window.location.href = "login.html";
            return;
        }

        try {
            console.log("✅ Usuario autenticado:", user.email);

            const userDoc = await db.collection("userRoles").doc(user.uid).get();
            if (userDoc.exists) {
                currentUserRole = userDoc.data().rol;
                console.log("🔹 Rol del usuario en Firestore:", currentUserRole);
            } else {
                console.log("❌ No se encontró información del rol en Firestore.");
                return;
            }

            configurarVistaDocumentos();
        } catch (error) {
            console.error("❌ Error al verificar el rol del usuario:", error);
        }
    });

    // ------------------------------
    // Configurar Vista de Documentos
    // ------------------------------
    function configurarVistaDocumentos() {
        const uploadSection = document.getElementById("upload-section");
        const uploadBtn = document.getElementById("upload-btn");

        console.log("🔄 Configurando vista de documentos...");
        console.log("🔹 Rol actual del usuario:", currentUserRole);

        if (currentUserRole === "admin") {
            console.log("✅ Mostrando opciones de administrador...");
            uploadSection.style.display = "block";
            if (uploadBtn) uploadBtn.style.display = "block";
        } else {
            console.log("🔒 Ocultando opciones de administración...");
            uploadSection.style.display = "none";
            if (uploadBtn) uploadBtn.style.display = "none";
        }

        loadFiles();
    }

    // ------------------------------
    // Inicializar eventos de subida de archivos
    // ------------------------------
    const uploadArea = document.getElementById("upload-area");
    const fileInput = document.getElementById("file-input");
    const uploadBtn = document.getElementById("upload-btn");

    if (uploadArea && fileInput && uploadBtn) {
        uploadArea.addEventListener("click", () => {
            console.log("✅ Click en upload-area detectado.");
            fileInput.click();
        });

        uploadBtn.addEventListener("click", subirArchivo);
    } else {
        console.error("❌ No se encontraron los elementos de subida.");
    }

    // ------------------------------
    // Subir archivo a Cloudinary (Solo Admin)
    // ------------------------------
    async function subirArchivo() {
        console.log("✅ Click en upload-btn detectado.");

        if (currentUserRole !== "admin") {
            Swal.fire({
                icon: "error",
                title: "Acceso Denegado",
                text: "❌ No tienes permisos para subir archivos.",
                confirmButtonColor: "#e74c3c"
            });
            return;
        }

        if (fileInput.files.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Selecciona un Archivo",
                text: "❌ Por favor, selecciona un archivo antes de subirlo.",
                confirmButtonColor: "#f39c12"
            });
            return;
        }

        const file = fileInput.files[0];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        try {
            Swal.fire({
                title: "Subiendo Archivo...",
                text: "Por favor espera mientras se sube el archivo.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(CLOUDINARY_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error en Cloudinary: ${response.statusText}`);
            }

            const data = await response.json();

            let documentos = JSON.parse(localStorage.getItem("documentosNoc")) || [];
            documentos.push({ fileName: file.name, url: data.secure_url, type: file.type });
            localStorage.setItem("documentosNoc", JSON.stringify(documentos));

            Swal.fire({
                icon: "success",
                title: "Archivo Subido",
                text: "✅ Tu archivo ha sido subido exitosamente.",
                confirmButtonColor: "#2ecc71"
            });

            fileInput.value = "";
            loadFiles();
        } catch (error) {
            console.error("❌ Error al subir archivo:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "❌ Hubo un problema al subir el archivo. Revisa la consola.",
                confirmButtonColor: "#e74c3c"
            });
        }
    }

    // ------------------------------
    // Cargar Documentos
    // ------------------------------
    function loadFiles() {
        const filesListDiv = document.getElementById("files-list");
        filesListDiv.innerHTML = "<p>🔄 Cargando archivos...</p>";
        let documentos = JSON.parse(localStorage.getItem("documentosNoc")) || [];

        filesListDiv.innerHTML = "";
        documentos.forEach((doc, index) => {
            const fileItem = document.createElement("li");
            fileItem.classList.add("file-item");
            fileItem.innerHTML = `
                <span><strong>${doc.fileName}</strong> (${doc.type})</span>
                <a href="${doc.url}" target="_blank">🔗 Ver/Descargar</a>
                ${currentUserRole === "admin" ? `<button class="delete-btn" onclick="deleteFile(${index})">❌ Eliminar</button>` : ""}
            `;

            filesListDiv.appendChild(fileItem);
        });
    }

    // ------------------------------
    // Eliminar Documento (Solo Admin)
    // ------------------------------
    window.deleteFile = function(index) {
        if (currentUserRole !== "admin") {
            Swal.fire({ icon: "error", title: "Acceso Denegado", text: "❌ No puedes eliminar archivos.", confirmButtonColor: "#e74c3c" });
            return;
        }

        let documentos = JSON.parse(localStorage.getItem("documentosNoc")) || [];
        documentos.splice(index, 1);
        localStorage.setItem("documentosNoc", JSON.stringify(documentos));
        Swal.fire({ icon: "success", title: "Archivo Eliminado", text: "✅ Archivo eliminado correctamente.", confirmButtonColor: "#2ecc71" });
        loadFiles();
    };

    loadFiles();
});
