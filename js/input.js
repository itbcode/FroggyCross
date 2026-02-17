const Input = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (Game.state === 'menu' || Game.state === 'results') {
                    Game.start();
                }
            }
        });
    }
};
