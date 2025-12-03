/**
 * monitoreo.js - LIMITADO A 5 REGISTROS CON TIMESTAMP + ESTATUS GRANDE
 */

// --- CONFIGURACIÓN ---
const WS_URL = "ws://3.228.249.162:5500/ws/web";
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";
const MAX_ITEMS = 5;

let socket;
let movementsLog, obstaclesLog, realtimeStatus; // Nueva variable

document.addEventListener("DOMContentLoaded", () => {
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");
    realtimeStatus = document.getElementById("realtime-status"); // 🔥 Captura el elemento grande

    // 1. Carga inicial
    fetchInitialHistory();

    // 2. Conectar WebSocket
    initMonitoringWebSocket();
});

function initMonitoringWebSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("✅ Monitoreo conectado");
        if(realtimeStatus) realtimeStatus.textContent = "Conectado. Esperando...";
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
        if(realtimeStatus) realtimeStatus.textContent = "Desconectado 🔴";
        setTimeout(initMonitoringWebSocket, 3000);
    };
}

function handleServerEvent(msg) {
    const { event, data } = msg;
    const now = new Date().toLocaleTimeString('es-MX');

    // CASO A: MOVIMIENTO
    if (event === "new_movement" || event === "movement_report") {
        const text = data.status_text || data.action || "Movimiento";
        
        // 1. Actualizar el Estatus Grande
        if(realtimeStatus) {
            realtimeStatus.textContent = `Movimiento: ${text}`;
            realtimeStatus.style.color = "#0d47a1"; // Azul
        }

        // 2. Agregar a la lista
        prependLog(movementsLog, `[${now}] ${text}`, "badge-mov");
    } 
    // CASO B: OBSTÁCULO
    else if (event === "obstacle_detected") {
        const dist = data.distance_cm || "??";
        
        // 1. Actualizar el Estatus Grande (Alerta Visual)
        if(realtimeStatus) {
            realtimeStatus.textContent = `⚠️ OBSTÁCULO DETECTADO (${dist}cm)`;
            realtimeStatus.style.color = "#d32f2f"; // Rojo alerta
        }

        // 2. Agregar a la lista
        prependLog(obstaclesLog, `[${now}] Obstáculo a ${dist}cm`, "badge-obs");
    }
}

/**
 * Agrega datos al principio y ELIMINA los viejos si pasan de 5
 */
function prependLog(container, text, badgeClass) {
    if (container.innerHTML.includes("Cargando") || container.innerHTML.includes("Sin historial")) {
        container.innerHTML = "";
    }

    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #eee";
    div.style.padding = "8px 0";
    div.style.fontSize = "0.8rem";
    
    const badgeHtml = badgeClass ? `<span class="${badgeClass}">NUEVO</span> ` : '';
    div.innerHTML = `${badgeHtml} ${text}`;
    
    container.insertBefore(div, container.firstChild);

    while (container.children.length > MAX_ITEMS) {
        container.removeChild(container.lastChild);
    }
}

// --- CARGA INICIAL ---
async function fetchInitialHistory() {
    await Promise.all([fetchMovementsHttp(), fetchObstaclesHttp()]);
}

async function fetchMovementsHttp() {
    try {
        const res = await fetch(`${API_BASE_URL}/movements/last10?device_uid=${DEVICE_UID}`);
        const json = await res.json();
        
        // 🔥 Si hay historial, poner el último en el estatus grande al cargar
        if (json.movements && json.movements.length > 0) {
            const last = json.movements[0]; // El más nuevo
            if(realtimeStatus) realtimeStatus.textContent = `Último: ${last.status_text}`;
            
            movementsLog.innerHTML = "";
            const recent5 = json.movements.slice(0, MAX_ITEMS).reverse();
            recent5.forEach(m => {
                const time = new Date(m.ts).toLocaleTimeString('es-MX');
                prependLog(movementsLog, `[${time}] ${m.status_text}`, "");
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