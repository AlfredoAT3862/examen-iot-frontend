// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let btnRefresh;
let movementsLog, obstaclesLog;
let lastMoveText, lastMoveTime, lastObsText, lastObsTime;

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    // Asignar elementos de monitoreo
    btnRefresh = document.getElementById("btn-refresh");
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");

    // Asignar elementos de las tarjetas
    lastMoveText = document.getElementById("last-move-text");
    lastMoveTime = document.getElementById("last-move-time");
    lastObsText = document.getElementById("last-obs-text");
    lastObsTime = document.getElementById("last-obs-time");

    // --- EVENT LISTENERS (ESCUCHADORES DE EVENTOS) ---
    btnRefresh.addEventListener('click', fetchMonitoringData);
    
    // Cargar los datos la primera vez que se abre la página
    fetchMonitoringData();
});

/**
 * Llama a las funciones para refrescar los dos paneles de monitoreo.
 */
async function fetchMonitoringData() {
    movementsLog.textContent = "Cargando historial...";
    obstaclesLog.textContent = "Cargando historial...";
    lastMoveText.textContent = "Cargando...";
    lastObsText.textContent = "Cargando...";
    lastMoveTime.textContent = "";
    lastObsTime.textContent = "";

    await Promise.all([
        fetchMovements(),
        fetchObstacles()
    ]);
}

/**
 * Obtiene y muestra los últimos 10 movimientos (formato amigable).
 */
async function fetchMovements() {
    const endpoint = `${API_BASE_URL}/movements/last10?device_uid=${DEVICE_UID}`;
    
    try {
        const response = await fetch(endpoint);
        const result = await response.json();
        if (!response.ok || result.ok === false) throw new Error(result.error || 'Error al cargar movimientos');

        if (result.movements.length === 0) {
            movementsLog.textContent = "No hay movimientos registrados.";
            lastMoveText.textContent = "Sin datos";
        } else {
            // 1. Poner el último movimiento en la tarjeta
            const lastMovement = result.movements[0];
            lastMoveText.textContent = lastMovement.status_text;
            lastMoveTime.textContent = `Registrado: ${new Date(lastMovement.ts).toLocaleString()}`;

            // 2. Poner toda la lista en el historial (Formato amigable)
            // --- MODIFICACIÓN: Formato Amigable ---
            const formattedText = result.movements.map(mov => {
                const time = new Date(mov.ts).toLocaleString();
                return `[${time}] ${mov.status_text}`;
            }).join('\n');
            movementsLog.textContent = formattedText;
        }
    } catch (error) {
        movementsLog.textContent = `Error: ${error.message}`;
        lastMoveText.textContent = "Error";
    }
}

/**
 * Obtiene y muestra los últimos 10 obstáculos (formato amigable).
 */
async function fetchObstacles() {
    const endpoint = `${API_BASE_URL}/obstacles/last10?device_uid=${DEVICE_UID}`;

    try {
        const response = await fetch(endpoint);
        const result = await response.json();
        if (!response.ok || result.ok === false) throw new Error(result.error || 'Error al cargar obstáculos');

        if (result.obstacles.length === 0) {
            obstaclesLog.textContent = "No hay obstáculos registrados.";
            lastObsText.textContent = "Sin datos";
        } else {
            // 1. Poner el último obstáculo en la tarjeta
            const lastObstacle = result.obstacles[0];
            
            // --- MODIFICACIÓN: Quitar "cm" ---
            lastObsText.textContent = lastObstacle.status_text; 
            // ---------------------------------
            
            lastObsTime.textContent = `Registrado: ${new Date(lastObstacle.ts).toLocaleString()}`;
            
            // 2. Poner toda la lista en el historial (Formato amigable)
            // --- MODIFICACIÓN: Formato Amigable ---
            const formattedText = result.obstacles.map(obs => {
                const time = new Date(obs.ts).toLocaleString();
                return `[${time}] ${obs.status_text} (Dist: ${obs.distance_cm} cm)`;
            }).join('\n');
            obstaclesLog.textContent = formattedText;
        }
    } catch (error) {
        obstaclesLog.textContent = `Error: ${error.message}`;
        lastObsText.textContent = "Error";
    }
}