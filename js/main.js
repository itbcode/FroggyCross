const Game = {
    state: 'menu',
    highScore: 0,
    cameraX: 0,
    lastTime: 0,
    overlay: null,
    panels: null,

    init() {
        Renderer.init();
        Input.init();
        this.overlay = document.getElementById('overlay');
        this.panels = document.getElementById('playerPanels');
        this._showMenu();
        requestAnimationFrame((t) => this._loop(t));
    },

    start() {
        this.state = 'playing';
        this.cameraX = 0;
        ColumnManager.reset();
        Players.reset();
        this.overlay.classList.add('hidden');
        this.panels.classList.remove('hidden');
        this._createPanels();
        GameAudio.startMusic();
        Renderer._fitToScreen();
    },

    _createPanels() {
        let html = '';
        for (let i = 0; i < Config.PLAYER_COUNT; i++) {
            html +=
                '<div class="player-panel" data-player="' + i + '">' +
                    '<div class="player-name">Gracz ' + (i + 1) + '</div>' +
                    '<div class="bet-buttons">' +
                        '<button class="bet-btn selected" data-bet="1">1</button>' +
                        '<button class="bet-btn" data-bet="25">25</button>' +
                        '<button class="bet-btn" data-bet="50">50</button>' +
                        '<button class="bet-btn" data-bet="100">100</button>' +
                    '</div>' +
                    '<button class="player-action-btn go-btn">GO!</button>' +
                '</div>';
        }
        this.panels.innerHTML = html;

        for (let i = 0; i < Config.PLAYER_COUNT; i++) {
            let panel = this.panels.querySelector('[data-player="' + i + '"]');
            let betBtns = panel.querySelectorAll('.bet-btn');
            let actionBtn = panel.querySelector('.player-action-btn');

            betBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (Players.list[i].active) return;
                    betBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    Players.list[i].bet = parseInt(btn.dataset.bet);
                });
            });

            actionBtn.addEventListener('click', () => {
                let p = Players.list[i];
                if (!p.active && !Players.roundStarted) {
                    Players.activatePlayer(i);
                    actionBtn.textContent = 'STOP';
                    actionBtn.classList.remove('go-btn');
                    actionBtn.classList.add('stop-btn');
                    betBtns.forEach(b => { b.disabled = true; });
                } else if (p.active && !p.dead && !p.cashedOut) {
                    Players.cashOutPlayer(i);
                }
            });
        }
    },

    _updatePanels() {
        for (let i = 0; i < Config.PLAYER_COUNT; i++) {
            let p = Players.list[i];
            let panel = this.panels.querySelector('[data-player="' + i + '"]');
            if (!panel) continue;
            let actionBtn = panel.querySelector('.player-action-btn');
            let nameDiv = panel.querySelector('.player-name');

            if (p.active && !p.dead && !p.cashedOut) {
                let col = ColumnManager.get(p.gridX);
                let canStop = !p.hopping && (col.stopped || col.type === 'sidewalk');
                actionBtn.disabled = !canStop;
                nameDiv.textContent = 'Gracz ' + (i + 1) + ' - ' + p.gridX;
            }

            if (p.dead && p.deadTimer <= 0 && !panel.classList.contains('dead')) {
                nameDiv.textContent = 'Gracz ' + (i + 1) + ' - PRZEGRANA';
                actionBtn.disabled = true;
                actionBtn.textContent = '\u2717';
                panel.classList.add('dead');
            }

            if (p.cashedOut && !panel.classList.contains('won')) {
                nameDiv.textContent = 'Gracz ' + (i + 1) + ' - ' + p.score + ' dr\u00f3g';
                actionBtn.disabled = true;
                actionBtn.textContent = '\u2713';
                panel.classList.add('won');
            }

            if (Players.roundStarted && !p.active) {
                actionBtn.disabled = true;
            }
        }
    },

    _loop(timestamp) {
        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        this.lastTime = timestamp;

        this._update(dt);

        let countdown = Players.getCountdown();
        let score = Players.getMaxGridX();
        Renderer.render(this.cameraX, score, this.highScore, countdown);

        requestAnimationFrame((t) => this._loop(t));
    },

    _update(dt) {
        if (this.state !== 'playing') return;

        ColumnManager.update(dt, this.cameraX);
        Players.update(dt);

        let leadX = Players.getLeadPixelX();
        let targetCamX = leadX - Config.CANVAS_W * 0.3;
        this.cameraX += (targetCamX - this.cameraX) * 0.08;
        if (this.cameraX < 0) this.cameraX = 0;

        let maxScore = Players.getMaxGridX();
        if (maxScore > this.highScore) this.highScore = maxScore;

        if (Players.checkFirstCollision()) {
            Players.killAll();
            GameAudio.playCrash();
        }

        this._updatePanels();

        if (Players.isAllDone()) {
            this.state = 'results';
            GameAudio.stopMusic();
            GameAudio.playRoundEnd();
            this._showResults();
        }
    },

    _showMenu() {
        this.state = 'menu';
        this.overlay.classList.remove('hidden');
        this.panels.classList.add('hidden');
        Renderer._fitToScreen();
        this.overlay.innerHTML =
            '<h1>Chicken Cross</h1>' +
            '<p>Wybierz kwot\u0119 i kliknij GO!</p>' +
            '<div class="menu-buttons">' +
                '<button class="btn btn-start" id="startBtn">START</button>' +
            '</div>' +
            '<button class="btn-mute" id="muteBtn">Muzyka: ON</button>';
        document.getElementById('startBtn').addEventListener('click', () => Game.start());
        document.getElementById('muteBtn').addEventListener('click', () => {
            let muted = GameAudio.toggleMute();
            document.getElementById('muteBtn').textContent = 'Muzyka: ' + (muted ? 'OFF' : 'ON');
        });
    },

    _showResults() {
        this.overlay.classList.remove('hidden');
        Renderer._fitToScreen();
        let html = '<h1>Koniec rundy!</h1>';
        for (let p of Players.list) {
            if (!p.active) continue;
            let mult = Players.getMultiplier(p.score);
            let multText = mult.toFixed(2);
            if (p.cashedOut) {
                let winnings = (p.bet * mult).toFixed(2);
                html += '<p style="color:#fff;font-size:18px;font-weight:bold">Gracz ' + (p.id + 1) +
                    ': WYGRANA<br>' + p.bet + ' \u00d7 x' + multText + ' = ' + winnings + '</p>';
            } else {
                html += '<p style="color:#fff;font-size:18px;font-weight:bold">Gracz ' + (p.id + 1) +
                    ': PRZEGRANA<br>' + p.bet + ' \u00d7 x' + multText + ' = 0</p>';
            }
        }
        html += '<p>Rekord: <span class="record-value">' + this.highScore + '</span></p>';
        html += '<div class="menu-buttons">' +
                    '<button class="btn btn-start" id="againBtn">Zagraj ponownie</button>' +
                '</div>';
        this.overlay.innerHTML = html;
        document.getElementById('againBtn').addEventListener('click', () => Game.start());
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
