document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const canvas = document.getElementById('canvas');
    const appContainer = document.querySelector('.app-container');
    const btnPlay = document.getElementById('btn-play');
    const btnDot = document.getElementById('btn-dot');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnReset = document.getElementById('btn-reset');
    const cbContrast = document.getElementById('cb-contrast');
    const colorScheme = document.getElementById('color-scheme');
    const inputBars = document.getElementById('input-bars');
    const inputSpeed = document.getElementById('input-speed');
    const inputDotY = document.getElementById('input-dot-y');
    const dotYValue = document.getElementById('dot-y-value');
    const inputLength = document.getElementById('input-length');
    const lengthValue = document.getElementById('length-value');
    const inputWidth = document.getElementById('input-width');
    const widthValue = document.getElementById('width-value');
    const inputRotate = document.getElementById('input-rotate');
    const rotateValue = document.getElementById('rotate-value');
    const defaults = {
        bars: 8,
        speed: 2,
        dotY: 50,
        length: 100,
        width: 50,
        rotate: 0,
        contrast: true,
        colorScheme: 'blue-yellow',
    };

    const refreshIcons = () => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    const setPlayButton = () => {
        const isPlaying = canvas.classList.contains('playing');
        btnPlay.setAttribute('aria-pressed', String(isPlaying));
        btnPlay.innerHTML = `
            <i data-lucide="${isPlaying ? 'pause' : 'play'}" aria-hidden="true"></i>
            <span>${isPlaying ? 'Pause' : 'Play'}</span>
        `;
        refreshIcons();
    };

    const setDotButton = () => {
        const isVisible = canvas.classList.contains('show-dot');
        btnDot.setAttribute('aria-pressed', String(isVisible));
        btnDot.innerHTML = `
            <i data-lucide="circle" aria-hidden="true"></i>
            <span>Dot</span>
        `;
        refreshIcons();
    };

    const setFullscreenButton = () => {
        const isFullscreen = document.fullscreenElement === appContainer;
        btnFullscreen.setAttribute('aria-pressed', String(isFullscreen));
        btnFullscreen.innerHTML = `
            <i data-lucide="${isFullscreen ? 'minimize' : 'maximize'}" aria-hidden="true"></i>
            <span>${isFullscreen ? 'Exit' : 'Full'}</span>
        `;
        refreshIcons();
    };

    btnPlay.addEventListener('click', () => {
        canvas.classList.toggle('playing');
        setPlayButton();
    });

    btnDot.addEventListener('click', () => {
        canvas.classList.toggle('show-dot');
        setDotButton();
    });

    btnFullscreen.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await appContainer.requestFullscreen();
            }
        } catch (error) {
            console.warn('Fullscreen is not available:', error);
        }
    });

    document.addEventListener('fullscreenchange', setFullscreenButton);

    const updateContrast = () => {
        if (cbContrast.checked) {
            root.style.setProperty('--bg-dark-current', 'var(--stripe-dark-hi)');
            root.style.setProperty('--bg-light-current', 'var(--stripe-light-hi)');
        } else {
            root.style.setProperty('--bg-dark-current', 'var(--stripe-dark-lo)');
            root.style.setProperty('--bg-light-current', 'var(--stripe-light-lo)');
        }
    };

    cbContrast.addEventListener('change', updateContrast);

    const updateColorScheme = () => {
        switch (colorScheme.value) {
            case 'blue-yellow':
                root.style.setProperty('--foot-dark-color', '#0047ab');
                root.style.setProperty('--foot-light-color', '#ffd200');
                break;
            case 'black-white':
                root.style.setProperty('--foot-dark-color', 'var(--stripe-dark-hi)');
                root.style.setProperty('--foot-light-color', 'var(--stripe-light-hi)');
                break;
            case 'red-green':
                root.style.setProperty('--foot-dark-color', '#8b0000');
                root.style.setProperty('--foot-light-color', '#006400');
                break;
            case 'grey':
                root.style.setProperty('--foot-dark-color', 'var(--stripe-dark-lo)');
                root.style.setProperty('--foot-light-color', 'var(--stripe-light-lo)');
                break;
        }
    };

    const updateStripeWidth = () => {
        const barsPerFoot = Math.min(Math.max(parseFloat(inputBars.value) || defaults.bars, 1), 30);
        const stripeWidth = defaults.length / barsPerFoot;
        inputBars.value = barsPerFoot;
        root.style.setProperty('--stripe-width', `${stripeWidth}px`);
    };

    const updateSpeed = () => {
        const speed = Math.min(Math.max(parseFloat(inputSpeed.value) || defaults.speed, 1), 10);
        const duration = 42 - (speed * 4);
        const playbackRate = 10 / duration;

        inputSpeed.value = speed;
        canvas.getAnimations({ subtree: true }).forEach((animation) => {
            if (typeof animation.updatePlaybackRate === 'function') {
                animation.updatePlaybackRate(playbackRate);
            } else {
                animation.playbackRate = playbackRate;
            }
        });
    };

    const updateDotY = () => {
        const dotY = Math.min(Math.max(parseFloat(inputDotY.value) || defaults.dotY, 20), 80);
        inputDotY.value = dotY;
        root.style.setProperty('--dot-y', `${dotY}%`);
        dotYValue.textContent = Math.round(dotY);
    };

    const updateFootShape = () => {
        const length = Math.min(Math.max(parseFloat(inputLength.value) || defaults.length, 50), 180);
        const width = Math.min(Math.max(parseFloat(inputWidth.value) || defaults.width, 20), 90);
        const rotate = Math.min(Math.max(parseFloat(inputRotate.value) || defaults.rotate, -90), 90);

        inputLength.value = length;
        inputWidth.value = width;
        inputRotate.value = rotate;
        root.style.setProperty('--foot-width', `${length}px`);
        root.style.setProperty('--foot-height', `${width}px`);
        root.style.setProperty('--foot-rotate', `${rotate}deg`);
        lengthValue.textContent = Math.round(length);
        widthValue.textContent = Math.round(width);
        rotateValue.textContent = Math.round(rotate);
    };

    const resetControls = () => {
        inputBars.value = defaults.bars;
        inputSpeed.value = defaults.speed;
        inputDotY.value = defaults.dotY;
        inputLength.value = defaults.length;
        inputWidth.value = defaults.width;
        inputRotate.value = defaults.rotate;
        cbContrast.checked = defaults.contrast;
        colorScheme.value = defaults.colorScheme;
        canvas.classList.add('playing');
        canvas.classList.remove('show-dot');

        updateContrast();
        updateColorScheme();
        updateStripeWidth();
        updateFootShape();
        updateSpeed();
        updateDotY();
        setPlayButton();
        setDotButton();
    };

    colorScheme.addEventListener('change', updateColorScheme);
    inputBars.addEventListener('input', updateStripeWidth);
    inputBars.addEventListener('change', updateStripeWidth);
    inputSpeed.addEventListener('input', updateSpeed);
    inputSpeed.addEventListener('change', updateSpeed);
    inputDotY.addEventListener('input', updateDotY);
    inputDotY.addEventListener('change', updateDotY);
    inputLength.addEventListener('input', updateFootShape);
    inputLength.addEventListener('change', updateFootShape);
    inputWidth.addEventListener('input', updateFootShape);
    inputWidth.addEventListener('change', updateFootShape);
    inputRotate.addEventListener('input', updateFootShape);
    inputRotate.addEventListener('change', updateFootShape);
    btnReset.addEventListener('click', resetControls);

    updateContrast();
    updateColorScheme();
    updateStripeWidth();
    updateSpeed();
    updateDotY();
    updateFootShape();
    setPlayButton();
    setDotButton();
    setFullscreenButton();
});
