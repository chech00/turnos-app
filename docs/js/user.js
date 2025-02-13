
const auth = window.auth;
const db = window.db;

document.addEventListener("DOMContentLoaded", function () {
    configurarSidebar();
    verificarRolUsuario();
  });

  let esAdmin = false; 
  
  function verificarRolUsuario() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "login.html"; // Si no hay usuario, manda a login
            return;
        }

        try {
            const userDoc = await db.collection("userRoles").doc(user.uid).get();
            if (!userDoc.exists) {
                alert("No tienes un rol asignado. Contacta al administrador.");
                auth.signOut();
                window.location.href = "login.html";
                return;
            }

            const userData = userDoc.data();
            const userRole = userData.rol;

            // Verificamos que si el usuario es normal, nunca lo mande a admin
            if (userRole !== "admin" && window.location.pathname === "/index.html") {
                window.location.href = "user.html";
                return;
            }

            // Si es admin, que mantenga la navegación normal
            if (userRole === "admin") {
              esAdmin = true;
              window.location.href = "index.html";
            } else {
              esAdmin = false;
              ocultarBotonesEdicion();
            
              if (!window.location.pathname.includes("user.html")) {
                window.location.href = "user.html"; // Redirige de inmediato a user.html si no está ahí
              }
            }
            
            mostrarBienvenida(user);
            cargarNodos();
            
        } catch (error) {
            console.error("Error en la verificación del usuario:", error.message);
            alert("Hubo un problema con tu cuenta. Contacta al administrador.");
            auth.signOut();
            window.location.href = "login.html";
        }
    });
}

  
  function ocultarBotonesEdicion() {
    const botonesCrear = document.querySelectorAll(".btn, .primary-btn");
    const botonesEliminar = document.querySelectorAll(".delete-icon");
  
    botonesCrear.forEach((btn) => {
      if (btn.textContent.includes("Crear") || btn.textContent.includes("Agregar")) {
        btn.style.display = "none";
      }
    });
  
    botonesEliminar.forEach((icon) => {
      icon.style.display = "none";
    });
  }
  
  // Cargar nodos sin opciones de edición si el usuario es "user"
  function cargarNodos() {
    const fiberContainer = document.getElementById("fiber-structure");
    fiberContainer.innerHTML = "<h2>Nodos</h2>";
  
    db.collection("Nodos")
      .orderBy("name")
      .get()
      .then((querySnapshot) => {
        const cardContainer = document.createElement("div");
        cardContainer.classList.add("card-container");
  
        querySnapshot.forEach((doc) => {
          const nodoData = doc.data();
          const nodoId = doc.id;
          const nodoName = nodoData.name;
  
          const card = document.createElement("div");
          card.classList.add("card");
          card.onclick = function () {
            mostrarVistaNodo(nodoId, nodoName);
          };
  
          const header = document.createElement("div");
          header.classList.add("card-header");
          header.textContent = nodoName;
          card.appendChild(header);
  
          // Si es admin, mostrar icono de eliminar
          if (esAdmin) {
            const deleteIcon = document.createElement("span");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.innerHTML = "🗑";
            deleteIcon.onclick = function (e) {
              e.stopPropagation();
              if (confirm("¿Seguro que deseas eliminar este nodo?")) {
                eliminarNodo(nodoId);
              }
            };
            card.appendChild(deleteIcon);
          }
  
          cardContainer.appendChild(card);
        });
  
        fiberContainer.appendChild(cardContainer);
      })
      .catch((error) => {
        console.error("Error al cargar los nodos:", error);
      });
  }
  