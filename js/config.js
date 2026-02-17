const Config = {
    TILE: 100,
    ROWS: 5,
    VISIBLE_COLS: 6,
    CANVAS_W: 550,
    CANVAS_H: 500,
    HOP_SPEED: 3.33,

    AUTO_HOP_INTERVAL: 4.0,
    DEATH_CHANCE: 0.3,

    BASE_SPEED: 3.0,

    PLAYER_COUNT: 4,
    PLAYER_COLORS: [
        { body: '#F5F5DC', accent: '#FFFDE7' },
        { body: '#D2691E', accent: '#F4A460' },
        { body: '#FFD700', accent: '#FFEC8B' },
        { body: '#87CEEB', accent: '#B0E0E6' }
    ],

    CAR_COLORS: [
        '#e74c3c', '#3498db', '#f1c40f',
        '#e67e22', '#9b59b6', '#1abc9c', '#ecf0f1'
    ],

    COLORS: {
        SIDEWALK_TILE_A: '#c8b496',
        SIDEWALK_TILE_B: '#b8a486',
        SIDEWALK_WALL: '#8b6f47',
        SIDEWALK_WALL_DARK: '#6b4f27',
        ROAD: '#505050',
        ROAD_EDGE: '#3a3a3a',
        LANE_LINE: '#ffffff',
        MANHOLE: '#707070',
        MANHOLE_PASSED: '#f0c040',
        MANHOLE_RING: '#555555',
        MANHOLE_RING_PASSED: '#c8a020',
        CONE_ORANGE: '#FF6D00',
        CONE_WHITE: '#ffffff',
        CONE_BASE: '#333333'
    }
};
