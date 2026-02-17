const ColumnManager = {
    columns: new Map(),

    get(x) {
        if (this.columns.has(x)) return this.columns.get(x);
        let col = this._generate(x);
        this.columns.set(x, col);
        return col;
    },

    reset() {
        this.columns.clear();
    },

    _generate(x) {
        if (x === 0) return this._createSidewalk();
        return this._createLane(x);
    },

    _createSidewalk() {
        return {
            type: 'sidewalk',
            vehicles: [],
            passed: true,
            stopped: false,
            deadly: false
        };
    },

    _createLane(x) {
        let direction = 1;
        let deadly = Utils.seededRandom(x * 97 + 13) < Config.DEATH_CHANCE;

        let speedVar = 0.85 + Utils.seededRandom(x * 11 + 3) * 0.3;
        let baseSpeed = Config.BASE_SPEED * speedVar;

        let vehicles = [];
        let totalH = Config.ROWS * Config.TILE;

        let colorIdx = Math.floor(
            Utils.seededRandom(x * 41 + 43) * Config.CAR_COLORS.length
        );
        let isTruck = Utils.seededRandom(x * 23 + 31) < 0.3;
        let carSpeed = deadly ? baseSpeed * 2 : baseSpeed;
        vehicles.push({
            y: Utils.seededRandom(x * 29 + 37) * totalH,
            speed: carSpeed * direction,
            type: isTruck ? 'truck' : 'car',
            length: isTruck ? 1.8 : 1,
            color: deadly ? '#ff0000' : Config.CAR_COLORS[colorIdx]
        });

        return {
            type: 'road',
            vehicles: vehicles,
            passed: false,
            stopped: false,
            deadly: deadly,
            direction: direction
        };
    },

    update(dt, cameraX) {
        let startCol = Math.floor(cameraX / Config.TILE) - 2;
        let endCol = startCol + Config.VISIBLE_COLS + 4;

        for (let x = startCol; x <= endCol; x++) {
            let col = this.get(x);
            if (col.type !== 'road') continue;
            if (col.stopped) continue;

            let totalH = Config.ROWS * Config.TILE;
            for (let v of col.vehicles) {
                v.y += v.speed * dt * 60;
                if (v.y > totalH + Config.TILE) {
                    v.y -= totalH + Config.TILE * 3;
                }
                if (v.y < -Config.TILE * 2) {
                    v.y += totalH + Config.TILE * 3;
                }
            }
        }
    }
};
