// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// Mapeo de op_key a texto
const OP_MAP = {
    1: "Adelante",
    2: "Atrás",
    3: "Detener",
    4: "Vuelta adelante derecha",
    5: "Vuelta adelante izquierda",
    6: "Vuelta atrás derecha",
    7: "Vuelta atrás izquierda",
    8: "Giro 90° derecha",
    9: "Giro 90° izquierda",
    10: "Giro 360° derecha",
    11: "Giro 360° izquierda"
};

// --- DOM Refs ---
let selectMovement, btnAddStep, btnClearList, btnRunDemo,
    sequenceNameInput, sequenceListDisplay, statusDemo;

let currentSequence = []; // Array para guardar op_keys

document.addEventListener("DOMContentLoaded", () => {
    selectMovement = document.getElementById("select-movement");
    btnAddStep = document.getElementById("btn-add-step");
    btnClearList = document.getElementById("btn-clear-list");
    btnRunDemo = document.getElementById("btn-run-demo");
    sequenceNameInput = document.getElementById("sequence-name");
    sequenceListDisplay = document.getElementById("sequence-list-display");
    statusDemo = document.getElementById("status-demo");

    populateSelect();

    btnAddStep.addEventListener('click', addMovementStep);
    btnClearList.addEventListener('click', clearSequenceList);
    btnRunDemo.addEventListener('click', handleRunDemo);
});

/**
 * Llena el <select> con los movimientos
 */
function populateSelect() {
    for (const key in OP_MAP) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = OP_MAP[key];
        selectMovement.appendChild(option);
    }
}

/**
 * Añade el movimiento seleccionado
 */
function addMovementStep() {
    const opKey = parseInt(selectMovement.value, 10);
    const opText = OP_MAP[opKey];

    currentSequence.push(opKey);

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = opText;
    li.setAttribute('data-key', opKey);

    sequenceListDisplay.appendChild(li);
    showStatus(`Paso ${currentSequence.length} añadido: ${opText}`, 'info');
}

/**
 * Limpia la secuencia actual
 */
function clearSequenceList() {
    currentSequence = [];
    sequenceListDisplay.innerHTML = "";
    showStatus("Secuencia limpiada. Lista para empezar de nuevo.", 'warning');
}

/**
 * Guarda la secuencia y luego la ejecuta
 */
async function handleRunDemo() {
    const sequenceName = sequenceNameInput.value.trim();

    if (currentSequence.length === 0) {
        showStatus("Error: No puedes ejecutar una secuencia vacía.", 'danger');
        return;
    }
    if (sequenceName === "") {
        showStatus("Error: Debes darle un nombre a la secuencia.", 'danger');
        return;
    }

    // --- PASO 1: Guardar la secuencia (UPSERT)
    showStatus(`Guardando secuencia "${sequenceName}"...`, 'info');

    try {
        const upsertBody = {
            device_uid: DEVICE_UID,
            name: sequenceName,
            sequence: currentSequence,
            total_steps: currentSequence.length
        };

        const responseUpsert = await fetch(`${API_BASE_URL}/demo/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(upsertBody)
        });

        const resultUpsert = await responseUpsert.json();
        if (!responseUpsert.ok) throw new Error(resultUpsert.error || "Error al guardar");

        // Mostrar versión amigable de la secuencia
        const readableSeq = currentSequence
            .map((k, i) => `${i + 1}. ${OP_MAP[k]}`)
            .join("\n");

        console.log("Secuencia guardada:\n" + readableSeq);

        showStatus(`Secuencia "${sequenceName}" guardada. Iniciando...`, 'success');

    } catch (error) {
        showStatus(`Error al guardar la secuencia: ${error.message}`, 'danger');
        return;
    }

    // --- PASO 2: Iniciar la secuencia
    try {
        const startBody = {
            device_uid: DEVICE_UID,
            name: sequenceName
        };

        const responseStart = await fetch(`${API_BASE_URL}/demo/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(startBody)
        });

        const resultStart = await responseStart.json();
        if (!responseStart.ok) throw new Error(resultStart.error || "Error al iniciar");

        showStatus(`¡Secuencia Demo "${sequenceName}" ejecutándose en el dispositivo!`, 'success');

    } catch (error) {
        showStatus(`Error al iniciar la secuencia: ${error.message}`, 'danger');
    }
}

/**
 * Muestra mensajes visuales
 */
function showStatus(message, type = 'info') {
    statusDemo.textContent = message;
    statusDemo.className = `alert alert-${type} mt-3 rounded-3`;
    statusDemo.style.display = 'block';
}
