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

function launchEmulator(romBlobUrl) {
    document.getElementById("ui-container").style.display = "none";

    window.EJS_player = "#game";
    window.EJS_core = "snes";
    window.EJS_gameUrl = romBlobUrl;
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";

    const script = document.createElement("script");
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    document.body.appendChild(script);
}

async function initApp() {
    const savedRom = await getSavedRom();
    if (savedRom) {
        const blob = new Blob([savedRom]);
        const blobUrl = URL.createObjectURL(blob);
        launchEmulator(blobUrl);
    }
}

document.getElementById("rom-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await saveRomToDeck(buffer);

    const blob = new Blob([buffer]);
    const blobUrl = URL.createObjectURL(blob);
    launchEmulator(blobUrl);
});

initApp();
