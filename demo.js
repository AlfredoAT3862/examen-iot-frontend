// --- CONFIGURACIÓN ---
const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

// Mapeo de op_key a texto (basado en tu api.py)
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
let selectMovement, btnAddStep, btnClearList, btnRunDemo, sequenceNameInput, sequenceListDisplay, statusDemo;
let currentSequence = []; // Array para guardar los op_keys

document.addEventListener("DOMContentLoaded", () => {
    // --- Asignar Elementos ---
    selectMovement = document.getElementById("select-movement");
    btnAddStep = document.getElementById("btn-add-step");
    btnClearList = document.getElementById("btn-clear-list");
    btnRunDemo = document.getElementById("btn-run-demo");
    sequenceNameInput = document.getElementById("sequence-name");
    sequenceListDisplay = document.getElementById("sequence-list-display");
    statusDemo = document.getElementById("status-demo");

    // --- Cargar Movimientos en el Dropdown ---
    populateSelect();

    // --- Event Listeners ---
    btnAddStep.addEventListener('click', addMovementStep);
    btnClearList.addEventListener('click', clearSequenceList);
    btnRunDemo.addEventListener('click', handleRunDemo);
});

/**
 * Llena el <select> con los 11 movimientos
 */
function populateSelect() {
    for (const key in OP_MAP) {
        const option = document.createElement("option");
        option.value = key; // El valor será el op_key (ej: "1")
        option.textContent = OP_MAP[key]; // El texto será (ej: "Adelante")
        selectMovement.appendChild(option);
    }
}

/**
 * Añade el movimiento seleccionado a la lista visual y al array
 */
function addMovementStep() {
    const opKey = parseInt(selectMovement.value, 10);
    const opText = OP_MAP[opKey];

    // Añadir al array lógico
    currentSequence.push(opKey);

    // Añadir a la lista visual
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = opText;
    
    // Guardamos el op_key en el elemento por si lo necesitamos
    li.setAttribute('data-key', opKey);
    
    sequenceListDisplay.appendChild(li);
    showStatus(`Paso ${currentSequence.length} añadido: ${opText}`, 'info');
}

/**
 * Limpia la secuencia actual (array y lista visual)
 */
function clearSequenceList() {
    currentSequence = [];
    sequenceListDisplay.innerHTML = "";
    showStatus("Secuencia limpiada. Lista para empezar de nuevo.", 'warning');
}

/**
 * 1. Guarda la secuencia en el backend (UPSERT)
 * 2. Inicia la secuencia (START)
 */
async function handleRunDemo() {
    const sequenceName = sequenceNameInput.value.trim();

    if (currentSequence.length === 0) {
        showStatus("Error: No puedes ejecutar una secuencia vacía. Añade movimientos.", 'danger');
        return;
    }
    if (sequenceName === "") {
        showStatus("Error: Por favor, dale un nombre a tu secuencia.", 'danger');
        return;
    }

    // --- PASO 1: Guardar (Upsert) la secuencia ---
    showStatus(`Guardando secuencia "${sequenceName}"...`, 'info');
    try {
        const upsertBody = {
            device_uid: DEVICE_UID,
            name: sequenceName,
            sequence: currentSequence, // El array de op_keys
            total_steps: currentSequence.length
        };
        
        const responseUpsert = await fetch(`${API_BASE_URL}/demo/sequence/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(upsertBody)
        });

        const resultUpsert = await responseUpsert.json();
        if (!responseUpsert.ok) throw new Error(resultUpsert.error || 'Error al guardar');
        
        showStatus(`Secuencia "${sequenceName}" guardada. Iniciando...`, 'success');

    } catch (error) {
        showStatus(`Error al guardar la secuencia: ${error.message}`, 'danger');
        return; // No continuar si no se pudo guardar
    }

    // --- PASO 2: Iniciar (Start) la secuencia ---
    try {
        const startBody = {
            device_uid: DEVICE_UID,
            name: sequenceName
        };

        const responseStart = await fetch(`${API_BASE_URL}/demo/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(startBody)
        });

        const resultStart = await responseStart.json();
        if (!responseStart.ok) throw new Error(resultStart.error || 'Error al iniciar');

        showStatus(`¡Secuencia Demo "${sequenceName}" ejecutándose en el dispositivo!`, 'success');

    } catch (error) {
        showStatus(`Error al iniciar la secuencia: ${error.message}`, 'danger');
    }
}

/**
 * Muestra un mensaje en el cuadro de estado
 */
function showStatus(message, type = 'info') {
    statusDemo.textContent = message;
    statusDemo.className = `alert alert-${type} mt-3 rounded-3`;
    statusDemo.style.display = 'block';
}