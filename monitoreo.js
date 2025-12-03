/**
 * monitoreo.js - LIMITADO A 5 REGISTROS CON TIMESTAMP
 */

// --- CONFIGURACIÓN ---
const WS_URL = "ws://3.228.249.162:5500/ws/web";
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";
const MAX_ITEMS = 5; // 🔥 LÍMITE DE REGISTROS

let socket;
let movementsLog, obstaclesLog, monitoringStatus;

document.addEventListener("DOMContentLoaded", () => {
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");
    monitoringStatus = document.getElementById("monitoring-status");

    // 1. Carga inicial (Historial previo)
    fetchInitialHistory();

    // 2. Conectar WebSocket (Tiempo Real)
    initMonitoringWebSocket();
});

function initMonitoringWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("✅ Monitoreo conectado");
        updateStatus("Conexión Real-Time Activa 🟢");
    };

    socket.onmessage = (event) => {
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

function handleServerEvent(msg) {
    const { event, data } = msg;
    
    // Obtenemos la hora actual para ver que los registros son nuevos
    const now = new Date().toLocaleTimeString('es-MX');

    if (event === "new_movement" || event === "movement_report") {
        const text = data.status_text || data.action || "Movimiento";
        // Ejemplo: [12:00:01] Adelante
        prependLog(movementsLog, `[${now}] ${text}`, "badge-mov");
    } 
    else if (event === "obstacle_detected") {
        const dist = data.distance_cm || "??";
        // Ejemplo: [12:00:05] Obstáculo a 15cm
        prependLog(obstaclesLog, `[${now}] Obstáculo a ${dist}cm`, "badge-obs");
    }
}

/**
 * Agrega datos al principio y ELIMINA los viejos si pasan de 5
 */
function prependLog(container, text, badgeClass) {
    // Limpiar mensaje de carga si existe
    if (container.innerHTML.includes("Cargando") || container.innerHTML.includes("Sin historial")) {
        container.innerHTML = "";
    }

    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #eee";
    div.style.padding = "8px 0";
    div.style.fontSize = "0.8rem";
    
    // Badge "NUEVO" visual
    const badgeHtml = badgeClass ? `<span class="${badgeClass}">NUEVO</span> ` : '';
    div.innerHTML = `${badgeHtml} ${text}`;
    
    // Insertar arriba (Efecto Pila)
    container.insertBefore(div, container.firstChild);

    // 🔥 BORRAR EL EXCEDENTE (Solo mantenemos 5)
    while (container.children.length > MAX_ITEMS) {
        container.removeChild(container.lastChild);
    }
}

// --- CARGA INICIAL (RECORTADA A 5) ---
async function fetchInitialHistory() {
    updateStatus("Cargando historial...");
    await Promise.all([fetchMovementsHttp(), fetchObstaclesHttp()]);
    updateStatus("Conexión Real-Time Activa 🟢");
}

async function fetchMovementsHttp() {
    try {
        const res = await fetch(`${API_BASE_URL}/movements/last10?device_uid=${DEVICE_UID}`);
        const json = await res.json();
        if (json.movements && json.movements.length > 0) {
            movementsLog.innerHTML = "";
            
            // 1. Tomamos los 5 más recientes (API devuelve DESC)
            // 2. Invertimos para insertarlos en orden cronológico (viejo -> nuevo)
            //    así el prependLog deja el más nuevo al final (arriba).
            const recent5 = json.movements.slice(0, MAX_ITEMS).reverse();

            recent5.forEach(m => {
                const time = new Date(m.ts).toLocaleTimeString('es-MX');
                prependLog(movementsLog, `[${time}] ${m.status_text}`, ""); // Sin badge
            });
        } else {
            movementsLog.innerHTML = "<div class='text-muted p-2'>Sin historial reciente.</div>";
        }
    } catch (e) { console.error(e); }
}

async function fetchObstaclesHttp() {
    try {
        const res = await fetch(`${API_BASE_URL}/obstacles/last10?device_uid=${DEVICE_UID}`);
        const json = await res.json();
        if (json.obstacles && json.obstacles.length > 0) {
            obstaclesLog.innerHTML = "";
            
            // Misma lógica: Cortar 5 y Revertir
            const recent5 = json.obstacles.slice(0, MAX_ITEMS).reverse();

            recent5.forEach(o => {
                const time = new Date(o.ts).toLocaleTimeString('es-MX');
                prependLog(obstaclesLog, `[${time}] ${o.status_text} (${o.distance_cm}cm)`, "");
            });
        } else {
            obstaclesLog.innerHTML = "<div class='text-muted p-2'>Sin historial reciente.</div>";
        }
    } catch (e) { console.error(e); }
}

function updateStatus(msg) {
    if (monitoringStatus) monitoringStatus.textContent = msg;
}