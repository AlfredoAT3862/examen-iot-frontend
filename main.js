/**
 * main.js - VERSIÓN WEBSOCKET (REAL-TIME)
 * Se conecta al canal /ws/web del servidor Python.
 */

// --- CONFIGURACIÓN ---
const WS_URL = "ws://3.228.249.162:5500/ws/web";
const DEVICE_UID = "CAR-01-ABCDEF";

let socket; // Variable para la conexión WebSocket

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
let btnForward, btnBackward, btnLeft, btnRight, btnStop;
let btnFwdLeft, btnFwdRight, btnBackLeft, btnBackRight;
let btnRotateLeft360, btnRotateRight360;
let btnSpeedLow, btnSpeedMid, btnSpeedHigh;
let controlStatus;
let lastActionSpan; // 🔥 Nueva referencia

// Espera a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {

    // 1. INICIAR CONEXIÓN WEBSOCKET
    initWebSocket();

    // 2. OBTENER REFERENCIAS
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
    lastActionSpan = document.getElementById("last-action-text"); // 🔥 Referencia al span

    // 3. EVENT LISTENERS
    btnForward?.addEventListener('click', () => sendMoveWS('Adelante'));
    btnBackward?.addEventListener('click', () => sendMoveWS('Atrás'));
    btnStop?.addEventListener('click', () => sendMoveWS('Detener'));

    btnFwdRight?.addEventListener('click', () => sendMoveWS('Vuelta adelante derecha'));
    btnFwdLeft?.addEventListener('click', () => sendMoveWS('Vuelta adelante izquierda'));

    btnBackRight?.addEventListener('click', () => sendMoveWS('Vuelta atrás derecha'));
    btnBackLeft?.addEventListener('click', () => sendMoveWS('Vuelta atrás izquierda'));

    btnRight?.addEventListener('click', () => sendMoveWS('Giro 90° derecha'));
    btnLeft?.addEventListener('click', () => sendMoveWS('Giro 90° izquierda'));

    btnRotateLeft360?.addEventListener('click', () => sendMoveWS('Giro 360° izquierda'));
    btnRotateRight360?.addEventListener('click', () => sendMoveWS('Giro 360° derecha'));

    // Control de Velocidad
    btnSpeedLow?.addEventListener('click', () => setSpeedWS(150, btnSpeedLow));
    btnSpeedMid?.addEventListener('click', () => setSpeedWS(200, btnSpeedMid));
    btnSpeedHigh?.addEventListener('click', () => setSpeedWS(250, btnSpeedHigh));
});

/**
 * Inicializa la conexión WebSocket
 */
function initWebSocket() {
    console.log("Conectando al servidor de control...");
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("✅ Conectado al WebSocket de Control");
        showStatus("Sistema en línea 🟢", "success");
    };

    socket.onclose = () => {
        console.warn("⚠️ Conexión perdida. Reintentando en 3s...");
        showStatus("Desconectado. Reconectando...", "danger");
        setTimeout(initWebSocket, 3000); 
    };

    socket.onerror = (error) => {
        console.error("❌ Error de WebSocket:", error);
    };
}

/**
 * Envía comando de movimiento por WebSocket
 */
function sendMoveWS(action) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = {
            event: "control_move",
            data: {
                device_uid: DEVICE_UID,
                action: action
            }
        };
        socket.send(JSON.stringify(payload));
        
        // 🔥 ACTUALIZAR EL TEXTO VISUALMENTE
        if (lastActionSpan) {
            lastActionSpan.textContent = action;
            // Opcional: Efecto visual rápido
            lastActionSpan.style.opacity = '0.5';
            setTimeout(() => lastActionSpan.style.opacity = '1', 100);
        }

        showStatus(`Enviando: ${action}...`, 'info');
    } else {
        showStatus("Error: No hay conexión con el servidor", "danger");
    }
}

/**
 * Envía comando de velocidad
 */
function setSpeedWS(speed, button) {
    document.querySelectorAll("#btn-speed-low, #btn-speed-mid, #btn-speed-high")
        .forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = {
            event: "control_speed",
            data: {
                device_uid: DEVICE_UID,
                speed: speed
            }
        };
        socket.send(JSON.stringify(payload));
        showStatus(`Velocidad ajustada a ${speed}`, "success");
    } else {
        showStatus("Error: No hay conexión para cambiar velocidad", "danger");
    }
}

function showStatus(message, type = 'info') {
    if (controlStatus) {
        controlStatus.textContent = message;
        controlStatus.className = `alert alert-${type} mt-3 rounded-3`;
        controlStatus.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => { controlStatus.style.display = 'none'; }, 2000);
        }
    }
    console.log(`[STATUS] ${message}`);
}