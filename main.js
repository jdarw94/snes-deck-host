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

async function initApp() {
    const savedRom = await getSavedRom();
    if (savedRom) {
        document.getElementById("status-msg").innerText = "Saved ROM found in cache! Ready.";
        console.log("Loaded cached ROM, bytes:", savedRom.byteLength);
    }
}

document.getElementById("rom-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("status-msg").innerText = "Saving ROM locally...";
    const buffer = await file.arrayBuffer();
    await saveRomToDeck(buffer);
    document.getElementById("status-msg").innerText = "ROM Saved Successfully!";
    console.log("Saved new ROM, bytes:", buffer.byteLength);
});

initApp();
