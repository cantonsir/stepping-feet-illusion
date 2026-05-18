document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_URL = "PASTE_STEPPING_FEET_SCRIPT_URL_HERE";

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
    const taskUi = document.getElementById('task-ui');
    const taskScreens = {
        menu: document.getElementById('task-menu'),
        instruction: document.getElementById('task-instruction'),
        response: document.getElementById('task-response'),
    };
    const taskConditionLabel = document.getElementById('task-condition-label');
    const taskTitle = document.getElementById('task-title');
    const taskDesc = document.getElementById('task-desc');
    const taskRunningLabel = document.getElementById('task-running-label');
    const responseConditionLabel = document.getElementById('response-condition-label');
    const responseNote = document.getElementById('response-note');
    const submitResponse = document.getElementById('submit-response');
    const submitStatus = document.getElementById('submit-status');

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

    const conditions = {
        dot: {
            key: 'dot',
            label: 'Red-dot fixation',
            title: 'Keep your eyes on the red dot',
            desc: 'Watch for about one minute. Keep your eyes on the red dot and notice what the moving blocks seem to do.',
            runningLabel: 'Keep your eyes on the red dot',
            dotVisible: true,
        },
        free: {
            key: 'free',
            label: 'Free viewing',
            title: 'Watch naturally',
            desc: 'Watch for about one minute. Look naturally at the display and notice what stands out most.',
            runningLabel: 'Watch naturally',
            dotVisible: false,
        },
        observed: {
            key: 'observed',
            label: 'Observed gaze',
            title: 'Watch naturally',
            desc: 'Watch for about one minute. The host can note gaze separately; answer only what you noticed.',
            runningLabel: 'Watch naturally while gaze is observed',
            dotVisible: false,
        },
    };

    const conditionAliases = {
        fixation: 'dot',
        red: 'dot',
        red_dot: 'dot',
        'red-dot': 'dot',
        freeview: 'free',
        free_viewing: 'free',
        'free-viewing': 'free',
        gaze: 'observed',
        tracker: 'observed',
        tracked: 'observed',
        observe: 'observed',
    };

    const sessionId = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const responseState = {
        perception: '',
        attention: '',
        strength: '',
    };
    let currentCondition = null;
    let submitting = false;
    let wakeLock = null;
    let startedFromPreset = false;

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

    const setPlaying = (isPlaying) => {
        canvas.classList.toggle('playing', isPlaying);
        setPlayButton();
    };

    const setDotVisible = (isVisible) => {
        canvas.classList.toggle('show-dot', isVisible);
        setDotButton();
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

    const normalizeCondition = (value) => {
        if (!value) return '';
        const key = value.trim().toLowerCase();
        return conditions[key] ? key : conditionAliases[key] || '';
    };

    const showTaskScreen = (name) => {
        Object.entries(taskScreens).forEach(([key, screen]) => {
            screen.classList.toggle('active', key === name);
        });
        document.body.classList.toggle('task-screen-visible', Boolean(name));
        if (name) {
            document.body.classList.remove('task-running');
        }
    };

    const acquireWakeLock = async () => {
        try {
            if ('wakeLock' in navigator && !wakeLock) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (error) {
            wakeLock = null;
        }
    };

    const releaseWakeLock = () => {
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    };

    const enterTaskMode = (conditionKey) => {
        document.body.classList.add('task-mode');
        if (conditionKey) {
            startCondition(conditionKey);
        } else {
            showTaskMenu();
        }
    };

    const exitTaskMode = () => {
        releaseWakeLock();
        document.body.classList.remove('task-mode', 'task-screen-visible', 'task-running');
        currentCondition = null;
        showTaskScreen(null);
    };

    const showTaskMenu = () => {
        currentCondition = null;
        clearResponse();
        showTaskScreen('menu');
    };

    const startCondition = (conditionKey) => {
        const condition = conditions[conditionKey];
        if (!condition) {
            showTaskMenu();
            return;
        }

        currentCondition = condition;
        clearResponse();
        setDotVisible(condition.dotVisible);
        taskConditionLabel.textContent = condition.label;
        taskTitle.textContent = condition.title;
        taskDesc.textContent = condition.desc;
        taskRunningLabel.textContent = condition.runningLabel;
        responseConditionLabel.textContent = condition.label;
        showTaskScreen('instruction');
    };

    const startTask = (isReview = false) => {
        if (!currentCondition) {
            showTaskMenu();
            return;
        }

        setPlaying(true);
        setDotVisible(currentCondition.dotVisible);
        showTaskScreen(null);
        document.body.classList.add('task-running');
        if (!isReview) {
            clearResponse();
        }
        acquireWakeLock();
    };

    const finishTask = () => {
        releaseWakeLock();
        document.body.classList.remove('task-running');
        showTaskScreen('response');
    };

    const selectResponse = (field, value, button) => {
        if (!field || !(field in responseState) || submitting) return;
        responseState[field] = value;
        button.closest('.response-group').querySelectorAll('.choice').forEach((choice) => {
            choice.classList.toggle('selected', choice === button);
        });
        updateSubmitState();
    };

    function clearResponse() {
        responseState.perception = '';
        responseState.attention = '';
        responseState.strength = '';
        submitting = false;
        taskUi.querySelectorAll('.choice').forEach((choice) => {
            choice.classList.remove('selected');
            choice.disabled = false;
        });
        responseNote.value = '';
        responseNote.disabled = false;
        submitStatus.textContent = '';
        updateSubmitState();
    }

    function updateSubmitState() {
        const isComplete = responseState.perception && responseState.attention && responseState.strength;
        submitResponse.disabled = submitting || !isComplete;
    }

    const setResponseDisabled = (isDisabled) => {
        taskUi.querySelectorAll('.choice').forEach((choice) => {
            choice.disabled = isDisabled;
        });
        responseNote.disabled = isDisabled;
        updateSubmitState();
    };

    const readNumber = (input) => {
        const value = parseFloat(input.value);
        return Number.isFinite(value) ? value : '';
    };

    const getCurrentSettings = () => ({
        dotVisible: canvas.classList.contains('show-dot'),
        bars: readNumber(inputBars),
        speed: readNumber(inputSpeed),
        footLength: readNumber(inputLength),
        footWidth: readNumber(inputWidth),
        rotate: readNumber(inputRotate),
        dotY: readNumber(inputDotY),
        highContrast: cbContrast.checked,
        colorScheme: colorScheme.value,
    });

    const submitTaskResponse = () => {
        if (!currentCondition || submitResponse.disabled || submitting) return;

        submitting = true;
        setResponseDisabled(true);
        submitResponse.disabled = true;
        submitStatus.textContent = 'Saving...';

        const payload = {
            session: sessionId,
            timestamp: new Date().toISOString(),
            condition: currentCondition.key,
            perception: responseState.perception,
            attention: responseState.attention,
            strength: responseState.strength,
            note: responseNote.value.trim(),
            ...getCurrentSettings(),
        };

        window.__steppingFeetLastPayload = payload;

        const hasScriptUrl = SCRIPT_URL && !SCRIPT_URL.includes('PASTE_');
        if (hasScriptUrl) {
            try {
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    keepalive: true,
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload),
                }).catch((error) => console.error('submit failed', error));
            } catch (error) {
                console.error('submit threw', error);
            }
        } else {
            console.warn('No SCRIPT_URL set - response not sent:', payload);
        }

        setTimeout(() => {
            submitStatus.textContent = hasScriptUrl
                ? 'Submitted. Thank you.'
                : 'Recorded locally. Add SCRIPT_URL to send.';

            setTimeout(() => {
                submitting = false;
                if (startedFromPreset && currentCondition) {
                    startCondition(currentCondition.key);
                } else {
                    showTaskMenu();
                }
            }, 650);
        }, 250);
    };

    taskUi.addEventListener('click', (event) => {
        const conditionButton = event.target.closest('[data-condition]');
        if (conditionButton) {
            startedFromPreset = false;
            startCondition(conditionButton.dataset.condition);
            return;
        }

        const action = event.target.closest('[data-task-action]')?.dataset.taskAction;
        if (action === 'start-task') {
            startTask(false);
            return;
        }
        if (action === 'finish-task') {
            finishTask();
            return;
        }
        if (action === 'watch-again') {
            startTask(true);
            return;
        }
        if (action === 'show-menu') {
            startedFromPreset = false;
            showTaskMenu();
            return;
        }
        if (action === 'exit-task-mode') {
            exitTaskMode();
            return;
        }

        const choice = event.target.closest('.choice');
        if (choice) {
            const group = choice.closest('.response-group');
            selectResponse(group?.dataset.field, choice.dataset.value, choice);
        }
    });

    submitResponse.addEventListener('click', submitTaskResponse);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && document.body.classList.contains('task-running')) {
            acquireWakeLock();
        }
    });

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

    const params = new URLSearchParams(location.search);
    const presetCondition = normalizeCondition(params.get('condition'));
    const phoneViewport = window.matchMedia('(max-width: 720px)').matches;
    const taskRequested = presetCondition || params.has('demo') || phoneViewport;

    if (taskRequested) {
        startedFromPreset = Boolean(presetCondition);
        enterTaskMode(presetCondition);
    }
});
