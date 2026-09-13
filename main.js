const DB_NAME = "DeckSnesDB";
const STORE_NAME = "rom_store";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveRomToDeck(arrayBuffer) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(arrayBuffer, "active_rom");
    return tx.complete;
}

async function getSavedRom() {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get("active_rom");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

function bootEmulator(romBuffer) {
    document.getElementById("ui-container").style.display = "none";
    const canvas = document.getElementById("canvas");
    canvas.style.display = "block";

    // Emscripten WASM module hooks
    window.Module = {
        canvas: canvas,
        arguments: ["/game.sfc"],
        preRun: [() => {
            // Inject the byte array into Emscripten's virtual filesystem
            Module.FS_createDataFile("/", "game.sfc", new Uint8Array(romBuffer), true, true);
        }],
        postRun: []
    };

    // Inject the glue script to initialize WebAssembly execution
    const script = document.createElement("script");
    script.src = "./public/snes9x.js";
    document.body.appendChild(script);
}

async function initApp() {
    const savedRom = await getSavedRom();
    if (savedRom) {
        bootEmulator(savedRom);
    }
}

document.getElementById("rom-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await saveRomToDeck(buffer);
    bootEmulator(buffer);
});

initApp();
