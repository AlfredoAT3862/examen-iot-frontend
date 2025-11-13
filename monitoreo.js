// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";
const REFRESH_INTERVAL = 1000; // Auto-actualizar cada 1 segundo

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let movementsLog, obstaclesLog, monitoringStatus;

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    // Asignar elementos de monitoreo
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");
    monitoringStatus = document.getElementById("monitoring-status");

    // --- LÓGICA DE AUTO-ACTUALIZACIÓN ---
    if (movementsLog && obstaclesLog) {
        // 1. Carga los datos de monitoreo en cuanto la página abre
        fetchMonitoringData();
        
        // 2. Vuelve a cargar los datos cada segundo
        setInterval(fetchMonitoringData, REFRESH_INTERVAL);
    }
});

/**
 * Llama a las funciones para refrescar los dos paneles de monitoreo.
 */
async function fetchMonitoringData() {
    if (monitoringStatus) {
        monitoringStatus.textContent = "Actualizando datos...";
    }
    
    await Promise.all([
        fetchMovements(),
        fetchObstacles()
    ]);

    if (monitoringStatus) {
        monitoringStatus.textContent = `Actualizando datos cada segundo... (Última vez: ${new Date().toLocaleTimeString()})`;
    }
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

        if (!result.movements || result.movements.length === 0) {
            movementsLog.textContent = "No hay movimientos registrados.";
        } else {
            const formattedText = result.movements.map(mov => {
                // Manejar fechas inválidas
                const time = new Date(mov.ts).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
                return `[${time}] ${mov.status_text}`;
            }).join('\n');
            movementsLog.textContent = formattedText;
        }
    } catch (error) {
        movementsLog.textContent = `Error: ${error.message}`;
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

        if (!result.obstacles || result.obstacles.length === 0) {
            obstaclesLog.textContent = "No hay obstáculos registrados.";
        } else {
            const formattedText = result.obstacles.map(obs => {
                const time = new Date(obs.ts).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
                return `[${time}] ${obs.status_text} (Dist: ${obs.distance_cm} cm)`;
            }).join('\n');
            obstaclesLog.textContent = formattedText;
        }
    } catch (error) {
        obstaclesLog.textContent = `Error: ${error.message}`;
    }
}