// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let btnForward, btnBackward, btnLeft, btnRight, btnStop, btnFwdLeft, btnFwdRight, btnBackLeft, btnBackRight;
let btnRefresh;
let movementsLog, obstaclesLog, controlStatus;

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
    // Asignar elementos de control
    btnForward = document.getElementById("btn-forward");
    btnBackward = document.getElementById("btn-backward");
    btnLeft = document.getElementById("btn-left");
    btnRight = document.getElementById("btn-right");
    btnStop = document.getElementById("btn-stop");
    btnFwdLeft = document.getElementById("btn-forward-left");
    btnFwdRight = document.getElementById("btn-forward-right");
    btnBackLeft = document.getElementById("btn-backward-left");
    btnBackRight = document.getElementById("btn-backward-right");
    controlStatus = document.getElementById("control-status");

    // Asignar elementos de monitoreo (de index.html)
    btnRefresh = document.getElementById("btn-refresh");
    movementsLog = document.getElementById("movements-log");
    obstaclesLog = document.getElementById("obstacles-log");

    // --- EVENT LISTENERS (ESCUCHADORES DE EVENTOS) ---

    // Controles de Movimiento
    btnForward.addEventListener('click', () => sendMove('forward'));
    btnBackward.addEventListener('click', () => sendMove('backward'));
    btnStop.addEventListener('click', () => sendMove('stop'));
    btnFwdRight.addEventListener('click', () => sendMove('Vuelta adelante derecha'));
    btnFwdLeft.addEventListener('click', () => sendMove('Vuelta adelante izquierda'));
    btnBackRight.addEventListener('click', () => sendMove('Vuelta atrás derecha'));
    btnBackLeft.addEventListener('click', () => sendMove('Vuelta atrás izquierda'));
    btnRight.addEventListener('click', () => sendMove('Giro 90° derecha'));
    btnLeft.addEventListener('click', () => sendMove('Giro 90° izquierda'));
    
    // Monitoreo
    btnRefresh.addEventListener('click', fetchMonitoringData);
});

/**
 * Envía un comando de movimiento a la API usando fetch async/await.
 * @param {string} action - El string de acción (ej. "forward", "stop").
 */
async function sendMove(action) {
    const endpoint = `${API_BASE_URL}/move`;
    const bodyData = {
        device_uid: DEVICE_UID,
        action: action
    };

    showStatus(`Enviando comando: ${action}...`, 'info');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error desconocido');

        showStatus(`Comando "${action}" (op_key: ${result.op_key}) recibido con éxito.`, 'success');
    } catch (error) {
        showStatus(`Error al enviar "${action}": ${error.message}`, 'danger');
    }
}

/**
 * Muestra un mensaje en el cuadro de estado del panel de control.
 */
function showStatus(message, type = 'info') {
    controlStatus.textContent = message;
    controlStatus.className = `alert alert-${type} mt-3`;
    controlStatus.style.display = 'block';
}

/**
 * Llama a las funciones para refrescar los dos paneles de monitoreo.
 */
async function fetchMonitoringData() {
    movementsLog.textContent = "Cargando movimientos...";
    obstaclesLog.textContent = "Cargando obstáculos...";

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
        } else {
            // --- MODIFICACIÓN: Formato Amigable ---
            const formattedText = result.movements.map(mov => {
                const time = new Date(mov.ts).toLocaleString();
                return `[${time}] ${mov.status_text}`;
            }).join('\n'); // Unir cada evento con un salto de línea
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

        if (result.obstacles.length === 0) {
            obstaclesLog.textContent = "No hay obstáculos registrados.";
        } else {
            // --- MODIFICACIÓN: Formato Amigable ---
            const formattedText = result.obstacles.map(obs => {
                const time = new Date(obs.ts).toLocaleString();
                return `[${time}] ${obs.status_text} (Dist: ${obs.distance_cm} cm)`;
            }).join('\n'); // Unir cada evento con un salto de línea
            obstaclesLog.textContent = formattedText;
        }
    } catch (error) {
        obstaclesLog.textContent = `Error: ${error.message}`;
    }
}