window.addEventListener('DOMContentLoaded', () => {
    const debugLog = (...args) => {
      if (typeof window !== "undefined" && (window.localStorage?.getItem("REFINZI_DEBUG") === "true" || window.REFINZI_DEBUG)) {
        console.log(...args);
      }
    };

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
    let activeFormat = 'cursor';
    let currentSections = null;

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

    function compileFormattedText(sections, format) {
        if (!sections) return '';
        if (format === 'cursor') {
            return `# [Refinzi Blueprint] ${artifactType ? artifactType.toUpperCase() : 'PRODUCTION'} SPECIFICATION

## 1. System & Architecture Constraints
- Layout: ${sections.structure}
- Components: ${sections.components}

## 2. Creative Copy & Conversion Directives
${sections.copy}

## 3. Motion & Interaction Curves
${sections.interactions}

## 4. Implementation Prompt Pack (For AI Coding Agents)
${sections.promptPack}

## 5. Implementation Checklist
${sections.checklist}

// Refined with Refinzi 2.0`.trim();
        } else if (format === 'claude') {
            return `<blueprint type="${artifactType || 'spec'}">
<structure>
${sections.structure}
</structure>
<components>
${sections.components}
</components>
<copy>
${sections.copy}
</copy>
<interactions>
${sections.interactions}
</interactions>
<implementation>
${sections.promptPack}
</implementation>
<checklist>
${sections.checklist}
</checklist>
</blueprint>`.trim();
        } else {
            return `## Structure
${sections.structure}

## Components
${sections.components}

## Copy
${sections.copy}

## Interactions
${sections.interactions}

## Prompt Pack
${sections.promptPack}

## Implementation Checklist
${sections.checklist}`.trim();
        }
    }

    // ── Parse & Render Structured Sections ──
    function renderStructuredBlueprint(promptText) {
        const sections = {
            structure: "",
            components: "Visual components and assets defined by the layout blueprint.",
            copy: "",
            interactions: "",
            promptPack: "",
            checklist: ""
        };

        // Split prompt by markdown headings
        const parts = promptText.split(/###\s+/);
        parts.forEach(part => {
            const lines = part.split("\n");
            const heading = lines[0].trim().toLowerCase();
            const content = lines.slice(1).join("\n").trim();
            
            if (heading.includes("visual dna")) {
                sections.structure = content;
            } else if (heading.includes("creative concept")) {
                sections.copy = content;
            } else if (heading.includes("scroll story")) {
                sections.checklist = content;
            } else if (heading.includes("motion blueprint")) {
                sections.interactions = content;
            } else if (heading.includes("implementation prompt")) {
                sections.promptPack = content;
                // Expose component blocks if explicitly present
                const compMatch = content.match(/components:\s*([\s\S]*?)(?:\n\n|\n###|$)/i);
                if (compMatch) {
                    sections.components = compMatch[1].trim();
                }
            }
        });

        // Fallbacks for missing sections
        if (!sections.structure) sections.structure = promptText;
        if (!sections.copy) sections.copy = "Derived from creative layout theme.";
        if (!sections.interactions) sections.interactions = "Derived from motion physics blueprint.";
        if (!sections.promptPack) sections.promptPack = promptText;
        if (!sections.checklist) sections.checklist = "Implementation checklist derived from scroll structure.";

        currentSections = sections;

        // Populate DOM elements
        const structureEl = document.getElementById("section-structure");
        const componentsEl = document.getElementById("section-components");
        const copyEl = document.getElementById("section-copy");
        const interactionsEl = document.getElementById("section-interactions");
        const promptpackEl = document.getElementById("section-promptpack");
        const checklistEl = document.getElementById("section-checklist");

        if (structureEl) structureEl.textContent = sections.structure;
        if (componentsEl) componentsEl.textContent = sections.components;
        if (copyEl) copyEl.textContent = sections.copy;
        if (interactionsEl) interactionsEl.textContent = sections.interactions;
        if (promptpackEl) promptpackEl.textContent = sections.promptPack;
        if (checklistEl) checklistEl.textContent = sections.checklist;

        editor.value = compileFormattedText(sections, activeFormat);
    }

    // Format toolbar listener
    const formatToolbar = document.getElementById("format-toolbar");
    if (formatToolbar) {
        formatToolbar.addEventListener("click", (e) => {
            const pill = e.target.closest(".format-pill");
            if (!pill) return;
            formatToolbar.querySelectorAll(".format-pill").forEach(p => {
                p.classList.remove("is-active");
                p.setAttribute("aria-checked", "false");
            });
            pill.classList.add("is-active");
            pill.setAttribute("aria-checked", "true");
            activeFormat = pill.dataset.format || "cursor";
            if (currentSections) {
                editor.value = compileFormattedText(currentSections, activeFormat);
            }
        });
    }

    // ── Receive data from main process ──
    window.refinzi.outputModal.onSetData((payload) => {
        if (!payload) return;

        const byokWall = document.getElementById("byok-wall");
        const sectionsContainer = document.getElementById("sections-container");
        const actionBar = document.getElementById("action-bar");
        const actionDivider = document.getElementById("action-divider");

        if (payload.isQuotaExceeded) {
            if (byokWall) byokWall.classList.remove("hidden");
            if (sectionsContainer) sectionsContainer.classList.add("hidden");
            if (actionBar) actionBar.classList.add("hidden");
            if (actionDivider) actionDivider.classList.add("hidden");

            // Wire BYOK buttons
            const addKeyBtn = document.getElementById("wall-add-key-btn");
            const laterBtn = document.getElementById("wall-later-btn");

            if (addKeyBtn) {
                addKeyBtn.onclick = () => {
                    window.refinzi.app.openSettings({ focusApiKey: true }).catch(() => {});
                    window.refinzi.outputModal.close();
                };
            }
            if (laterBtn) {
                laterBtn.onclick = () => {
                    if (currentPrompt) {
                        // Dismiss wall overlay and restore previous blueprint visualization
                        if (byokWall) byokWall.classList.add("hidden");
                        if (sectionsContainer) sectionsContainer.classList.remove("hidden");
                        if (actionBar) actionBar.classList.remove("hidden");
                        if (actionDivider) actionDivider.classList.add("hidden");
                    } else {
                        // Close modal window if no background blueprint exists
                        window.refinzi.outputModal.close();
                    }
                };
            }
            return;
        }

        // Hide BYOK wall
        if (byokWall) byokWall.classList.add("hidden");
        if (sectionsContainer) sectionsContainer.classList.remove("hidden");
        if (actionBar) actionBar.classList.remove("hidden");
        if (actionDivider) actionDivider.classList.remove("hidden");

        debugLog("[TRACE_DROP][HOP 10: PASS] outputModal.onSetData — prompt rendered to output window, prompt length:", payload.prompt?.length || 0, "type:", payload.artifactType || "unknown");
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
        windowTitleEl.textContent = typeLabel ? `${typeLabel} Blueprint` : 'Blueprint';

        // Display prompt
        debugLog("[TRACE_DROP][HOP 10: PASS] outputModal — prompt text assigned to editor, visible on screen");
        editor.value = currentPrompt;
        editor.scrollTop = 0;

        renderStructuredBlueprint(currentPrompt);

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
            'reel': 'Reel',
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
        copyLabel.textContent = 'Copy Full Blueprint';
        copyBtn.disabled = false;

        // Regenerate
        regenBtn.classList.remove('loading');
        regenIcon.textContent = '↻';
        regenLabel.textContent = 'Rebuild';
        regenBtn.disabled = false;

        // Expert
        expertBtn.classList.remove('loading');
        expertIcon.textContent = '🧠';
        expertLabel.textContent = 'Make Production Ready';
        expertBtn.disabled = false;
    }

    function triggerCopyFull() {
        const text = editor.value.trim();
        if (!text) return;

        window.refinzi.outputModal.copy(text);

        // Track analytics
        analytics.copy_clicked = true;
        flushAnalytics();

        // Visual feedback
        copyBtn.classList.add('copied');
        copyLabel.textContent = '✓ Copied Full Blueprint!';
        
        if (copyToast) {
            copyToast.textContent = `✓ Blueprint copied to clipboard`;
            copyToast.classList.remove('hidden');
        }

        if (copyToastTimeout) clearTimeout(copyToastTimeout);
        if (copyResetTimeout) clearTimeout(copyResetTimeout);

        copyToastTimeout = setTimeout(() => {
            if (copyToast) copyToast.classList.add('hidden');
        }, 2500);

        copyResetTimeout = setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyLabel.textContent = 'Copy Full Blueprint';
        }, 2200);
    }

    // ── Copy Prompt ──
    copyBtn.addEventListener('click', triggerCopyFull);

    // ── Individual Section Copy Handler ──
    const sectionsContainerEl = document.getElementById('sections-container');
    if (sectionsContainerEl) {
        sectionsContainerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.section-copy-btn');
            if (!btn) return;
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (!targetEl) return;

            const text = targetEl.textContent.trim();
            if (!text) return;

            window.refinzi.outputModal.copy(text);

            const origText = btn.textContent;
            btn.textContent = '✓ Copied';
            btn.style.color = '#00e676';
            btn.style.borderColor = 'rgba(0, 230, 118, 0.5)';
            btn.style.background = 'rgba(0, 230, 118, 0.12)';

            if (copyToast) {
                copyToast.textContent = `✓ Section copied to clipboard`;
                copyToast.classList.remove('hidden');
                setTimeout(() => {
                    if (copyToast) copyToast.classList.add('hidden');
                }, 2000);
            }

            setTimeout(() => {
                btn.textContent = origText;
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.style.background = '';
            }, 2000);
        });
    }

    // ── Regenerate ──
    regenBtn.addEventListener('click', async () => {
        if (regenBtn.disabled) return;

        // Show loading state
        regenBtn.classList.add('loading');
        regenIcon.textContent = '↻';
        regenLabel.textContent = 'Rebuilding...';
        copyBtn.disabled = true;
        expertBtn.disabled = true;

        // Track analytics
        analytics.regenerated = true;

        try {
            if (artifactContext && window.refinzi.orb && window.refinzi.orb.generatePrompt) {
                const result = await window.refinzi.orb.generatePrompt(artifactContext);
                if (result && result.prompt) {
                    currentPrompt = result.prompt;
                    editor.value = currentPrompt;
                    editor.scrollTop = 0;
                    renderStructuredBlueprint(currentPrompt);
                }
            }
        } catch (err) {
            console.error('[Output] Rebuild failed:', err);
        } finally {
            regenBtn.classList.remove('loading');
            regenIcon.textContent = '↻';
            regenLabel.textContent = 'Rebuild';
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
                renderStructuredBlueprint(currentPrompt);
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

    // ── Close handler ──
    function closeModal() {
        flushAnalytics();
        window.refinzi.outputModal.close();
    }

    closeBtn.addEventListener('click', closeModal);

    // ── Global Keyboard Shortcuts ──
    window.addEventListener('keydown', (e) => {
        // Esc -> Close
        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
            return;
        }

        // Ctrl+Enter or Cmd+Enter -> Copy Full Blueprint
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            triggerCopyFull();
        }
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
