let SERVER_CONFIG = {
    ip: 'argentina.alc.game',
    port: 22003,
    maxPlayers: 128,
    apiUrl: 'https://api.alc.abrdns.com',
    updateInterval: 120000
};

let lastOnlineStatus = null;
let faviconFrames = [], currentFaviconFrame = 0;
let faviconAnimationInterval = null;

function initFaviconAnimation() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const colors = ['#e0a0c0', '#ff00ff', '#ff6ec7', '#e0a0c0'];
    
    for (let i = 0; i < 8; i++) {
        canvas.width = 64; canvas.height = 64;
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = colors[Math.floor(i / 2) % colors.length];
        ctx.beginPath();
        ctx.arc(32, 32, 20 + (i % 2) * 5, 0, (i / 8) * Math.PI * 2);
        ctx.lineTo(32, 32);
        ctx.fill();
        faviconFrames.push(canvas.toDataURL());
    }
}

function animateFavicon() {
    if (faviconFrames.length === 0) return;
    const link = document.querySelector('link[rel="icon"]');
    if (link) {
        link.href = faviconFrames[currentFaviconFrame];
        currentFaviconFrame = (currentFaviconFrame + 1) % faviconFrames.length;
    }
}

async function initializeApp() {
    try {
        initFaviconAnimation();
        faviconAnimationInterval = setInterval(animateFavicon, 150);
        
        // Intentar cargar config.json — validar que sea JSON real antes de parsear
        const response = await fetch('./config.json');
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error(`config.json no disponible (${response.status})`);
        }
        const cfg = await response.json();

        SERVER_CONFIG = {
            ip: cfg.server?.ip || SERVER_CONFIG.ip,
            port: cfg.server?.port || SERVER_CONFIG.port,
            maxPlayers: cfg.server?.maxPlayers || SERVER_CONFIG.maxPlayers,
            apiUrl: cfg.api?.baseUrl || SERVER_CONFIG.apiUrl,
            updateInterval: cfg.api?.updateInterval || SERVER_CONFIG.updateInterval
        };

        if (cfg.server?.name)       document.getElementById('serverTitle').textContent = cfg.server.name;
        if (cfg.server?.mode)       document.getElementById('serverMode').textContent = cfg.server.mode;
        if (cfg.branding?.copyright) document.getElementById('footer').textContent = cfg.branding.copyright;
        if (cfg.links?.discord)     document.querySelector('.social-link[title="Discord"]').href = cfg.links.discord;
        if (cfg.links?.instagram)   document.querySelector('.social-link[title="Instagram"]').href = cfg.links.instagram;

        document.getElementById('serverAddress').textContent  = `${SERVER_CONFIG.ip}:${SERVER_CONFIG.port}`;
        document.getElementById('connectCommand').textContent  = `connect ${SERVER_CONFIG.ip}:${SERVER_CONFIG.port}`;

        // Descripción: solo pisar si viene del config (no sobreescribir el HTML enriquecido)
        // cfg.branding?.description es texto plano — el HTML ya tiene la versión con <strong>

    } catch (error) {
        // Config no disponible — usar valores hardcodeados por defecto, sin spam de errores
    } finally {
        // Siempre arrancar el monitor del servidor
        fetchServerStatus();
        setInterval(fetchServerStatus, SERVER_CONFIG.updateInterval);
    }
}

function getStatusColor(isOnline) {
    return isOnline ? '#00FF00' : '#FF0000';
}

function getStatusBadgeClass(isOnline) {
    return isOnline ? 'online' : 'offline';
}

function getStatusText(isOnline) {
    return isOnline ? 'Online' : 'Offline';
}

function getStatusEmoji(isOnline) {
    return isOnline ? '🟢' : '🔴';
}

function updateServerMonitor(data) {
    const isOnline = data.online || false;
    const players = data.players || 0;
    const maxPlayers = data.maxPlayers || SERVER_CONFIG.maxPlayers;
    const serverName = data.serverName || 'Argentina Limando Carter';

    document.getElementById('serverName').textContent = serverName;
    document.getElementById('playersCount').textContent = `${players}/${maxPlayers}`;
    document.getElementById('serverStateText').textContent = getStatusText(isOnline);
    document.getElementById('statusBadge').className = `status-badge ${getStatusBadgeClass(isOnline)}`;
    document.getElementById('statusBadge').innerHTML = `<i class="fas fa-circle"></i> ${getStatusEmoji(isOnline)} ${getStatusText(isOnline)}`;
    document.getElementById('monitorEmbed').className = `server-monitor-embed ${getStatusBadgeClass(isOnline)}`;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('es-ES');

    if (lastOnlineStatus !== null && lastOnlineStatus !== isOnline) {
        console.log(`[SERVER MONITOR] Estado cambió a: ${getStatusText(isOnline)}`);
    }
    lastOnlineStatus = isOnline;
}

let _fetchErrorLogged = false;

function fetchServerStatus() {
    fetch(`${SERVER_CONFIG.apiUrl}/status`, { signal: AbortSignal.timeout(5000) })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const ct = response.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error('Respuesta no es JSON');
            return response.json();
        })
        .then(data => {
            _fetchErrorLogged = false;
            updateServerMonitor(data);
        })
        .catch(() => {
            // Error silencioso - no loguear en consola
            _fetchErrorLogged = true;
            updateServerMonitor({ online: false });
        });
}

window.copyConnectCommand = function(evt) {
    const command = `connect ${SERVER_CONFIG.ip}:${SERVER_CONFIG.port}`;
    navigator.clipboard.writeText(command).then(() => {
        const btn = (evt && evt.target) ? evt.target.closest('button') || evt.target : document.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        btn.style.background = 'linear-gradient(135deg, #2a7f3f 0%, #4CAF50 100%)';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('[COPY ERROR] No se pudo copiar:', err);
    });
}

window.addEventListener('load', () => {
    initializeApp();
});
