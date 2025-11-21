// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let btnForward, btnBackward, btnLeft, btnRight, btnStop;
let btnFwdLeft, btnFwdRight, btnBackLeft, btnBackRight;
let btnRotateLeft360, btnRotateRight360;
let btnSpeedLow, btnSpeedMid, btnSpeedHigh;
let controlStatus;

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {

    btnForward = document.getElementById("btn-forward");
    btnBackward = document.getElementById("btn-backward");
    btnLeft = document.getElementById("btn-left");
    btnRight = document.getElementById("btn-right");
    btnStop = document.getElementById("btn-stop");

    btnFwdLeft = document.getElementById("btn-forward-left");
    btnFwdRight = document.getElementById("btn-forward-right");
    btnBackLeft = document.getElementById("btn-backward-left");
    btnBackRight = document.getElementById("btn-backward-right");

    btnRotateLeft360 = document.getElementById("btn-rotate-left-360");
    btnRotateRight360 = document.getElementById("btn-rotate-right-360");

    btnSpeedLow = document.getElementById("btn-speed-low");
    btnSpeedMid = document.getElementById("btn-speed-mid");
    btnSpeedHigh = document.getElementById("btn-speed-high");

    controlStatus = document.getElementById("control-status");

    // --- EVENT LISTENERS ---
    btnForward?.addEventListener('click', () => sendMove('Adelante'));
    btnBackward?.addEventListener('click', () => sendMove('Atrás'));
    btnStop?.addEventListener('click', () => sendMove('Detener'));

    btnFwdRight?.addEventListener('click', () => sendMove('Vuelta adelante derecha'));
    btnFwdLeft?.addEventListener('click', () => sendMove('Vuelta adelante izquierda'));

    btnBackRight?.addEventListener('click', () => sendMove('Vuelta atrás derecha'));
    btnBackLeft?.addEventListener('click', () => sendMove('Vuelta atrás izquierda'));

    btnRight?.addEventListener('click', () => sendMove('Giro 90° derecha'));
    btnLeft?.addEventListener('click', () => sendMove('Giro 90° izquierda'));

    btnRotateLeft360?.addEventListener('click', () => sendMove('Giro 360° izquierda'));
    btnRotateRight360?.addEventListener('click', () => sendMove('Giro 360° derecha'));

    // --- NUEVO: CONTROL DE VELOCIDAD ---
    btnSpeedLow?.addEventListener('click', () => setSpeed(150, btnSpeedLow));
    btnSpeedMid?.addEventListener('click', () => setSpeed(200, btnSpeedMid));
    btnSpeedHigh?.addEventListener('click', () => setSpeed(250, btnSpeedHigh));
});

// === NUEVO: FUNCIÓN PARA ENVIAR VELOCIDAD ===
async function setSpeed(speed, button) {
    const endpoint = `${API_BASE_URL}/speed`;

    // Actualiza visualmente el botón activo
    document.querySelectorAll("#btn-speed-low, #btn-speed-mid, #btn-speed-high")
        .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    showStatus(`Enviando velocidad: ${speed}...`, "info");

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                device_uid: DEVICE_UID,
                speed: speed
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error desconocido");

        showStatus(`Velocidad actualizada a ${speed}.`, "success");

    } catch (err) {
        showStatus(`Error al cambiar velocidad: ${err.message}`, "danger");
    }
}

/**
 * Envía un comando de movimiento a la API usando fetch async/await.
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error desconocido');

        const opKey = result.op_key || action;

        showStatus(`Comando "${action}" (op_key: ${opKey}) enviado correctamente.`, 'success');

    } catch (error) {
        showStatus(`Error al enviar "${action}": ${error.message}`, 'danger');
    }
}

function showStatus(message, type = 'info') {
    if (controlStatus) {
        controlStatus.textContent = message;
        controlStatus.className = `alert alert-${type} mt-3 rounded-3`;
        controlStatus.style.display = 'block';
    }
}
