const auth = window.auth;
const db = window.db;

document.addEventListener("DOMContentLoaded", function () {
    console.log("📂 documentos.js cargado con Supabase");

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
    //  Configuración de Supabase
    // =============================
    const API_BASE_URL = "http://localhost:3000"; // Reemplaza con la URL de tu backend en producción

    // ------------------------------
    // Autenticación de usuario y validación de rol
    // ------------------------------
    let currentUserRole = "";

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.log("❌ No hay usuario autenticado. Redirigiendo...");
            window.location.href = "login.html";
            return;
        }

        try {
            console.log("✅ Usuario autenticado:", user.email);

            const userDoc = await firebase.firestore().collection("userRoles").doc(user.uid).get();
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
    // Subir archivo a Supabase Storage
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

        try {
            Swal.fire({
                title: "Subiendo Archivo...",
                text: "Por favor espera mientras se sube el archivo.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.error || "Error desconocido");

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
                text: "❌ Hubo un problema al subir el archivo.",
                confirmButtonColor: "#e74c3c"
            });
        }
    }

    // ------------------------------
    // Cargar Documentos desde Supabase
    // ------------------------------
    async function loadFiles() {
        const filesListDiv = document.getElementById("files-list");
        filesListDiv.innerHTML = "<p>🔄 Cargando archivos...</p>";

        try {
            const response = await fetch(`${API_BASE_URL}/files`);
            const files = await response.json();

            filesListDiv.innerHTML = "";
            files.forEach((file) => {
                const fileItem = document.createElement("li");
                fileItem.classList.add("file-item");
                fileItem.innerHTML = `
                <span><strong>${file.name}</strong></span>
                <div class="file-buttons">
                    <button class="view-btn" onclick="previewFile('${file.url}')">👁️ Ver</button>
                    <a href="${file.url}" download="${file.name}" class="download-btn">📥 Descargar</a>
                    ${currentUserRole === "admin" ? `<button class="delete-btn" onclick="deleteFile('${file.name}')">❌ Eliminar</button>` : ""}
                </div>
            `;
        
                filesListDiv.appendChild(fileItem);
            });
        } catch (error) {
            console.error("❌ Error al cargar archivos:", error);
            filesListDiv.innerHTML = "<p>⚠️ Error al cargar los archivos.</p>";
        }
    }

    // ------------------------------
    // Eliminar Documento desde Supabase
    // ------------------------------
    window.deleteFile = async function (fileName) {
        if (currentUserRole !== "admin") {
            Swal.fire({ icon: "error", title: "Acceso Denegado", text: "❌ No puedes eliminar archivos.", confirmButtonColor: "#e74c3c" });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/delete/${fileName}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");

            Swal.fire({
                icon: "success",
                title: "Archivo Eliminado",
                text: "✅ Archivo eliminado correctamente.",
                confirmButtonColor: "#2ecc71"
            });

            loadFiles();
        } catch (error) {
            console.error("❌ Error al eliminar archivo:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "❌ No se pudo eliminar el archivo.",
                confirmButtonColor: "#e74c3c"
            });
        }
    };

    loadFiles();
});

function previewFile(fileUrl) {
    const previewContainer = document.getElementById("preview-container");

    // Determinar si es una imagen, PDF o archivo no compatible
    if (fileUrl.endsWith(".png") || fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg") || fileUrl.endsWith(".gif")) {
        previewContainer.innerHTML = `<img src="${fileUrl}" alt="Vista previa" class="preview-image">`;
    } else if (fileUrl.endsWith(".pdf")) {
        previewContainer.innerHTML = `<iframe src="${fileUrl}" class="preview-pdf"></iframe>`;
    } else {
        previewContainer.innerHTML = `<p>⚠️ No se puede previsualizar este tipo de archivo. Descárgalo para verlo.</p>`;
    }
}

window.previewFile = function(fileUrl) {
    const previewContainer = document.getElementById("preview-container");

    // Determinar si es una imagen, PDF o archivo no compatible
    if (fileUrl.endsWith(".png") || fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg") || fileUrl.endsWith(".gif")) {
        previewContainer.innerHTML = `<img src="${fileUrl}" alt="Vista previa" class="preview-image">`;
    } else if (fileUrl.endsWith(".pdf")) {
        previewContainer.innerHTML = `<iframe src="${fileUrl}" class="preview-pdf"></iframe>`;
    } else {
        previewContainer.innerHTML = `<p>⚠️ No se puede previsualizar este tipo de archivo. Descárgalo para verlo.</p>`;
    }
};
