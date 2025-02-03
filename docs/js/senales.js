// ========================================
//  Configuración de Firebase (versión 8.x)
// ========================================
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
}
const db = firebase.firestore();
const auth = firebase.auth();

// ========================================
//     Variable global para el rol
// ========================================
let usuarioEsAdmin = false;

// ========================================
//    Verificar rol y cargar señales
// ========================================
function verificarRolUsuario() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
    
      window.location.href = "login.html";
      return;
    }

    // Lee el rol desde la colección userRoles (o la tuya)
    db.collection("userRoles")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          usuarioEsAdmin = (userData.rol === "admin");
        } else {
          usuarioEsAdmin = false;
        }
        // Una vez conocemos el rol, cargamos la vista principal
        cargarNodos();
      })
      .catch((error) => {
        console.error("Error obteniendo datos del usuario:", error);
        usuarioEsAdmin = false;
        cargarNodos(); // Cargar igualmente para mostrar algo
      });
  });
}

// ========================================
//         Sidebar Configuración
// ========================================
function configurarSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  const menuToggleBtns = document.querySelectorAll("#menu-toggle");

  if (!sidebar || !mainContent || menuToggleBtns.length === 0) {
    console.error("No se encontró el sidebar o main content.");
    return;
  }

  menuToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      mainContent.classList.toggle("shift");
    });
  });

  // Renderizar íconos Lucide
  lucide.createIcons();
}

// ========================================
//    Función para Logout
// ========================================
function configurarLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut()
        .then(() => {
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error al cerrar sesión:", error);
        });
    });
  } else {
    console.error("No se encontró el botón de cerrar sesión en esta vista.");
  }
}

// ========================================
//                 Nodos
// ========================================
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
        // Al hacer clic en la tarjeta se ingresa a la vista del nodo
        card.onclick = function () {
          mostrarVistaNodo(nodoId, nodoName);
        };

        // Ícono de eliminar (solo admin)
        if (usuarioEsAdmin) {
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

        // Cabecera
        const header = document.createElement("div");
        header.classList.add("card-header");
        header.textContent = nodoName;
        card.appendChild(header);

        cardContainer.appendChild(card);
      });

      fiberContainer.appendChild(cardContainer);
    })
    .catch((error) => {
      console.error("Error al cargar los nodos:", error);
    });
}

function mostrarVistaNodo(nodoId, nodoName) {
  const fiberContainer = document.getElementById("fiber-structure");
  fiberContainer.innerHTML = "";

  let html = `
    <button class="btn-back" onclick="cargarNodos()">← Volver</button>
    <h2>${nodoName} PONES</h2>
  `;

  // Formulario para crear PON (solo admin)
  if (usuarioEsAdmin) {
    html += `
      <div class="card">
        <div class="card-body">
          <div class="form-group">
            <label for="pon-letra">Letra del PON:</label>
            <select id="pon-letra">
              ${[...Array(26)]
                .map((_, i) =>
                  `<option value="${String.fromCharCode(65 + i)}">
                    ${String.fromCharCode(65 + i)}
                  </option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="pon-numero">Número del PON:</label>
            <select id="pon-numero">
              ${[...Array(51)]
                .map((_, i) => `<option value="${i}">${i}</option>`)
                .join("")}
            </select>
          </div>
          <button class="btn" onclick="crearPON('${nodoId}')">Crear PON</button>
        </div>
      </div>
    `;
  }

  // Contenedor de PONs
  html += `<div id="pon-list" class="card-container"></div>`;
  fiberContainer.innerHTML = html;

  cargarPONs(nodoId);
}

function eliminarNodo(nodoId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para eliminar nodos.");
    return;
  }
  db.collection("Nodos")
    .doc(nodoId)
    .delete()
    .then(() => {
      alert("Nodo eliminado");
      cargarNodos();
    })
    .catch((error) => {
      console.error("Error al eliminar nodo:", error);
    });
}

// ========================================
//                 PONs
// ========================================
function crearPON(nodoId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para crear PONs.");
    return;
  }

  const letra = document.getElementById("pon-letra").value;
  const numero = document.getElementById("pon-numero").value;
  const ponName = `PON ${letra}${numero}`;

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .where("name", "==", ponName)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        alert(`El PON ${ponName} ya existe en este nodo.`);
        return;
      }
      db.collection("Nodos")
        .doc(nodoId)
        .collection("PONs")
        .add({ name: ponName })
        .then(() => {
          alert(`PON ${ponName} creado correctamente`);
          cargarPONs(nodoId);
        })
        .catch((error) => {
          console.error("Error al crear PON:", error);
        });
    });
}

function cargarPONs(nodoId) {
  const ponList = document.getElementById("pon-list");
  ponList.innerHTML = "";

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .orderBy("name")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const ponData = doc.data();
        const ponId = doc.id;
        const ponName = ponData.name;

        const card = document.createElement("div");
        card.classList.add("card");
        card.onclick = function () {
          mostrarVistaPON(nodoId, ponId, ponName);
        };

        // Ícono de eliminar (solo admin)
        if (usuarioEsAdmin) {
          const deleteIcon = document.createElement("span");
          deleteIcon.classList.add("delete-icon");
          deleteIcon.innerHTML = "🗑";
          deleteIcon.onclick = function (e) {
            e.stopPropagation();
            if (confirm("¿Seguro que deseas eliminar este PON?")) {
              eliminarPON(nodoId, ponId);
            }
          };
          card.appendChild(deleteIcon);
        }

        const header = document.createElement("div");
        header.classList.add("card-header");
        header.textContent = ponName;
        card.appendChild(header);

        ponList.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error al cargar PONs:", error);
    });
}

function eliminarPON(nodoId, ponId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para eliminar PONs.");
    return;
  }
  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .delete()
    .then(() => {
      alert("PON eliminado");
      cargarPONs(nodoId);
    })
    .catch((error) => {
      console.error("Error al eliminar PON:", error);
    });
}

let currentNodoName = "";
let currentPonName = "";

// ========================================
//               Cajas
// ========================================
function mostrarVistaPON(nodoId, ponId, ponName) {
  currentPonName = ponName;
  const fiberContainer = document.getElementById("fiber-structure");

  let html = `
    <button class="btn-back" onclick="mostrarVistaNodo('${nodoId}', '${currentNodoName}')">
      ← Volver
    </button>
    <h2>${ponName} - Cajas</h2>
  `;

  // Form para crear Cajas (solo admin)
  if (usuarioEsAdmin) {
    html += `
      <div class="card">
        <div class="card-body">
          <div class="form-group">
            <label for="caja-numero">Número de la Caja:</label>
            <select id="caja-numero">
              ${[...Array(51)]
                .map((_, i) => `<option value="${i}">${i}</option>`)
                .join("")}
            </select>
          </div>
          <button class="btn" onclick="crearCaja('${nodoId}', '${ponId}')">
            Crear Caja
          </button>
        </div>
      </div>
    `;
  }

  html += `<div id="caja-list" class="card-container"></div>`;
  fiberContainer.innerHTML = html;

  cargarCajas(nodoId, ponId);
}

function crearCaja(nodoId, ponId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para crear Cajas.");
    return;
  }

  const numero = document.getElementById("caja-numero").value;
  const cajaName = `Caja ${numero}`;

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .where("name", "==", cajaName)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        alert(`La ${cajaName} ya existe en este PON.`);
        return;
      }
      db.collection("Nodos")
        .doc(nodoId)
        .collection("PONs")
        .doc(ponId)
        .collection("Cajas")
        .add({ name: cajaName })
        .then(() => {
          alert(`Caja ${cajaName} creada correctamente`);
          cargarCajas(nodoId, ponId);
        })
        .catch((error) => {
          console.error("Error al crear Caja:", error);
        });
    });
}

function cargarCajas(nodoId, ponId) {
  const cajaList = document.getElementById("caja-list");
  cajaList.innerHTML = "";

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .orderBy("name")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const cajaData = doc.data();
        const cajaId = doc.id;
        const cajaName = cajaData.name;

        const card = document.createElement("div");
        card.classList.add("card");
        card.onclick = function () {
          mostrarVistaCaja(nodoId, ponId, cajaId, cajaName);
        };

        // Ícono de eliminar (solo admin)
        if (usuarioEsAdmin) {
          const deleteIcon = document.createElement("span");
          deleteIcon.classList.add("delete-icon");
          deleteIcon.innerHTML = "🗑";
          deleteIcon.onclick = function (e) {
            e.stopPropagation();
            if (confirm("¿Seguro que deseas eliminar esta caja?")) {
              eliminarCaja(nodoId, ponId, cajaId);
            }
          };
          card.appendChild(deleteIcon);
        }

        const header = document.createElement("div");
        header.classList.add("card-header");
        header.textContent = cajaName;
        card.appendChild(header);

        cajaList.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error al cargar Cajas:", error);
    });
}

function eliminarCaja(nodoId, ponId, cajaId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para eliminar Cajas.");
    return;
  }

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .doc(cajaId)
    .delete()
    .then(() => {
      alert("Caja eliminada");
      cargarCajas(nodoId, ponId);
    })
    .catch((error) => {
      console.error("Error al eliminar Caja:", error);
    });
}

// ========================================
//             Filamentos
// ========================================
function mostrarVistaCaja(nodoId, ponId, cajaId, cajaName) {
  const fiberContainer = document.getElementById("fiber-structure");

  let html = `
    <button class="btn-back" onclick="mostrarVistaPON('${nodoId}', '${ponId}', '${currentPonName}')">
      ← Volver
    </button>
    <h2>${cajaName} - Filamentos</h2>
  `;

  // Form para crear Filamento (solo admin)
  if (usuarioEsAdmin) {
    html += `
      <div class="card">
        <div class="card-body">
          <div class="form-group">
            <label for="filamento-numero">Número del Filamento:</label>
            <select id="filamento-numero">
              ${[...Array(50)]
                .map((_, i) => `<option value="${i + 1}">${i + 1}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="filamento-senal">Señal (dBm):</label>
            <input type="text" id="filamento-senal" placeholder="-14dBm" />
          </div>
          <button class="btn" onclick="crearFilamento('${nodoId}', '${ponId}', '${cajaId}')">
            Agregar Filamento
          </button>
        </div>
      </div>
    `;
  }

  html += `<ul id="filamento-list" class="list-container"></ul>`;
  fiberContainer.innerHTML = html;

  cargarFilamentos(nodoId, ponId, cajaId);
}

function crearFilamento(nodoId, ponId, cajaId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para crear Filamentos.");
    return;
  }

  const numero = document.getElementById("filamento-numero").value;
  const senal = document.getElementById("filamento-senal").value.trim();

  if (!senal.match(/^-?\d+dBm$/)) {
    alert("Formato de señal incorrecto. Ejemplo válido: -14dBm");
    return;
  }

  const filamentoName = `Filamento ${numero}`;

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .doc(cajaId)
    .collection("Filamentos")
    .where("name", "==", filamentoName)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        alert(`El ${filamentoName} ya existe en esta caja.`);
        return;
      }
      db.collection("Nodos")
        .doc(nodoId)
        .collection("PONs")
        .doc(ponId)
        .collection("Cajas")
        .doc(cajaId)
        .collection("Filamentos")
        .add({ name: filamentoName, signal: senal })
        .then(() => {
          alert(`Filamento ${filamentoName} creado correctamente con señal ${senal}`);
          cargarFilamentos(nodoId, ponId, cajaId);
        })
        .catch((error) => {
          console.error("Error al crear Filamento:", error);
        });
    });
}

function cargarFilamentos(nodoId, ponId, cajaId) {
  const filamentoList = document.getElementById("filamento-list");
  filamentoList.innerHTML = "";

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .doc(cajaId)
    .collection("Filamentos")
    .orderBy("name")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const filamentoData = doc.data();
        const filamentoId = doc.id;

        const listItem = document.createElement("li");
        listItem.classList.add("list-item");
        listItem.innerHTML = `
          ${filamentoData.name} - <strong>${filamentoData.signal}</strong>
        `;

        // Ícono de eliminar (solo admin)
        if (usuarioEsAdmin) {
          const deleteIcon = document.createElement("span");
          deleteIcon.classList.add("delete-icon");
          deleteIcon.innerHTML = "🗑";
          deleteIcon.onclick = function (e) {
            e.stopPropagation();
            if (confirm("¿Seguro que deseas eliminar este Filamento?")) {
              eliminarFilamento(nodoId, ponId, cajaId, filamentoId);
            }
          };
          listItem.appendChild(deleteIcon);
        }

        filamentoList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error al cargar Filamentos:", error);
    });
}

function eliminarFilamento(nodoId, ponId, cajaId, filamentoId) {
  if (!usuarioEsAdmin) {
    alert("No tienes permiso para eliminar Filamentos.");
    return;
  }

  db.collection("Nodos")
    .doc(nodoId)
    .collection("PONs")
    .doc(ponId)
    .collection("Cajas")
    .doc(cajaId)
    .collection("Filamentos")
    .doc(filamentoId)
    .delete()
    .then(() => {
      alert("Filamento eliminado");
      cargarFilamentos(nodoId, ponId, cajaId);
    })
    .catch((error) => {
      console.error("Error al eliminar Filamento:", error);
    });
}

// ========================================
//   DOMContentLoaded - Inicio de la app
// ========================================
document.addEventListener("DOMContentLoaded", function () {
  configurarSidebar();
  verificarRolUsuario();  // Primero verificamos rol (admin/user)
  configurarLogout();     // Botón de logout
});
