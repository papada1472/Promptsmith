window.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('prompt-editor');
    const windowTitleEl = document.getElementById('window-title');
    const closeBtn = document.getElementById('close-btn');
    const copyBtn = document.getElementById('copy-btn');
    const copyLabel = document.getElementById('copy-label');
    const regenBtn = document.getElementById('regenerate-btn');
    const regenIcon = document.getElementById('regen-icon');
    const regenLabel = document.getElementById('regen-label');
    const expertBtn = document.getElementById('expert-btn');
    const expertIcon = document.getElementById('expert-icon');
    const expertLabel = document.getElementById('expert-label');
    const copyToast = document.getElementById('copy-toast');

    // ── State ──
    let currentPrompt = '';
    let artifactContext = null;
    let artifactType = 'unknown';
    let sessionStartTime = Date.now();

    // Analytics accumulator for this session
    let analytics = {
        artifact_type: 'unknown',
        copy_clicked: false,
        expert_upgrade_clicked: false,
        regenerated: false,
        duration_ms: 0
    };

    let copyToastTimeout = null;
    let copyResetTimeout = null;

    // ── Receive data from main process ──
    window.refinzi.outputModal.onSetData((payload) => {
        if (!payload) return;

        currentPrompt = payload.prompt || '';
        artifactType = payload.artifactType || 'unknown';
        artifactContext = payload._artifactContext || null;
        sessionStartTime = Date.now();

        // Reset analytics for this new session
        analytics = {
            artifact_type: artifactType,
            copy_clicked: false,
            expert_upgrade_clicked: false,
            regenerated: false,
            duration_ms: 0
        };

        // Update title to show artifact type nicely
        const typeLabel = formatArtifactType(artifactType);
        windowTitleEl.textContent = typeLabel ? `${typeLabel} Prompt` : 'Prompt';

        // Display prompt
        editor.value = currentPrompt;
        editor.scrollTop = 0;

        // Reset all button states
        resetAllButtons();
    });

    // ── Format artifact type into human-readable label ──
    function formatArtifactType(type) {
        const map = {
            'image': 'Screenshot',
            'url': 'Website',
            'youtube': 'Video',
            'instagram': 'Post',
            'csv': 'Data',
            'docx': 'Document',
            'pdf': 'PDF',
            'text': 'Text',
            'ui-mockup': 'UI',
            'screenshot': 'Screenshot',
            'dashboard': 'Dashboard',
            'landing-page': 'Landing Page'
        };
        return map[type?.toLowerCase()] || '';
    }

    // ── Reset all button states ──
    function resetAllButtons() {
        // Copy
        copyBtn.classList.remove('copied');
        copyLabel.textContent = 'Copy Prompt';
        copyBtn.disabled = false;

        // Regenerate
        regenBtn.classList.remove('loading');
        regenIcon.textContent = '↻';
        regenLabel.textContent = 'Regenerate';
        regenBtn.disabled = false;

        // Expert
        expertBtn.classList.remove('loading');
        expertIcon.textContent = '🧠';
        expertLabel.textContent = 'Make Production Ready';
        expertBtn.disabled = false;
    }

    // ── Copy Prompt ──
    copyBtn.addEventListener('click', () => {
        const text = editor.value.trim();
        if (!text) return;

        window.refinzi.outputModal.copy(text);

        // Track analytics
        analytics.copy_clicked = true;
        flushAnalytics();

        // Visual feedback
        copyBtn.classList.add('copied');
        copyLabel.textContent = '✓ Copied!';
        copyToast.classList.remove('hidden');

        if (copyToastTimeout) clearTimeout(copyToastTimeout);
        if (copyResetTimeout) clearTimeout(copyResetTimeout);

        copyToastTimeout = setTimeout(() => {
            copyToast.classList.add('hidden');
        }, 2000);

        copyResetTimeout = setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyLabel.textContent = 'Copy Prompt';
        }, 2200);
    });

    // ── Regenerate ──
    regenBtn.addEventListener('click', async () => {
        if (regenBtn.disabled) return;

        // Show loading state
        regenBtn.classList.add('loading');
        regenIcon.textContent = '↻';
        regenLabel.textContent = 'Regenerating...';
        copyBtn.disabled = true;
        expertBtn.disabled = true;

        // Track analytics
        analytics.regenerated = true;

        try {
            // Re-call generatePromptAngles via the showPromptWindow flow
            // We call the expert upgrade with a signal to regenerate the base prompt
            // Actually: regenerate = call orb:generatePrompt again with same artifact context
            if (artifactContext && window.refinzi.orb && window.refinzi.orb.generatePrompt) {
                const result = await window.refinzi.orb.generatePrompt(artifactContext);
                if (result && result.prompt) {
                    currentPrompt = result.prompt;
                    editor.value = currentPrompt;
                    editor.scrollTop = 0;
                }
            }
        } catch (err) {
            console.error('[Output] Regenerate failed:', err);
        } finally {
            regenBtn.classList.remove('loading');
            regenIcon.textContent = '↻';
            regenLabel.textContent = 'Regenerate';
            copyBtn.disabled = false;
            expertBtn.disabled = false;
        }
    });

    // ── Make Production Ready (Expert Upgrade) ──
    expertBtn.addEventListener('click', async () => {
        if (expertBtn.disabled) return;

        const promptToUpgrade = editor.value.trim();
        if (!promptToUpgrade) return;

        // Show loading state
        expertBtn.classList.add('loading');
        expertIcon.textContent = '⟳';
        expertLabel.textContent = 'Making production ready...';
        copyBtn.disabled = true;
        regenBtn.disabled = true;

        // Track analytics
        analytics.expert_upgrade_clicked = true;

        try {
            const result = await window.refinzi.outputModal.upgradeToExpert(promptToUpgrade, artifactContext);
            if (result && result.prompt) {
                currentPrompt = result.prompt;
                editor.value = currentPrompt;
                editor.scrollTop = 0;
            }
        } catch (err) {
            console.error('[Output] Expert upgrade failed:', err);
        } finally {
            expertBtn.classList.remove('loading');
            expertIcon.textContent = '🧠';
            expertLabel.textContent = 'Make Production Ready';
            copyBtn.disabled = false;
            regenBtn.disabled = false;
        }

        flushAnalytics();
    });

    // ── Close ──
    closeBtn.addEventListener('click', () => {
        flushAnalytics();
        window.refinzi.outputModal.close();
    });

    // ── Flush analytics to main process ──
    function flushAnalytics() {
        analytics.duration_ms = Date.now() - sessionStartTime;
        if (window.refinzi.outputModal.logAnalytics) {
            window.refinzi.outputModal.logAnalytics({ ...analytics });
        }
    }

    // Flush on window hide/unload
    window.addEventListener('beforeunload', () => {
        flushAnalytics();
    });
});
