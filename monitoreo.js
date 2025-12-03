/**
 * monitoreo.js - VERSIÓN WEBSOCKET (PUSH)
 * Recibe actualizaciones en tiempo real sin recargar.
 */

// --- CONFIGURACIÓN ---
const WS_URL = "ws://3.228.249.162:5500/ws/web";
const API_BASE_URL = "http://3.228.249.162:5500/api"; // Solo para carga inicial
const DEVICE_UID = "CAR-01-ABCDEF";

let socket;
let movementsLog, obstaclesLog, monitoringStatus;

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    // Asignar elementos de monitoreo
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");
    monitoringStatus = document.getElementById("monitoring-status"); // (Opcional si existe en HTML)

    // 1. Carga inicial (HTTP) para no ver la pantalla vacía
    fetchInitialHistory();

    // 2. Conectar al flujo de datos en Tiempo Real
    initMonitoringWebSocket();
});

function initMonitoringWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("✅ Monitoreo conectado a Tiempo Real");
        updateStatus("Conexión Real-Time Activa 🟢");
    };

    socket.onmessage = (event) => {
        // AQUÍ LLEGAN LOS DATOS DEL SERVIDOR (PUSH)
        try {
            const msg = JSON.parse(event.data);
            handleServerEvent(msg);
        } catch (e) {
            console.error("Error leyendo mensaje WS:", e);
        }
    };

    socket.onclose = () => {
        console.warn("⚠️ Conexión perdida. Reintentando...");
        updateStatus("Desconectado. Reconectando... 🔴");
        setTimeout(initMonitoringWebSocket, 3000);
    };
}

/**
 * Procesa los eventos que manda el servidor (sockets/events.py)
 */
function handleServerEvent(msg) {
    const { event, data } = msg;

    // Caso A: Nuevo Movimiento reportado
    if (event === "new_movement" || event === "movement_report") {
        const text = data.status_text || data.action || "Movimiento desconocido";
        // Agregar al tope de la lista
        prependLog(movementsLog, `[AHORA] ${text}`, "badge-mov");
    } 
    // Caso B: Obstáculo detectado
    else if (event === "obstacle_detected") {
        const dist = data.distance_cm || "??";
        prependLog(obstaclesLog, `[ALERTA] Obstáculo a ${dist}cm`, "badge-obs");
    }
}

/**
 * Función auxiliar para agregar datos AL PRINCIPIO de la lista visual
 */
function prependLog(container, text, badgeClass) {
    // Si es texto plano (mensaje de "cargando"), límpialo
    if (container.textContent.includes("Cargando") || container.textContent.includes("No hay")) {
        container.innerHTML = "";
    }

    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #eee";
    div.style.padding = "6px 0";
    div.style.fontSize = "0.85rem";
    
    // Crear el HTML interno con badge
    const badgeHtml = badgeClass ? `<span class="${badgeClass}">NUEVO</span> ` : '';
    div.innerHTML = `${badgeHtml} ${text}`;
    
    // Insertar antes del primer hijo (Efecto Push)
    container.insertBefore(div, container.firstChild);
}

// --- CARGA INICIAL (HISTORIAL VIEJO) ---
async function fetchInitialHistory() {
    updateStatus("Cargando historial previo...");
    await Promise.all([fetchMovementsHttp(), fetchObstaclesHttp()]);
    updateStatus("Conexión Real-Time Activa 🟢");
}

async function fetchMovementsHttp() {
    try {
        const res = await fetch(`${API_BASE_URL}/movements/last10?device_uid=${DEVICE_UID}`);
        const json = await res.json();
        if (json.movements && json.movements.length > 0) {
            movementsLog.innerHTML = ""; // Limpiar "Cargando..."
            // Recorremos al revés para que el más nuevo quede arriba
            json.movements.reverse().forEach(m => {
                const time = new Date(m.ts).toLocaleTimeString('es-MX');
                prependLog(movementsLog, `[${time}] ${m.status_text}`, ""); // Sin badge de "NUEVO"
            });
        } else {
            movementsLog.textContent = "Sin historial reciente.";
        }
    } catch (e) { console.error(e); }
}

async function fetchObstaclesHttp() {
    try {
        const res = await fetch(`${API_BASE_URL}/obstacles/last10?device_uid=${DEVICE_UID}`);
        const json = await res.json();
        if (json.obstacles && json.obstacles.length > 0) {
            obstaclesLog.innerHTML = "";
            json.obstacles.reverse().forEach(o => {
                const time = new Date(o.ts).toLocaleTimeString('es-MX');
                prependLog(obstaclesLog, `[${time}] ${o.status_text} (${o.distance_cm}cm)`, "");
            });
        } else {
            obstaclesLog.textContent = "Sin historial reciente.";
        }
    } catch (e) { console.error(e); }
}

function updateStatus(msg) {
    if (monitoringStatus) monitoringStatus.textContent = msg;
}