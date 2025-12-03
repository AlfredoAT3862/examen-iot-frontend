/**
 * demo.js - GESTIÓN DE SECUENCIAS
 */

const API_BASE_URL = "http://3.228.249.162:5500/api";
const DEVICE_UID = "CAR-01-ABCDEF";

const OP_MAP = {
    1: "Adelante", 2: "Atrás", 3: "Detener",
    4: "Vuelta adelante derecha", 5: "Vuelta adelante izquierda",
    6: "Vuelta atrás derecha", 7: "Vuelta atrás izquierda",
    8: "Giro 90° derecha", 9: "Giro 90° izquierda",
    10: "Giro 360° derecha", 11: "Giro 360° izquierda"
};

// DOM
let selectMovement, btnAddStep, btnClearList, btnRunDemo, sequenceNameInput, sequenceListDisplay, statusDemo;
let selectSavedDemo, btnLoadDemo, btnRunSaved; // 🔥 Nuevos elementos

let currentSequence = []; 

document.addEventListener("DOMContentLoaded", () => {
    // Referencias
    selectMovement = document.getElementById("select-movement");
    btnAddStep = document.getElementById("btn-add-step");
    btnClearList = document.getElementById("btn-clear-list");
    btnRunDemo = document.getElementById("btn-run-demo");
    sequenceNameInput = document.getElementById("sequence-name");
    sequenceListDisplay = document.getElementById("sequence-list-display");
    statusDemo = document.getElementById("status-demo");
    
    // Nuevos
    selectSavedDemo = document.getElementById("select-saved-demo");
    btnLoadDemo = document.getElementById("btn-load-demo");
    btnRunSaved = document.getElementById("btn-run-saved");

    // Inicialización
    populateSelect();
    loadSavedDemos(); // 🔥 Cargar lista de la BD al iniciar

    // Listeners
    btnAddStep.addEventListener('click', addMovementStep);
    btnClearList.addEventListener('click', clearSequenceList);
    btnRunDemo.addEventListener('click', handleSaveAndRun);
    
    // Listeners nuevos
    btnLoadDemo?.addEventListener('click', handleLoadDemo);
    btnRunSaved?.addEventListener('click', handleRunSavedDemo);
});

// --- FUNCIONES BÁSICAS ---

function populateSelect() {
    for (const key in OP_MAP) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = OP_MAP[key];
        selectMovement.appendChild(option);
    }
}

function addMovementStep() {
    const opKey = parseInt(selectMovement.value, 10);
    currentSequence.push(opKey);
    renderList();
}

function renderList() {
    sequenceListDisplay.innerHTML = "";
    currentSequence.forEach((opKey) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = OP_MAP[opKey] || `Op ${opKey}`;
        sequenceListDisplay.appendChild(li);
    });
}

function clearSequenceList() {
    currentSequence = [];
    renderList();
    showStatus("Lista limpia.", 'warning');
}

// --- 🔥 GESTIÓN DE DEMOS GUARDADOS ---

async function loadSavedDemos() {
    try {
        // GET /api/demo/list?device_uid=...
        const res = await fetch(`${API_BASE_URL}/demo/list?device_uid=${DEVICE_UID}`);
        const data = await res.json();
        
        if (data.ok && data.demos) {
            selectSavedDemo.innerHTML = '<option value="" selected>-- Selecciona un demo --</option>';
            data.demos.forEach(demo => {
                const opt = document.createElement("option");
                // Usamos el nombre como valor clave
                opt.value = demo.name; 
                opt.textContent = `${demo.name} (${demo.total_steps} pasos)`;
                // Guardamos la secuencia en un atributo data para acceso rápido (opcional)
                opt.setAttribute('data-seq', JSON.stringify(demo.sequence));
                selectSavedDemo.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error cargando demos:", e);
    }
}

function handleLoadDemo() {
    const selectedName = selectSavedDemo.value;
    if (!selectedName) return;

    // Buscamos la opción seleccionada para obtener su data-seq
    const option = selectSavedDemo.options[selectSavedDemo.selectedIndex];
    const seqData = option.getAttribute('data-seq');

    if (seqData) {
        try {
            // El formato en BD puede ser complejo (lista de dicts o ints). Simplificamos:
            const rawSeq = JSON.parse(seqData);
            
            // Extraer solo los op_keys si vienen como objetos
            currentSequence = rawSeq.map(step => {
                return (typeof step === 'object') ? step.op_key : step;
            });

            sequenceNameInput.value = selectedName;
            renderList();
            showStatus(`Demo "${selectedName}" cargado en el editor.`, 'success');
        } catch (e) {
            showStatus("Error al procesar la secuencia guardada.", 'danger');
        }
    }
}

async function handleRunSavedDemo() {
    const selectedName = selectSavedDemo.value;
    if (!selectedName) {
        showStatus("Selecciona un demo de la lista primero.", 'warning');
        return;
    }
    // Ejecutar directamente por nombre
    await executeDemoOnServer(selectedName);
}

// --- GUARDAR Y EJECUTAR ---

async function handleSaveAndRun() {
    const name = sequenceNameInput.value.trim();
    if (currentSequence.length === 0) return showStatus("Lista vacía.", 'danger');
    if (!name) return showStatus("Escribe un nombre.", 'danger');

    showStatus("Guardando...", 'info');

    // 1. Guardar (Upsert)
    try {
        const body = {
            device_uid: DEVICE_UID,
            name: name,
            sequence: currentSequence, // Enviamos lista de enteros [1, 1, 2]
            total_steps: currentSequence.length
        };

        const res = await fetch(`${API_BASE_URL}/demo/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (!res.ok) throw new Error("Error al guardar");

        // Recargar la lista desplegable para que aparezca el nuevo
        await loadSavedDemos();
        
        // Seleccionar el recién creado en el combo (UX)
        selectSavedDemo.value = name;

        showStatus(`Guardado. Iniciando "${name}"...`, 'success');
        
        // 2. Ejecutar
        await executeDemoOnServer(name);

    } catch (e) {
        showStatus(`Error: ${e.message}`, 'danger');
    }
}

async function executeDemoOnServer(demoName) {
    try {
        const res = await fetch(`${API_BASE_URL}/demo/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_uid: DEVICE_UID,
                name: demoName
            })
        });
        
        if (!res.ok) throw new Error("Fallo al iniciar");
        showStatus(`¡Ejecutando "${demoName}" en el carrito! 🚗💨`, 'success');
        
    } catch (e) {
        showStatus(`Error ejecución: ${e.message}`, 'danger');
    }
}

function showStatus(msg, type) {
    statusDemo.textContent = msg;
    statusDemo.className = `alert alert-${type} mt-3 rounded-3`;
    statusDemo.style.display = 'block';
}
