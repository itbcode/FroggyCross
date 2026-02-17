const Renderer = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = Config.CANVAS_W;
        this.canvas.height = Config.CANVAS_H;
    },

    render(cameraX, score, highScore, countdown) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, Config.CANVAS_W, Config.CANVAS_H);

        let startCol = Math.floor(cameraX / Config.TILE) - 1;
        let endCol = startCol + Config.VISIBLE_COLS + 2;

        // Tla
        for (let x = startCol; x <= endCol; x++) {
            let col = ColumnManager.get(x);
            let screenX = x * Config.TILE - cameraX;
            this._drawColumnBg(ctx, screenX, col);
        }

        // Manhole
        for (let x = startCol; x <= endCol; x++) {
            let col = ColumnManager.get(x);
            if (col.type !== 'road') continue;
            let screenX = x * Config.TILE - cameraX;
            this._drawManhole(ctx, screenX, col, x);
        }

        // Pacholki na przejsciowych pasach
        let minActiveRow = 999;
        for (let p of Players.list) {
            if (p.active && !p.dead && !p.cashedOut) {
                minActiveRow = Math.min(minActiveRow, p.gridY);
            }
        }
        let coneRow = minActiveRow - 1;
        if (coneRow < 0) coneRow = 0;

        for (let x = startCol; x <= endCol; x++) {
            let col = ColumnManager.get(x);
            if (col.type !== 'road') continue;
            let leadX = Players.getMaxGridX();
            if (col.stopped || (col.passed && x < leadX)) {
                let screenX = x * Config.TILE - cameraX;
                this._drawBigCone(ctx, screenX, coneRow);
            }
        }

        // Pojazdy
        for (let x = startCol; x <= endCol; x++) {
            let col = ColumnManager.get(x);
            if (col.type !== 'road') continue;
            let screenX = x * Config.TILE - cameraX;
            for (let v of col.vehicles) {
                this._drawVehicle(ctx, screenX, v);
            }
        }

        // Kury graczy
        for (let p of Players.list) {
            if (!p.active) continue;
            if (p.dead && p.deadTimer <= 0) continue;
            if (!p.dead || Math.floor(Date.now() / 100) % 2 === 0) {
                let color = Config.PLAYER_COLORS[p.id];
                this._drawChicken(ctx, p.pixelX - cameraX, p.pixelY, color, p.hopping, p.hopProgress);
            }
        }

        // HUD
        this._drawHUD(ctx, score, highScore);

        // Odliczanie
        let alive = Players.getAlivePlayers();
        if (countdown > 0 && alive.length > 0 && Game.state === 'playing') {
            let firstAlive = alive[0];
            this._drawCountdown(ctx, countdown, firstAlive.pixelX - cameraX, firstAlive.pixelY);
        }
    },

    _drawColumnBg(ctx, screenX, col) {
        if (col.type === 'sidewalk') {
            this._drawSidewalk(ctx, screenX);
        } else {
            this._drawRoadLane(ctx, screenX, col);
        }
    },

    _drawSidewalk(ctx, screenX) {
        const T = Config.TILE;
        const C = Config.COLORS;

        for (let y = 0; y < Config.ROWS; y++) {
            ctx.fillStyle = (y % 2 === 0) ? C.SIDEWALK_TILE_A : C.SIDEWALK_TILE_B;
            ctx.fillRect(screenX, y * T, T, T);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 1, y * T + 1, T - 2, T - 2);
        }

        ctx.fillStyle = C.SIDEWALK_WALL;
        ctx.fillRect(screenX, 0, T, 12);
        ctx.fillStyle = C.SIDEWALK_WALL_DARK;
        ctx.fillRect(screenX, 10, T, 3);
        ctx.fillStyle = C.SIDEWALK_WALL;
        ctx.fillRect(screenX, Config.CANVAS_H - 12, T, 12);
        ctx.fillStyle = C.SIDEWALK_WALL_DARK;
        ctx.fillRect(screenX, Config.CANVAS_H - 13, T, 3);
    },

    _drawRoadLane(ctx, screenX, col) {
        const T = Config.TILE;
        const C = Config.COLORS;

        ctx.fillStyle = C.ROAD;
        ctx.fillRect(screenX, 0, T, Config.CANVAS_H);

        ctx.fillStyle = C.ROAD_EDGE;
        ctx.fillRect(screenX, 0, 3, Config.CANVAS_H);
        ctx.fillRect(screenX + T - 3, 0, 3, Config.CANVAS_H);

        ctx.fillStyle = C.LANE_LINE;
        for (let y = 0; y < Config.CANVAS_H; y += 40) {
            ctx.fillRect(screenX, y, 3, 20);
        }
        for (let y = 0; y < Config.CANVAS_H; y += 40) {
            ctx.fillRect(screenX + T - 3, y, 3, 20);
        }

        // Strzalki w dol
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        let cx = screenX + T / 2;
        for (let ay = 120; ay < Config.CANVAS_H; ay += 220) {
            ctx.save();
            ctx.translate(cx, ay);
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -16);
            ctx.lineTo(14, 8);
            ctx.lineTo(-14, 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },

    _drawManhole(ctx, screenX, col, roadX) {
        const T = Config.TILE;
        const C = Config.COLORS;
        let midY = Math.floor(Config.ROWS / 2) * T + T / 2;
        let cx = screenX + T / 2;
        let radius = T * 0.22;

        ctx.fillStyle = col.passed ? C.MANHOLE_RING_PASSED : C.MANHOLE_RING;
        ctx.beginPath();
        ctx.arc(cx, midY, radius + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = col.passed ? C.MANHOLE_PASSED : C.MANHOLE;
        ctx.beginPath();
        ctx.arc(cx, midY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Mnoznik
        let multiplier = Players.getMultiplier(roadX);
        let text = 'x' + multiplier.toFixed(2);
        ctx.fillStyle = col.passed ? '#FFD54F' : '#aaa';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(text, cx, midY + radius + 6);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    },

    _drawBigCone(ctx, screenX, row) {
        const T = Config.TILE;
        const C = Config.COLORS;
        let cx = screenX + T / 2;
        let baseY = row * T + T;
        let coneH = T * 0.8;
        let baseW = T * 0.5;

        ctx.fillStyle = C.CONE_BASE;
        ctx.beginPath();
        ctx.ellipse(cx, baseY, baseW / 2 + 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = C.CONE_ORANGE;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - coneH);
        ctx.lineTo(cx - baseW / 2, baseY);
        ctx.lineTo(cx + baseW / 2, baseY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = C.CONE_WHITE;
        let s1Y = baseY - coneH * 0.3;
        let s1W = baseW * 0.38;
        ctx.beginPath();
        ctx.moveTo(cx - s1W, s1Y + 6);
        ctx.lineTo(cx + s1W, s1Y + 6);
        ctx.lineTo(cx + s1W * 0.9, s1Y);
        ctx.lineTo(cx - s1W * 0.9, s1Y);
        ctx.closePath();
        ctx.fill();

        let s2Y = baseY - coneH * 0.6;
        let s2W = baseW * 0.22;
        ctx.beginPath();
        ctx.moveTo(cx - s2W, s2Y + 5);
        ctx.lineTo(cx + s2W, s2Y + 5);
        ctx.lineTo(cx + s2W * 0.85, s2Y);
        ctx.lineTo(cx - s2W * 0.85, s2Y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = C.CONE_ORANGE;
        ctx.beginPath();
        ctx.arc(cx, baseY - coneH, 3, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawVehicle(ctx, screenX, v) {
        const T = Config.TILE;
        let w = T - 12;
        let h = T * v.length - 12;
        let x = screenX + 6;
        let y = v.y + 6;

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 4, y + 4, w, h);

        ctx.fillStyle = v.color;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        if (v.type === 'car') {
            ctx.fillStyle = '#B3E5FC';
            ctx.fillRect(x + 8, y + 8, w - 16, h * 0.3);
            ctx.fillRect(x + 8, y + h - 8 - h * 0.2, w - 16, h * 0.2);
        } else {
            ctx.fillStyle = Utils.darkenColor(v.color, 40);
            ctx.fillRect(x + 4, y + h * 0.5, w - 8, h * 0.45);
        }
    },

    _drawChicken(ctx, x, y, playerColor, hopping, hopProgress) {
        const T = Config.TILE;
        const hp = hopping ? hopProgress : 0;
        let scale = T / 50;

        ctx.save();
        ctx.translate(x + T / 2, y + T / 2);
        ctx.scale(scale, scale);

        if (hopping) {
            let arc = Math.sin(hp * Math.PI);
            ctx.translate(0, -arc * 8);
        }

        let legPhase = hopping ? Math.sin(hp * Math.PI * 4) : 0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Ogon
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(-12, -2);
        ctx.lineTo(-20, -10);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-22, -8);
        ctx.lineTo(-17, -1);
        ctx.lineTo(-20, 2);
        ctx.lineTo(-12, 2);
        ctx.closePath();
        ctx.fill();

        // Nogi
        ctx.strokeStyle = '#E8A317';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-2, 12); ctx.lineTo(-4 + legPhase * 3, 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4 + legPhase * 3, 22); ctx.lineTo(-8 + legPhase * 3, 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4 + legPhase * 3, 22); ctx.lineTo(0 + legPhase * 3, 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(6 - legPhase * 3, 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6 - legPhase * 3, 22); ctx.lineTo(2 - legPhase * 3, 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6 - legPhase * 3, 22); ctx.lineTo(10 - legPhase * 3, 24); ctx.stroke();

        // Cialo
        ctx.fillStyle = playerColor.body;
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#D7CCC8'; ctx.lineWidth = 1; ctx.stroke();

        ctx.fillStyle = playerColor.accent;
        ctx.beginPath(); ctx.ellipse(2, 3, 9, 8, 0, 0, Math.PI * 2); ctx.fill();

        // Skrzydlo
        ctx.fillStyle = '#EFEBE9';
        ctx.beginPath(); ctx.ellipse(-4, 1, 8, 10, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#BCAAA4'; ctx.lineWidth = 0.8; ctx.stroke();

        // Glowa
        ctx.fillStyle = playerColor.body;
        ctx.beginPath(); ctx.arc(12, -6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#D7CCC8'; ctx.lineWidth = 1; ctx.stroke();

        // Grzebien
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.moveTo(8, -15); ctx.lineTo(10, -10); ctx.lineTo(12, -17);
        ctx.lineTo(14, -10); ctx.lineTo(16, -14); ctx.lineTo(17, -8); ctx.lineTo(7, -8);
        ctx.closePath(); ctx.fill();

        // Oko
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(15, -7, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(16, -7, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(16.5, -8, 0.8, 0, Math.PI * 2); ctx.fill();

        // Dziob
        ctx.fillStyle = '#FF8F00';
        ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(26, -3); ctx.lineTo(20, -1); ctx.closePath(); ctx.fill();

        // Podbrodek
        ctx.fillStyle = '#E53935';
        ctx.beginPath(); ctx.ellipse(18, 1, 3, 4, 0.3, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    },

    _drawCountdown(ctx, countdown, screenX, screenY) {
        let cx = screenX + Config.TILE / 2;
        let cy = screenY - 10;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        let progress = (Config.AUTO_HOP_INTERVAL - Players.autoHopTimer) / Config.AUTO_HOP_INTERVAL;
        ctx.strokeStyle = '#69F0AE';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(countdown), cx, cy);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    },

    _drawHUD(ctx, score, highScore) {
        const W = Config.CANVAS_W;

        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, 48);

        ctx.fillStyle = '#E53935';
        ctx.fillRect(0, 46, W, 2);

        ctx.fillStyle = '#FFD54F';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText('CHICKEN CROSS', 12, 32);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('Droga: ' + score, 250, 32);

        ctx.fillStyle = '#ccc';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('Rekord: ' + highScore, 420, 32);
    }
};
