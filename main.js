// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let btnForward, btnBackward, btnLeft, btnRight, btnStop;
let btnFwdLeft, btnFwdRight, btnBackLeft, btnBackRight;
let btnRotateLeft360, btnRotateRight360;
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

    // Botones nuevos 360°
    btnRotateLeft360 = document.getElementById("btn-rotate-left-360");
    btnRotateRight360 = document.getElementById("btn-rotate-right-360");

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

    // --- LISTENERS 360° CORREGIDOS ---
    btnRotateLeft360?.addEventListener('click', () => sendMove('Giro 360° izquierda'));
    btnRotateRight360?.addEventListener('click', () => sendMove('Giro 360° derecha'));
});

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

/**
 * Muestra un mensaje de estado del panel.
 */
function showStatus(message, type = 'info') {
    if (controlStatus) {
        controlStatus.textContent = message;
        controlStatus.className = `alert alert-${type} mt-3 rounded-3`;
        controlStatus.style.display = 'block';
    }
}
