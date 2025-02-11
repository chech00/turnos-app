"use strict";

const auth = window.auth;
const db = window.db;

// Variable global para el rol
let usuarioEsAdmin = false;

/**
 * Verifica el rol del usuario y ejecuta el callback con true si es admin o false en caso contrario.
 */
function verificarRolUsuario(callback) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    db.collection("userRoles").doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          callback(data.rol === "admin");
        } else {
          callback(false);
        }
      })
      .catch((error) => {
        console.error("Error al obtener rol:", error);
        callback(false);
      });
  });
}

/* ===============================
   Funciones comunes: Sidebar y Logout
   =============================== */
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
  lucide.createIcons();
}

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
  }
}

/* ===============================
   Código específico de Turnos Noc
   =============================== */

// Elementos de Backup y modales
const btnGuardar   = document.getElementById("btnGuardar");
const btnCargar    = document.getElementById("btnCargar");
const btnEliminar  = document.getElementById("btnEliminar");
const selectMeses  = document.getElementById("mesesGuardados");
const modal        = document.getElementById("modalCalendario");
const modalContent = document.getElementById("contenidoModal");
const cerrarModal  = document.getElementById("cerrarModal");

const btnVerHorarios = document.getElementById("btnVerHorarios");
const modalHorarios  = document.getElementById("modalHorarios");
const cerrarHorarios = document.getElementById("cerrarHorarios");

document.addEventListener("DOMContentLoaded", function () {
  configurarSidebar();
  configurarLogout();

  // Verificar rol y luego configurar la interfaz
  verificarRolUsuario(function(isAdmin) {
    usuarioEsAdmin = isAdmin;
    if (usuarioEsAdmin) {
      // Si es admin, quitar la clase admin-only de los elementos para mostrarlos
      document.querySelectorAll(".admin-only").forEach(el => {
        el.classList.remove("admin-only");
      });
    }
    // Si no es admin, los elementos con clase admin-only permanecen ocultos.

    // Obtener elementos de navegación del calendario
    const currentMonthElement = document.getElementById("current-month");
    const prevMonthButton     = document.getElementById("prev-month");
    const nextMonthButton     = document.getElementById("next-month");
    const todayButton         = document.getElementById("today");

    if (!currentMonthElement || !prevMonthButton || !nextMonthButton || !todayButton) {
      console.error("Error: No se encontraron los elementos de navegación del calendario.");
      return;
    }

    let currentDate = new Date();
    let selectedDays = [];

    console.log("Iniciando renderCalendar...", currentDate);

    // Feriados y sus nombres
    const feriadosChile = [
      "2025-01-01", "2025-04-18", "2025-04-19", "2025-05-01",
      "2025-05-21", "2025-06-29", "2025-07-16", "2025-08-15",
      "2025-09-18", "2025-09-19", "2025-10-12", "2025-10-31",
      "2025-11-01", "2025-12-08", "2025-12-25"
    ];
    const feriadosInfo = {
      "2025-01-01": "Año Nuevo",
      "2025-04-18": "Viernes Santo",
      "2025-04-19": "Sábado Santo",
      "2025-05-01": "Día del Trabajador",
      "2025-05-21": "Glorias Navales",
      "2025-06-29": "San Pedro y San Pablo",
      "2025-07-16": "Virgen del Carmen",
      "2025-08-15": "Asunción de la Virgen",
      "2025-09-18": "Fiestas Patrias",
      "2025-09-19": "Glorias del Ejército",
      "2025-10-12": "Encuentro de Dos Mundos",
      "2025-10-31": "Día Iglesias Evangélicas",
      "2025-11-01": "Día de Todos los Santos",
      "2025-12-08": "Inmaculada Concepción",
      "2025-12-25": "Navidad"
    };

    // Empleados para el calendario general
    const empleados = [
      { nombre: "Sergio Castillo", turnos: [] },
      { nombre: "Ignacio Aburto", turnos: [] },
      { nombre: "Claudio Bustamante", turnos: [] },
      { nombre: "Julio Oliva", turnos: [] },
      { nombre: "Gabriel Trujillo", turnos: [] }
    ];

    function asignarDomingosLibres(year, month, daysInMonth) {
      empleados.forEach((empleado) => {
        empleado.turnos = Array(daysInMonth).fill("");
        if (empleado.nombre === "Sergio Castillo" ||
            empleado.nombre === "Ignacio Aburto") {
          for (let day = 1; day <= daysInMonth; day++) {
            const fecha = new Date(year, month, day);
            if (fecha.getDay() === 0) {
              empleado.turnos[day - 1] = "DL";
            }
          }
        }
      });
    }

    const bitacoraEmployees = [
      "Sergio Castillo", "Ignacio Aburto", "Julio Oliva", "Carolina", "Gabriel Trujillo"
    ];

    function renderCalendar(date) {
      console.log("Renderizando calendario para:", date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      currentMonthElement.textContent = `${firstDay.toLocaleString("default", { month: "long" })} ${year}`;

      function generarCabecera(tabla) {
        let headerHTML = '<tr><th class="text-left p-2">Empleado</th>';
        for (let day = 1; day <= daysInMonth; day++) {
          const fecha = new Date(year, month, day);
          const dayName = fecha.toLocaleString("default", { weekday: "short" });
          headerHTML += `<th><div>${dayName}</div><div>${day}</div></th>`;
        }
        headerHTML += "</tr>";
        if (tabla && tabla.querySelector("thead")) {
          tabla.querySelector("thead").innerHTML = headerHTML;
        } else {
          console.error("No se encontró la cabecera de la tabla");
        }
      }

      const tablaGeneral = document.getElementById("general-calendar");
      const tablaNocturno = document.getElementById("nocturno-calendar");
      generarCabecera(tablaGeneral);
      generarCabecera(tablaNocturno);

      asignarDomingosLibres(year, month, daysInMonth);

      // Renderizar calendario general
      let generalHTML = "";
      empleados.forEach((empleado) => {
        generalHTML += `<tr><td class="text-left p-2">${empleado.nombre}</td>`;
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const esFeriado = feriadosChile.includes(dateStr);
          const turno = empleado.turnos[day - 1] || "";
          let displayTurno = turno;
          if (esFeriado && turno === "" &&
              (empleado.nombre === "Sergio Castillo" || empleado.nombre === "Ignacio Aburto")) {
            displayTurno = "F";
          }
          const extraClass = (turno === "DL") ? "domingo-libre" : "";
          const claseFeriado = (displayTurno === "F") ? "feriado" : "";

          generalHTML += `
            <td>
              <button data-date="${dateStr}" data-empleado="${empleado.nombre}" data-day="${day}"
                class="calendar-day w-full h-full ${extraClass} ${claseFeriado}">
                ${displayTurno}
              </button>
            </td>
          `;
        }
        generalHTML += `</tr>`;
      });
      const totalCols = daysInMonth + 1;
      const bitacoraIndex = ((month - 1) + bitacoraEmployees.length) % bitacoraEmployees.length;
      const bitacoraEmpleado = bitacoraEmployees[bitacoraIndex];
      const bitacoraHTML = `
        <tr>
          <td class="bitacora-row" style="white-space:nowrap;">Encargado de Bitácora</td>
          <td class="bitacora-row" colspan="${totalCols - 1}" style="text-align:center;">
            ${bitacoraEmpleado}
          </td>
        </tr>
      `;
      generalHTML += bitacoraHTML;
      const tbodyGeneral = document.querySelector("#general-calendar tbody");
      if (tbodyGeneral) {
        tbodyGeneral.innerHTML = generalHTML;
      } else {
        console.error("No se encontró el tbody de la tabla general");
      }

      // Renderizar calendario nocturno para Cristian Oyarzun
      let nocturnoHTML = "";
      const cristianTurnos = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const fecha = new Date(year, month, day);
        const esFeriado = feriadosChile.includes(dateStr);
        const dayOfWeek = fecha.getDay();
        if (esFeriado) {
          cristianTurnos[day - 1] = "F";
        } else if (dayOfWeek === 0) {
          cristianTurnos[day - 1] = "DL";
        } else if (dayOfWeek === 6) {
          cristianTurnos[day - 1] = "L";
        } else {
          cristianTurnos[day - 1] = "N";
        }
      }
      nocturnoHTML += `<tr><td class="text-left p-2">Cristian Oyarzun</td>`;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const turno = cristianTurnos[day - 1];
        let turnoClass = "";
        if (turno === "DL") turnoClass = "domingo-libre";
        else if (turno === "L") turnoClass = "dia-libre";
        else if (turno === "N") turnoClass = "nocturno";
        const claseFeriado = (turno === "F") ? "feriado" : "";
        nocturnoHTML += `
          <td>
            <button data-date="${dateStr}" data-empleado="Cristian Oyarzun" data-day="${day}"
              class="calendar-day w-full h-full ${turnoClass} ${claseFeriado}">
              ${turno}
            </button>
          </td>
        `;
      }
      nocturnoHTML += `</tr>`;
      const tbodyNocturno = document.getElementById("calendario-nocturno");
      if (tbodyNocturno) {
        tbodyNocturno.innerHTML = nocturnoHTML;
      } else {
        console.error("No se encontró el tbody de la tabla nocturna");
      }

      // Agregar tooltips para celdas feriadas
      document.querySelectorAll(".calendar-day").forEach((btn) => {
        const dateStr = btn.getAttribute("data-date");
        if (btn.textContent.trim() === "F" && feriadosChile.includes(dateStr)) {
          const nombreFeriado = feriadosInfo[dateStr] || "Feriado";
          btn.setAttribute("title", "Feriado: " + nombreFeriado);
        }
      });

      // Configurar eventos de selección de celdas
      document.querySelectorAll(".calendar-day").forEach((btn) => {
        btn.addEventListener("click", function () {
          if (this.classList.contains("selected")) {
            this.classList.remove("selected");
            selectedDays = selectedDays.filter((el) => el !== this);
          } else {
            this.classList.add("selected");
            selectedDays.push(this);
          }
        });
        // Para admin se permite borrar con clic derecho; para usuario se deshabilita.
        if (usuarioEsAdmin) {
          btn.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            this.textContent = "";
            this.removeAttribute("style");
            this.className = "calendar-day w-full h-full";
            selectedDays = selectedDays.filter((el) => el !== this);
          });
        } else {
          btn.addEventListener("contextmenu", function (e) {
            e.preventDefault();
          });
        }
      });
    }

    function todosLosDiasRellenos() {
      const dayButtons = document.querySelectorAll("#general-calendar .calendar-day, #nocturno-calendar .calendar-day");
      for (let btn of dayButtons) {
        if (btn.textContent.trim() === "") {
          return false;
        }
      }
      return true;
    }

    const turnosButtons = document.querySelectorAll(".turnos-buttons button");
    turnosButtons.forEach((button) => {
      button.addEventListener("click", function () {
        if (selectedDays.length > 0) {
          const turno = this.getAttribute("data-turno");
          const color = this.getAttribute("data-color");
          selectedDays.forEach((dayBtn) => {
            dayBtn.textContent = turno;
            dayBtn.style.backgroundColor = color;
            dayBtn.classList.remove("selected");
          });
          selectedDays = [];
        } else {
          Swal.fire({
            icon: "warning",
            title: "Sin selección",
            text: "Por favor, selecciona al menos una celda antes de asignar un turno."
          });
        }
      });
    });

    function obtenerDatosCalendario() {
      const generalTable = document.getElementById("general-calendar");
      const nocturnoTable = document.getElementById("nocturno-calendar");
      return {
        mes: currentMonthElement.textContent,
        generalHTML: generalTable.outerHTML,
        nocturnoHTML: nocturnoTable.outerHTML
      };
    }

    if (btnGuardar) {
      btnGuardar.addEventListener("click", function () {
        if (!todosLosDiasRellenos()) {
          Swal.fire({
            icon: "error",
            title: "Datos incompletos",
            text: "Debes rellenar todos los días en ambos calendarios antes de guardar."
          });
          return;
        }
        const datos = obtenerDatosCalendario();
        const docRef = db.collection("calendarios").doc(datos.mes);
        docRef.get().then((doc) => {
          if (doc.exists) {
            Swal.fire({
              icon: "question",
              title: "Ya existe un calendario",
              text: `¿Sobrescribir el calendario de ${datos.mes}?`,
              showCancelButton: true,
              confirmButtonText: "Sí, sobrescribir",
              cancelButtonText: "No"
            }).then((result) => {
              if (result.isConfirmed) {
                docRef.set(datos).then(() => {
                  Swal.fire("Sobrescrito", "Calendario sobrescrito exitosamente.", "success");
                  cargarListaCalendarios();
                }).catch((error) => {
                  console.error("Error al sobrescribir: ", error);
                });
              } else {
                Swal.fire("Cancelado", "No se sobrescribió el calendario.", "info");
              }
            });
          } else {
            docRef.set(datos).then(() => {
              Swal.fire({
                icon: "success",
                title: "Calendario guardado",
                text: "Calendario guardado exitosamente."
              });
              cargarListaCalendarios();
            }).catch((error) => {
              console.error("Error al guardar: ", error);
            });
          }
        }).catch((error) => {
          console.error("Error al validar existencia: ", error);
        });
      });
    }

    function cargarListaCalendarios() {
      db.collection("calendarios").get().then((querySnapshot) => {
        selectMeses.innerHTML = '<option value="">-- Seleccione un mes guardado --</option>';
        querySnapshot.forEach((doc) => {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.id;
          selectMeses.appendChild(option);
        });
      }).catch((error) => {
        console.error("Error al cargar calendarios: ", error);
      });
    }

    if (btnCargar) {
      btnCargar.addEventListener("click", function () {
        const mesSeleccionado = selectMeses.value;
        if (!mesSeleccionado) {
          Swal.fire({
            icon: "warning",
            title: "Seleccione un mes",
            text: "Por favor, seleccione un mes guardado."
          });
          return;
        }
        db.collection("calendarios").doc(mesSeleccionado).get().then((doc) => {
          if (doc.exists) {
            const datos = doc.data();
            modalContent.innerHTML = `<h3>Calendario General</h3>${datos.generalHTML}
                                        <h3>Calendario Nocturno</h3>${datos.nocturnoHTML}`;
            modal.style.display = "block";
          } else {
            Swal.fire({
              icon: "error",
              title: "No encontrado",
              text: `No se encontró el calendario para ${mesSeleccionado}.`
            });
          }
        }).catch((error) => {
          console.error("Error al cargar el calendario: ", error);
        });
      });
    }

    if (btnEliminar) {
      btnEliminar.addEventListener("click", function () {
        const mesSeleccionado = selectMeses.value;
        if (!mesSeleccionado) {
          Swal.fire({
            icon: "warning",
            title: "Seleccione un mes",
            text: "Por favor, seleccione un mes guardado para eliminar."
          });
          return;
        }
        Swal.fire({
          icon: "warning",
          title: "¿Eliminar Calendario?",
          text: `¿Estás seguro de eliminar el calendario de "${mesSeleccionado}"?`,
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "No"
        }).then((result) => {
          if (result.isConfirmed) {
            db.collection("calendarios").doc(mesSeleccionado).delete().then(() => {
              Swal.fire("Eliminado", `El calendario de "${mesSeleccionado}" fue eliminado.`, "success");
              cargarListaCalendarios();
            }).catch((error) => {
              console.error("Error al eliminar calendario: ", error);
            });
          } else {
            Swal.fire("Cancelado", "No se eliminó el calendario.", "info");
          }
        });
      });
    }

    if (cerrarModal) {
      cerrarModal.addEventListener("click", function () {
        modal.style.display = "none";
      });
    }
    window.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });

    if (btnVerHorarios) {
      btnVerHorarios.addEventListener("click", function () {
        modalHorarios.style.display = "block";
      });
    }
    if (cerrarHorarios) {
      cerrarHorarios.addEventListener("click", function () {
        modalHorarios.style.display = "none";
      });
    }
    window.addEventListener("click", function (e) {
      if (e.target === modalHorarios) {
        modalHorarios.style.display = "none";
      }
    });

    prevMonthButton.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar(currentDate);
    });
    nextMonthButton.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar(currentDate);
    });
    todayButton.addEventListener("click", function () {
      currentDate = new Date();
      renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
    cargarListaCalendarios();
  }); // Fin del callback de verificarRolUsuario
});
