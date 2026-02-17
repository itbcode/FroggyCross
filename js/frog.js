const Players = {
    list: [],
    autoHopTimer: 0,
    roundStarted: false,
    crashRoad: 0,

    reset() {
        this.list = [];
        for (let i = 0; i < Config.PLAYER_COUNT; i++) {
            this.list.push({
                id: i,
                active: false,
                bet: 1,
                gridX: 0,
                gridY: Math.floor(Config.ROWS / 2),
                yOffset: 0,
                pixelX: 0,
                pixelY: Math.floor(Config.ROWS / 2) * Config.TILE,
                hopping: false,
                hopProgress: 0,
                hopFrom: { x: 0, y: 0 },
                hopTo: { x: 0, y: 0 },
                dead: false,
                deadTimer: 0,
                cashedOut: false,
                score: 0
            });
        }
        this.autoHopTimer = 999999;
        this.roundStarted = false;
        this.crashRoad = this._calculateCrashRoad();
        console.log('%c=== NOWA RUNDA ===', 'color: #FFD54F; font-weight: bold; font-size: 14px');
        console.log('%cCrash road: ' + this.crashRoad, 'color: #ef5350; font-weight: bold');
        console.log('Bezpieczne drogi: 1 - ' + (this.crashRoad - 1));
        console.log('Mnozniki:');
        for (let i = 1; i <= this.crashRoad; i++) {
            let m = this.getMultiplier(i);
            let label = i === this.crashRoad ? ' << CRASH' : '';
            console.log('  Droga ' + i + ': x' + m.toFixed(2) + label);
        }
    },

    _calculateCrashRoad() {
        for (let x = 1; x < 1000; x++) {
            if (Math.random() < Config.DEATH_CHANCE) {
                return x;
            }
        }
        return 999;
    },

    getAlivePlayers() {
        return this.list.filter(p => p.active && !p.dead && !p.cashedOut);
    },

    activatePlayer(id) {
        let p = this.list[id];
        if (p.active || this.roundStarted) return;
        p.active = true;
        p.gridX = 0;
        p.pixelX = 0;
        p.dead = false;
        p.cashedOut = false;
        p.score = 0;

        this._assignRows();
        console.log('%cGracz ' + (id + 1) + ' dolaczyl (zaklad: ' + p.bet + ')', 'color: #69F0AE');

        let activeCount = this.list.filter(a => a.active).length;
        if (activeCount === 1) {
            this.autoHopTimer = Config.AUTO_HOP_INTERVAL;
        }
    },

    _assignRows() {
        let active = this.list.filter(p => p.active);
        let centerRow = Math.floor(Config.ROWS / 2);
        for (let i = 0; i < active.length; i++) {
            active[i].gridY = centerRow;
            active[i].yOffset = i * 30;
            active[i].pixelY = active[i].gridY * Config.TILE + active[i].yOffset;
        }
    },

    cashOutPlayer(id) {
        let p = this.list[id];
        if (!p.active || p.dead || p.cashedOut || p.hopping) return false;
        let col = ColumnManager.get(p.gridX);
        if (!col.stopped && col.type !== 'sidewalk') return false;
        p.cashedOut = true;
        p.score = p.gridX;
        let mult = this.getMultiplier(p.gridX);
        let winnings = (p.bet * mult).toFixed(2);
        console.log('%cGracz ' + (id + 1) + ' CASH OUT na drodze ' + p.gridX + ' | ' + p.bet + ' x ' + mult.toFixed(2) + ' = ' + winnings, 'color: #69F0AE; font-weight: bold');
        GameAudio.playCashOut();
        return true;
    },

    getCountdown() {
        let alive = this.getAlivePlayers();
        if (alive.length === 0) return 0;
        if (alive.some(p => p.hopping)) return 0;
        if (this.autoHopTimer > Config.AUTO_HOP_INTERVAL) return 0;
        return Math.ceil(this.autoHopTimer);
    },

    getMaxGridX() {
        let active = this.list.filter(p => p.active);
        if (active.length === 0) return 0;
        return Math.max(...active.map(p => p.gridX));
    },

    getLeadPixelX() {
        let active = this.list.filter(p => p.active);
        if (active.length === 0) return 0;
        return Math.max(...active.map(p => p.pixelX));
    },

    update(dt) {
        let alive = this.getAlivePlayers();
        if (alive.length === 0) return;

        let anyHopping = alive.some(p => p.hopping);
        if (!anyHopping) {
            this.autoHopTimer -= dt;
            if (this.autoHopTimer <= 0) {
                this._autoHopAll();
            }
        }

        for (let p of this.list) {
            if (!p.active) continue;

            if (p.hopping) {
                p.hopProgress += dt * Config.HOP_SPEED;
                if (p.hopProgress >= 1) {
                    p.hopProgress = 1;
                    p.hopping = false;
                    p.gridX = p.hopTo.x;
                    p.gridY = p.hopTo.y;
                    p.pixelX = p.gridX * Config.TILE;
                    p.pixelY = p.gridY * Config.TILE + p.yOffset;
                    this._onLanded(p);
                } else {
                    let ease = Utils.easeInOut(p.hopProgress);
                    p.pixelX = Utils.lerp(
                        p.hopFrom.x * Config.TILE,
                        p.hopTo.x * Config.TILE,
                        ease
                    );
                    p.pixelY = Utils.lerp(
                        p.hopFrom.y * Config.TILE + p.yOffset,
                        p.hopTo.y * Config.TILE + p.yOffset,
                        ease
                    );
                }
            }

            if (p.dead) {
                p.deadTimer -= dt;
            }
        }
    },

    _autoHopAll() {
        this.roundStarted = true;
        let alive = this.getAlivePlayers();
        if (alive.length === 0) return;

        let currentX = alive[0].gridX;
        let currentCol = ColumnManager.get(currentX);
        if (currentCol.type === 'road') {
            currentCol.vehicles = [];
        }

        let nextX = currentX + 1;

        let nextCol = ColumnManager.get(nextX);
        if (nextCol.type === 'road' && nextCol.vehicles.length > 0) {
            let v = nextCol.vehicles[0];
            let chickenY = alive[0].pixelY;

            if (nextX === this.crashRoad) {
                // CRASH ROAD — auto leci z gory i trafia kure
                let hopTime = 1 / Config.HOP_SPEED;
                let startY = -Config.TILE * 1.5;
                let distance = chickenY - startY + Config.TILE * 0.5;
                let arriveAt = hopTime * 0.7;
                v.y = startY;
                v.speed = distance / (arriveAt * 60);
                v.color = '#ff0000';
            } else if (nextX < this.crashRoad) {
                // BEZPIECZNY PAS — odsun auto od kury
                let safeZone = Config.TILE * 2;
                if (Math.abs(v.y - chickenY) < safeZone) {
                    v.y = chickenY + safeZone * 2;
                    if (v.y > Config.ROWS * Config.TILE) {
                        v.y = chickenY - safeZone * 2;
                    }
                }
            }
        }

        let isCrash = nextX === this.crashRoad;
        let mult = this.getMultiplier(nextX);
        console.log('%cSkok na droge ' + nextX + ' (x' + mult.toFixed(2) + ')' + (isCrash ? ' — CRASH ROAD!' : ' — bezpieczna'), isCrash ? 'color: #ef5350; font-weight: bold' : 'color: #90CAF9');

        GameAudio.playHop();

        for (let p of alive) {
            let newX = p.gridX + 1;
            p.hopping = true;
            p.hopProgress = 0;
            p.hopFrom = { x: p.gridX, y: p.gridY };
            p.hopTo = { x: newX, y: p.gridY };
        }
    },

    _onLanded(p) {
        let col = ColumnManager.get(p.gridX);
        if (!col.passed) col.passed = true;
        if (col.type === 'road') {
            col.stopped = true;
        }

        let alive = this.getAlivePlayers();
        if (alive.length > 0 && !alive.some(a => a.hopping)) {
            this.autoHopTimer = Config.AUTO_HOP_INTERVAL;
        }
    },

    killPlayer(p) {
        if (p.dead) return;
        p.dead = true;
        p.deadTimer = 1.0;
        p.hopping = false;
        p.score = p.gridX;
    },

    killAll() {
        let alive = this.getAlivePlayers();
        console.log('%c=== CRASH na drodze ' + this.crashRoad + '! ===' , 'color: #ef5350; font-weight: bold; font-size: 12px');
        for (let p of alive) {
            console.log('%cGracz ' + (p.id + 1) + ' PRZEGRANA | zaklad: ' + p.bet + ' = 0', 'color: #ef5350');
            this.killPlayer(p);
        }
    },

    checkFirstCollision() {
        let alive = this.getAlivePlayers();
        if (alive.length === 0) return false;

        let first = alive[0];
        if (!first.hopping) return false;

        // Przed crash road — zawsze bezpiecznie
        if (first.hopTo.x < this.crashRoad) return false;

        // Na crash road — sprawdz fizyczna kolizje
        if (first.hopTo.x === this.crashRoad) {
            let targetCol = ColumnManager.get(first.hopTo.x);
            if (targetCol.type !== 'road') return false;

            let targetScreenX = first.hopTo.x * Config.TILE;
            if (Math.abs(first.pixelX - targetScreenX) > Config.TILE * 0.4) return false;

            let frogTop = first.pixelY;
            let frogBottom = first.pixelY + Config.TILE;
            let margin = 15;

            for (let v of targetCol.vehicles) {
                let vTop = v.y;
                let vBottom = v.y + Config.TILE * v.length;
                if (frogBottom - margin > vTop && frogTop + margin < vBottom) {
                    return true;
                }
            }

            // Zabezpieczenie — jesli auto nie dojechalo, wymus smierc pod koniec skoku
            if (first.hopProgress > 0.85) {
                return true;
            }
        }

        return false;
    },

    getMultiplier(road) {
        if (road <= 0) return 1;
        let m = 1;
        for (let i = 1; i <= road; i++) {
            m *= (1.03 + 0.005 * i);
        }
        return m;
    },

    isAllDone() {
        let active = this.list.filter(p => p.active);
        if (active.length === 0) return false;
        return active.every(p => p.dead || p.cashedOut);
    }
};
