// cache cleaner
// its old version


async function checkAndClearCache() {
    const VERSION_URL = '/cache_version';
    const COOKIE_NAME = 'cache_version';

    try {
        const response = await fetch(`${VERSION_URL}?t=${Date.now()}`);
        const currentVersion = await response.text();

        const oldVersion = getCookie(COOKIE_NAME);

        if (currentVersion !== oldVersion) {
            console.log('detect version change, clearing cache...');
            await clearAllStorages();
            setCookie(COOKIE_NAME, currentVersion, 365);
            window.location.reload(true);
        }
    } catch (error) {
        console.error('Version checking failed:', error);
    }
}

// clear all storages
async function clearAllStorages() {
    try {
        // clear service workers and caches
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            const cachesKeys = await caches.keys();
            await Promise.all(cachesKeys.map(key => caches.delete(key)));
        }

        // clear localStorage/sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // clear IndexedDB (compatibility handling)
        if (window.indexedDB && window.indexedDB.databases) {
            const dbs = await window.indexedDB.databases();
            await Promise.all(dbs.map(db => {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.deleteDatabase(db.name);
                    req.onsuccess = resolve;
                    req.onblocked = () => reject('Database operation blocked');
                });
            }));
        }
    } catch (e) {
        console.error('Cache cleanup exception:', e);
    }
}

// cookie operations
function getCookie(name) {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
}

function setCookie(name, value, maxAgeDays) {
    const date = new Date();
    date.setTime(date.getTime() + maxAgeDays * 86400000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

if (document.readyState === 'complete') {
    checkAndClearCache();
} else {
    window.addEventListener('load', checkAndClearCache);
}