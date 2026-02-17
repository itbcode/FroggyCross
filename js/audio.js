const GameAudio = {
    ctx: null,
    master: null,
    musicBus: null,
    sfxBus: null,
    playing: false,
    muted: false,
    tempo: 116,
    step: 0,
    nextTime: 0,
    timer: null,
    loopCount: 0,

    NOTES: {
        'C2':65.41,'D2':73.42,'Eb2':77.78,'E2':82.41,'F2':87.31,
        'G2':98.00,'Ab2':103.83,'A2':110.00,'Bb2':116.54,'B2':123.47,
        'C3':130.81,'D3':146.83,'Eb3':155.56,'E3':164.81,'F3':174.61,
        'G3':196.00,'Ab3':207.65,'A3':220.00,'Bb3':233.08,'B3':246.94,
        'C4':261.63,'D4':293.66,'Eb4':311.13,'E4':329.63,'F4':349.23,
        'G4':392.00,'Ab4':415.30,'A4':440.00,'Bb4':466.16,'B4':493.88,
        'C5':523.25,'D5':587.33,'Eb5':622.25,'F5':698.46,'G5':783.99
    },

    n(name) { return this.NOTES[name] || 440; },

    _ensure() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        let comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -20;
        comp.ratio.value = 4;
        comp.connect(this.ctx.destination);

        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(comp);

        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.35;
        this.musicBus.connect(this.master);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.7;
        this.sfxBus.connect(this.master);
    },

    startMusic() {
        this._ensure();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.playing) return;
        this.playing = true;
        this.step = 0;
        this.loopCount = 0;
        this.nextTime = this.ctx.currentTime + 0.05;
        this._schedule();
    },

    stopMusic() {
        this.playing = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    toggleMute() {
        this._ensure();
        this.muted = !this.muted;
        this.master.gain.value = this.muted ? 0 : 0.5;
        return this.muted;
    },

    _schedule() {
        if (!this.playing) return;
        let stepLen = 60 / this.tempo / 4;
        while (this.nextTime < this.ctx.currentTime + 0.12) {
            this._playStep(this.step, this.nextTime, stepLen);
            this.nextTime += stepLen;
            this.step++;
            if (this.step % 64 === 0) this.loopCount++;
        }
        this.timer = setTimeout(() => this._schedule(), 20);
    },

    // ========== PATTERNS (64 steps = 4 bars, 16th notes) ==========
    // Progression: Cm7 - AbMaj7 - Fm7 - G7

    kick: [
        1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0,
        1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0,
        1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0,
        1,0,0,0, 1,0,0,0, 1,0,1,0, 1,0,1,0
    ],
    snare: [
        0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,
        0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,
        0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,
        0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,1
    ],
    hat: [
        1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,
        1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,
        1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,
        1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1
    ],

    bass: [
        'C2',0,0,'C2', 0,0,'G2',0, 'Eb2',0,0,'G2', 0,'C2',0,0,
        'Ab2',0,0,'Ab2', 0,0,'C3',0, 'Ab2',0,0,'G2', 0,'Ab2',0,0,
        'F2',0,0,'F2', 0,0,'Ab2',0, 'C3',0,0,'Ab2', 0,'F2',0,0,
        'G2',0,0,'G2', 0,0,'B2',0, 'D3',0,0,'B2', 0,'G2','G2',0
    ],

    arp: [
        'C4',0,'Eb4',0, 'G4',0,'C5',0, 'G4',0,'Eb4',0, 'C4',0,'Eb4',0,
        'Ab3',0,'C4',0, 'Eb4',0,'Ab4',0, 'Eb4',0,'C4',0, 'Ab3',0,'C4',0,
        'F3',0,'Ab3',0, 'C4',0,'F4',0, 'C4',0,'Ab3',0, 'F3',0,'Ab3',0,
        'G3',0,'B3',0, 'D4',0,'G4',0, 'D4',0,'B3',0, 'G3',0,'D4',0
    ],

    lead: [
        0,0,0,0, 0,0,0,0, 'G4',0,'Bb4','C5', 0,0,0,0,
        0,0,0,0, 0,0,0,0, 'Eb5',0,'C5',0, 'Ab4',0,'G4',0,
        0,0,0,0, 0,0,0,0, 'C5',0,'Ab4',0, 'F4',0,0,0,
        0,0,0,0, 0,0,'G4',0, 'B4',0,'D5',0, 0,0,0,0
    ],

    _playStep(step, time, len) {
        let s = step % 64;

        if (this.kick[s]) this._kickSound(time);
        if (this.snare[s]) this._snareSound(time);
        if (this.hat[s]) this._hatSound(time);

        if (this.bass[s]) this._bassSound(time, this.n(this.bass[s]), len * 1.5);
        if (this.arp[s]) this._arpSound(time, this.n(this.arp[s]), len * 1.8);

        // Lead wchodzi po pierwszym uplywie petli
        if (this.lead[s] && this.loopCount >= 1) {
            this._leadSound(time, this.n(this.lead[s]), len * 2.5);
        }
    },

    // ========== INSTRUMENTY ==========

    _kickSound(t) {
        let c = this.ctx;
        let osc = c.createOscillator();
        let g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        g.gain.setValueAtTime(0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + 0.2);
    },

    _snareSound(t) {
        let c = this.ctx;
        // Noise
        let len = c.sampleRate * 0.1;
        let buf = c.createBuffer(1, len, c.sampleRate);
        let d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        let noise = c.createBufferSource();
        noise.buffer = buf;
        let ng = c.createGain();
        ng.gain.setValueAtTime(0.35, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        let hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;
        noise.connect(hp);
        hp.connect(ng);
        ng.connect(this.musicBus);
        noise.start(t);
        noise.stop(t + 0.12);
        // Body
        let osc = c.createOscillator();
        let og = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
        og.gain.setValueAtTime(0.45, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(og);
        og.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    _hatSound(t) {
        let c = this.ctx;
        let dur = 0.04;
        let len = c.sampleRate * dur;
        let buf = c.createBuffer(1, len, c.sampleRate);
        let d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        let noise = c.createBufferSource();
        noise.buffer = buf;
        let g = c.createGain();
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        let hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 8000;
        noise.connect(hp);
        hp.connect(g);
        g.connect(this.musicBus);
        noise.start(t);
        noise.stop(t + dur);
    },

    _bassSound(t, freq, dur) {
        let c = this.ctx;
        let osc = c.createOscillator();
        let g = c.createGain();
        let f = c.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(500, t);
        f.frequency.exponentialRampToValueAtTime(200, t + dur);
        f.Q.value = 4;
        g.gain.setValueAtTime(0.4, t);
        g.gain.setValueAtTime(0.4, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(f);
        f.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + dur + 0.01);
    },

    _arpSound(t, freq, dur) {
        let c = this.ctx;
        let osc = c.createOscillator();
        let osc2 = c.createOscillator();
        let g = c.createGain();
        let f = c.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.005, t);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(1800, t);
        f.frequency.exponentialRampToValueAtTime(600, t + dur);
        g.gain.setValueAtTime(0.12, t);
        g.gain.setValueAtTime(0.12, t + dur * 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(f);
        osc2.connect(f);
        f.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + dur + 0.01);
        osc2.stop(t + dur + 0.01);
    },

    _leadSound(t, freq, dur) {
        let c = this.ctx;
        let osc = c.createOscillator();
        let g = c.createGain();
        let f = c.createBiquadFilter();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(1200, t);
        f.frequency.exponentialRampToValueAtTime(400, t + dur);
        f.Q.value = 2;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.02);
        g.gain.setValueAtTime(0.08, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(f);
        f.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + dur + 0.01);
    },

    // ========== SFX ==========

    playHop() {
        this._ensure();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let c = this.ctx;
        let t = c.currentTime;
        let osc = c.createOscillator();
        let g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(560, t + 0.07);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.14);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(g);
        g.connect(this.sfxBus);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    playCashOut() {
        this._ensure();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let c = this.ctx;
        let t = c.currentTime;
        let freqs = [660, 880, 1100, 1320];
        for (let i = 0; i < freqs.length; i++) {
            let osc = c.createOscillator();
            let g = c.createGain();
            osc.type = 'sine';
            let delay = i * 0.07;
            osc.frequency.setValueAtTime(freqs[i], t + delay);
            g.gain.setValueAtTime(0, t + delay);
            g.gain.linearRampToValueAtTime(0.25, t + delay + 0.015);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
            osc.connect(g);
            g.connect(this.sfxBus);
            osc.start(t + delay);
            osc.stop(t + delay + 0.35);
        }
    },

    playCrash() {
        this._ensure();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let c = this.ctx;
        let t = c.currentTime;
        // Niski impact
        let osc = c.createOscillator();
        let g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(g);
        g.connect(this.sfxBus);
        osc.start(t);
        osc.stop(t + 0.5);
        // Szum
        let len = c.sampleRate * 0.25;
        let buf = c.createBuffer(1, len, c.sampleRate);
        let d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        let noise = c.createBufferSource();
        noise.buffer = buf;
        let ng = c.createGain();
        ng.gain.setValueAtTime(0.35, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        let bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 800;
        bp.Q.value = 1;
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(this.sfxBus);
        noise.start(t);
        noise.stop(t + 0.25);
    },

    playRoundEnd() {
        this._ensure();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        let c = this.ctx;
        let t = c.currentTime;
        let freqs = [392, 330, 262, 196];
        for (let i = 0; i < freqs.length; i++) {
            let osc = c.createOscillator();
            let g = c.createGain();
            osc.type = 'triangle';
            let delay = i * 0.15;
            osc.frequency.setValueAtTime(freqs[i], t + delay);
            g.gain.setValueAtTime(0.2, t + delay);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);
            osc.connect(g);
            g.connect(this.sfxBus);
            osc.start(t + delay);
            osc.stop(t + delay + 0.4);
        }
    }
};
