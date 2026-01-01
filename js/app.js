// js/app.js

import { loadFrameworkData } from './dataLoader.js';
import { UI } from './uiComponents.js';
import { Visuals } from './visuals.js';

// Helper function to safely parse markdown content
function parseMarkdown(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return '';
    }
    return window.marked ? window.marked.parse(text, { breaks: true }) : text;
}

// Simple, Zustand-like store for managing global state
const createStore = (createState) => {
    let state;
    const listeners = new Set();
    const setState = (partial) => {
        const oldState = state;
        state = { ...state, ...partial };
        listeners.forEach((listener) => listener(state, oldState));
    };
    const subscribe = (selector, callback) => {
        let lastState = selector(state);
        const listener = (newState, oldState) => {
            const nextState = selector(newState);
            if (nextState !== lastState) {
                lastState = nextState;
                callback(nextState, selector(oldState));
            }
        };
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    const getState = () => state;
    state = createState(setState, getState);
    return { setState, subscribe, getState };
};

const useStore = createStore((set) => ({
    currentDomain: 'general',
    setDomain: (domain) => set({ currentDomain: domain }),
    conceptCloudFilterDomain: 'all', // 'all', 'science', 'business', etc.
    setConceptCloudFilterDomain: (domain) => set({ conceptCloudFilterDomain: domain }),
}));

// State for the currently active tool view
let currentToolState = {
    activePerspective: 'jobToBeDone' 
};
let previousToolId = null; // Track the last viewed tool ID

// Rendering lock to prevent race conditions
let isRendering = false;

function handleDomainConceptFilter(e) {
    const filterBtn = e.target.closest('.concept-cloud-toggle-btn');
    if (!filterBtn) return false;

    const selectedDomain = filterBtn.dataset.domainFilter;
    
    document.querySelectorAll('.concept-cloud-toggle-btn').forEach(btn => btn.classList.remove('active'));
    filterBtn.classList.add('active');

    document.querySelectorAll('#concept-cloud-accordion-group .accordion-item').forEach(item => {
        const itemDomains = item.dataset.domains.split(',');
        if (selectedDomain === 'all' || itemDomains.includes(selectedDomain)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });

    return true;
}

// --- SCROLL CONTROL LOGIC ---
function setupScrollControls(containerId, wrapperClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scrollArea = container.querySelector(wrapperClass);
    const leftBtn = container.querySelector('.scroll-paddle.left');
    const rightBtn = container.querySelector('.scroll-paddle.right');

    if (!scrollArea || !leftBtn || !rightBtn) return;

    const SCROLL_STEP = 300; // Pixels to move on click
    const HOVER_SPEED = 15;  // Pixels per frame on hover
    let scrollInterval;

    // Helper for continuous scrolling
    const startScrolling = (direction) => {
        if (scrollInterval) return; // Prevent multiple intervals
        
        const scrollStep = direction === 'right' ? HOVER_SPEED : -HOVER_SPEED;
        
        const animate = () => {
            // Check if we can actually scroll
            if (scrollArea.scrollWidth > scrollArea.clientWidth) {
                scrollArea.scrollLeft += scrollStep;
            }
            scrollInterval = requestAnimationFrame(animate);
        };
        scrollInterval = requestAnimationFrame(animate);
    };

    const stopScrolling = () => {
        if (scrollInterval) {
            cancelAnimationFrame(scrollInterval);
            scrollInterval = null;
        }
    };

    // --- LEFT BUTTON ---
    // Click (Incremental)
    leftBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollArea.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    };
    // Hover (Continuous)
    leftBtn.onmouseenter = () => startScrolling('left');
    leftBtn.onmouseleave = stopScrolling;
    leftBtn.onmousedown = stopScrolling; // Stop hover scroll if they click

    // --- RIGHT BUTTON ---
    // Click (Incremental)
    rightBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollArea.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    };
    // Hover (Continuous)
    rightBtn.onmouseenter = () => startScrolling('right');
    rightBtn.onmouseleave = stopScrolling;
    rightBtn.onmousedown = stopScrolling;
}

document.addEventListener('DOMContentLoaded', async () => {
    const cognitiveToolkitData = await loadFrameworkData();
    
    if (!cognitiveToolkitData) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="card full-width" style="border-left: 5px solid var(--danger-color);">
                    <h1>Application Error</h1>
                    <p>Could not load the necessary framework data. The application cannot start.</p>
                    <p>This is often due to a missing or malformed data file. Please check the browser's developer console (F12) for a more specific error message from the data loader.</p>
                </div>
            `;
        }
        console.error("Application cannot start without data. Halting initialization.");
        return;
    }

    let currentStance = localStorage.getItem('cognitive-toolkit-stance') || 'learning';
    let currentPersona = localStorage.getItem('cognitive-toolkit-persona') || 'practitioner';
    
    let nodeFrameworkData;
    let mapFrameworkData;
    let modalitiesFrameworkData;
    let glossaryToolData;

    function init() {
        const cleanTitle = cognitiveToolkitData.framework_data.frameworkTitle.replace('Dialogic ', '');
        document.title = cleanTitle;
        
        // Restore Sidebar State immediately to prevent FOUC
        const isSidebarCollapsed = localStorage.getItem('cognitive-toolkit-sidebar-collapsed') === 'true';
        if (isSidebarCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        }

        populateSidebar();
        renderMiniMap();
        setupEventListeners();
        
        initializeAccessibilityToggles();
        initializeStanceSwitch();

        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'welcome';
        const id = params.get('id');
        renderView(view, id);
    }

    function populateSidebar() {
        const toolNav = document.getElementById('tool-nav');
        
        // 1. Generate Tool Links (Dynamic)
        const toolLinksHTML = cognitiveToolkitData.framework_data.tools.map((tool, index) => {
            return `<li><a href="?view=tool&id=${tool.id}" data-view="tool" data-id="${tool.id}">
                <span class="nav-item-number">${index + 1}.</span>
                <span class="tool-swatch" style="background-color: ${tool.color};"></span>
                <span class="nav-text" data-jargon="${tool.name}" data-simple="${tool.simpleName}">${tool.name}</span>
            </a></li>`;
        }).join('');

        // 2. Helper to generate Resource Links
        const createNavLink = (view, icon, text) => `<li><a href="?view=${view}" data-view="${view}">
            <i class="fas ${icon} nav-icon"></i> 
            <span class="nav-text">${text}</span>
        </a></li>`;

        // 3. Define Link Groups
        const referenceLinks = [
            createNavLink('synthesis-table', 'fa-compress-arrows-alt', 'Grand Synthesis Table'),
            createNavLink('glossary-tool', 'fa-language', 'Dynamic Glossary'),
            createNavLink('rubrics', 'fa-tasks', 'Rubric Library'),
            createNavLink('glossary', 'fa-book', 'Full Glossary'),
            createNavLink('bibliography', 'fa-scroll', 'Bibliography')
        ].join('');

        const advancedLinks = [
            createNavLink('pathways', 'fa-star-of-life', 'Pathway Explorer')
        ].join('');

        const metaLinks = [
            createNavLink('governance', 'fa-sitemap', 'Governance Engine'),
            createNavLink('strategy', 'fa-chess-board', 'Strategic Blueprint'),
            createNavLink('protocol', 'fa-robot', 'AI Command Protocol'),
            createNavLink('playbooks-reports', 'fa-book-reader', 'Playbooks & Reports'),
            createNavLink('community', 'fa-users', 'Community & Contribution'),
            createNavLink('about', 'fa-info-circle', 'About this Framework')
        ].join('');

        // 4. Helper to build a Section with Header Icon
        const buildSection = (title, iconClass, contentHTML) => `
            <div class="nav-section">
                <h3 class="nav-section-title" title="${title}">
                    <i class="fas ${iconClass} section-icon"></i>
                    <span class="section-text">${title}</span>
                </h3>
                <ul id="${title.toLowerCase()}-nav">
                    ${contentHTML}
                </ul>
            </div>
        `;

        // 5. Inject Full HTML
        const plannerLink = createNavLink('planner', 'fa-clipboard-list', 'Integrated Planner');
        const diagnosticLink = createNavLink('diagnostic', 'fa-diagnoses', 'Diagnostic Navigator');
        const overviewLink = createNavLink('overview', 'fa-rocket', 'Interactive Overview');
        const mapLink = createNavLink('map', 'fa-map-signs', 'Visual Map');
        const networkLink = createNavLink('network', 'fa-project-diagram', 'Network Map');
        const nodesLink = createNavLink('nodes', 'fa-cubes', 'Node Explorer'); 
        const modalitiesLink = createNavLink('modalities', 'fa-brain', 'Modality Explorer');
        const hubLink = createNavLink('hub', 'fa-tools', 'Actionability Hub');
        const logLink = createNavLink('log', 'fa-feather-alt', 'Positionality Log');

        const utilityToolsHTML = [plannerLink, diagnosticLink, overviewLink, mapLink, networkLink, nodesLink, modalitiesLink, hubLink, logLink].join('');
        
        const sidebarNav = document.getElementById('sidebar-nav');
        sidebarNav.innerHTML = `
            ${buildSection('Tools', 'fa-toolbox', utilityToolsHTML + toolLinksHTML)}
            ${buildSection('Reference', 'fa-book', referenceLinks)}
            ${buildSection('Advanced', 'fa-layer-group', advancedLinks)}
            ${buildSection('Meta', 'fa-globe', metaLinks)}
        `;
    }
        
    function renderMiniMap() {
        const container = document.getElementById('mini-map-container');
        container.innerHTML = cognitiveToolkitData.framework_data.tools.map(tool => 
            `<div class="mini-map-segment" data-id="${tool.id}" style="background-color: ${tool.color};" title="${tool.name}"></div>`
        ).join('');
    }

    function setupEventListeners() {
        document.getElementById('sidebar-nav').addEventListener('click', handleSidebarClick);
        document.body.addEventListener('click', handleMainContentClick);
        document.getElementById('menu-toggle').addEventListener('click', toggleMobileMenu);
        
        document.getElementById('simple-mode-checkbox').addEventListener('change', e => toggleSimpleMode(e.target.checked));
        document.getElementById('dark-mode-checkbox').addEventListener('change', e => toggleAccessibilityMode('dark-mode-active', e.target.checked));
        document.getElementById('high-contrast-checkbox').addEventListener('change', e => toggleAccessibilityMode('high-contrast-mode', e.target.checked));
        document.getElementById('reader-mode-checkbox').addEventListener('change', e => toggleAccessibilityMode('reader-mode', e.target.checked));
        document.getElementById('exit-reader-mode-btn').addEventListener('click', () => {
            document.getElementById('reader-mode-checkbox').checked = false;
            toggleAccessibilityMode('reader-mode', false);
        });

        const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
        if (sidebarCollapseBtn) {
            sidebarCollapseBtn.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');
                const isCollapsed = document.body.classList.contains('sidebar-collapsed');
                localStorage.setItem('cognitive-toolkit-sidebar-collapsed', isCollapsed);
            });
        }

        window.addEventListener('popstate', (event) => {
            const params = new URLSearchParams(window.location.search);
            renderView(params.get('view') || 'welcome', params.get('id'));
        });

        const backToTopBtn = document.getElementById('back-to-top-btn');
        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            });
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const shortcutsModal = document.getElementById('keyboard-shortcuts-modal');
        if (shortcutsModal) {
            document.addEventListener('keydown', (e) => {
                if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        shortcutsModal.showModal();
                    }
                }
                if (e.key >= '1' && e.key <= '9') {
                    const toolIndex = parseInt(e.key) - 1;
                    const tool = cognitiveToolkitData.framework_data.tools[toolIndex];
                    if (tool && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        const url = new URL(window.location);
                        url.searchParams.set('view', 'tool');
                        url.searchParams.set('id', tool.id);
                        history.pushState({}, '', url.search);
                        renderView('tool', tool.id);
                    }
                }
                if (e.key === '0') {
                    const tool = cognitiveToolkitData.framework_data.tools[9]; // Tool 10
                    if (tool && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                        const url = new URL(window.location);
                        url.searchParams.set('view', 'tool');
                        url.searchParams.set('id', tool.id);
                        history.pushState({}, '', url.search);
                        renderView('tool', tool.id);
                    }
                }
            });
            shortcutsModal.addEventListener('keydown', (e) => { if (e.key === 'Escape') { shortcutsModal.close(); } });
            shortcutsModal.querySelector('.close-modal').addEventListener('click', () => { shortcutsModal.close(); });
        }

        const nodeModal = document.getElementById('node-details-modal');
        if (nodeModal) {
            nodeModal.querySelector('.close-modal').addEventListener('click', () => {
                nodeModal.close();
            });

            nodeModal.addEventListener('click', (event) => {
                if (event.target === nodeModal) {
                    nodeModal.close();
                }
            });
        }
    }

    function handleSidebarClick(e) {
        const link = e.target.closest('a');
        if (link && link.hasAttribute('data-view')) {
            e.preventDefault();
            const url = new URL(link.href);
            history.pushState({}, '', url.search);
            renderView(link.dataset.view, link.dataset.id);
            if (window.innerWidth <= 1024) {
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
            }
        }
    }

            function handleConceptCloudEvents(e) {
        const filterBtn = e.target.closest('.filter-chip');
        const bubbleBtn = e.target.closest('.concept-bubble');
        const closeBtn = e.target.closest('#popover-close-btn');
        const overlay = e.target.closest('#concept-popover-overlay');

        // Initialize state if it doesn't exist
        if (typeof window.activeConceptFilter === 'undefined') {
            window.activeConceptFilter = 'all';
        }

        const formatTheoryText = (text) => {
            if (!text) return "No theory available.";
            return text
                .replace('Definition:', '<span class="highlight-key">Definition:</span>')
                .replace('Procedural Link:', '<br><br><span class="highlight-key">Procedural Link:</span>');
        };

        // --- FILTER CLICK HANDLER ---
        if (filterBtn) {
            document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');

            const selectedDomain = filterBtn.dataset.domain;
            window.activeConceptFilter = selectedDomain; // UPDATE GLOBAL STATE

            // Define Domain Colors for Bubbles
            const domainColors = {
                "Science & Engineering": "var(--domain-science)",
                "Business & Agile": "var(--domain-business)",
                "Humanities & Social Sciences": "var(--domain-humanities)",
                "Arts & Design": "var(--domain-arts)",
                "Culture & Ethics": "var(--domain-culture)",
                "Pedagogy & Facilitation": "var(--domain-pedagogy)",
                "General / Pluralist": "var(--domain-general)"
            };

            const targetColor = domainColors[selectedDomain];

            const bubbles = document.querySelectorAll('.concept-bubble');
            bubbles.forEach(bubble => {
                const domains = bubble.dataset.domains.split(',');
                // Check visibility
                if (selectedDomain === 'all' || domains.includes(selectedDomain)) {
                    bubble.classList.remove('hidden');
                    bubble.classList.add('fade-in');

                    // Apply Color Logic
                    if (selectedDomain !== 'all' && targetColor) {
                        bubble.style.backgroundColor = targetColor;
                        bubble.style.color = '#ffffff';
                        bubble.style.borderColor = targetColor;
                        bubble.style.boxShadow = '0 2px 5px rgba(0,0,0,0.15)';
                    } else {
                        // Reset to default CSS styles for 'All' view
                        bubble.style.backgroundColor = '';
                        bubble.style.color = '';
                        bubble.style.borderColor = '';
                        bubble.style.boxShadow = '';
                    }
                } else {
                    bubble.classList.add('hidden');
                    bubble.classList.remove('fade-in');
                }
            });
            return;
        }

        // --- BUBBLE CLICK HANDLER ---
        if (bubbleBtn) {
            const conceptId = bubbleBtn.dataset.conceptId;
            
            let conceptData = null;
            const allTools = cognitiveToolkitData.framework_data.toolConcepts;
            for (const toolId in allTools) {
                const found = allTools[toolId].find(c => c.id === conceptId);
                if (found) { conceptData = found; break; }
            }

            if (conceptData) {
                // Use the global filter state to select the variation
                let variation = conceptData.variations[0]; // Default
                if (window.activeConceptFilter !== 'all') {
                    const match = conceptData.variations.find(v => v.domain === window.activeConceptFilter);
                    if (match) {
                        variation = match;
                    } else {
                        // Fallback
                        variation = conceptData.variations.find(v => v.domain === 'General / Pluralist') || conceptData.variations[0];
                    }
                }

                document.getElementById('popover-title').textContent = conceptData.name;
                document.getElementById('popover-domain-badge').textContent = variation.domain;
                document.getElementById('popover-expert').textContent = variation.expert || "N/A";
                document.getElementById('popover-theory').innerHTML = formatTheoryText(variation.theory);
                document.getElementById('popover-deliverable').textContent = variation.specific_deliverable || "N/A";
                document.getElementById('popover-rubric').textContent = variation.rubric || "N/A";

                const colors = {
                    "Science & Engineering": "var(--domain-science)",
                    "Business & Agile": "var(--domain-business)",
                    "Humanities & Social Sciences": "var(--domain-humanities)",
                    "Arts & Design": "var(--domain-arts)",
                    "Culture & Ethics": "var(--domain-culture)",
                    "Pedagogy & Facilitation": "var(--domain-pedagogy)",
                    "General / Pluralist": "var(--domain-general)"
                };
                
                const header = document.getElementById('popover-header');
                if(header) {
                    const colorVar = colors[variation.domain] || "#5f6368";
                    header.style.borderTopColor = colorVar;
                }

                document.getElementById('concept-popover-overlay').classList.add('visible');
                document.getElementById('concept-popover-card').classList.add('visible');
            }
            return;
        }

        if (closeBtn || (e.target && e.target.id === 'concept-popover-overlay')) {
            document.getElementById('concept-popover-overlay').classList.remove('visible');
            document.getElementById('concept-popover-card').classList.remove('visible');
        }
    }

    function handleMainContentClick(e) {
        if (handleDomainConceptFilter(e)) return;

        handleConceptCloudEvents(e);

        const nodeCard = e.target.closest('#nodes-view .node-card');
        const systemsLensToggle = e.target.closest('[data-action="toggle-systems-lens"]');
        const tab = e.target.closest('.systems-lens-tab');
        const translationsToggle = e.target.closest('[data-action="toggle-translations"]');
        const navLink = e.target.closest('[data-view]');
        const accordionHeader = e.target.closest('.accordion-header');
        const perspectiveTab = e.target.closest('.perspective-tab');
        const miniMapSegment = e.target.closest('.mini-map-segment');
        const exportButton = e.target.closest('#export-log-btn');
        const generateBtn = e.target.closest('#generate-prompt-btn');
        const internalLink = e.target.closest('a.internal-link');
        const personaButton = e.target.closest('.persona-switch button');
        const onboardingClose = e.target.closest('[data-action="dismiss-onboarding"]');

        if (onboardingClose) {
            const viewId = onboardingClose.dataset.viewId;
            localStorage.setItem(`onboarding-dismissed-${viewId}`, 'true');
            const card = document.getElementById(`onboarding-${viewId}`);
            if (card) {
                card.classList.add('dismissed');
            }
            return;
        }

        if (personaButton) {
            currentPersona = personaButton.dataset.persona;
            localStorage.setItem('cognitive-toolkit-persona', currentPersona);
            const params = new URLSearchParams(window.location.search);
            renderView(params.get('view'), params.get('id'), { scroll: false });
            return;
        }

        if (nodeCard) {
            const nodeId = nodeCard.dataset.nodeId;
            const nodeData = cognitiveToolkitData.framework_data.frameworkNodes.nodes.find(n => n.id === nodeId);
            if (nodeData) {
                showNodeModal(nodeData);
            }
        } else if (systemsLensToggle) {
            const content = systemsLensToggle.nextElementSibling;
            const icon = systemsLensToggle.querySelector('.accordion-icon');
            const isOpening = !content.style.display || content.style.display === 'none';
            content.style.display = isOpening ? 'block' : 'none';
            icon.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
        } else if (tab) {
            const target = tab.dataset.tabTarget;
            const tabContainer = tab.closest('.systems-lens-tabs');
            const contentContainer = tabContainer.nextElementSibling;
            tabContainer.querySelectorAll('.systems-lens-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contentContainer.querySelectorAll('.systems-lens-tab-content').forEach(c => c.classList.remove('active'));
            contentContainer.querySelector(`[data-tab-content="${target}"]`).classList.add('active');
        } else if (translationsToggle) {
            e.preventDefault();
            const content = translationsToggle.nextElementSibling;
            const isOpening = !content.style.display || content.style.display === 'none';
            content.style.display = isOpening ? 'block' : 'none';
            translationsToggle.innerHTML = isOpening ? 'Hide Domain Translations ?' : 'Show Domain Translations ?';
        } else if (internalLink && internalLink.dataset.linkType === 'node') {
            e.preventDefault();
            const nodeId = internalLink.dataset.nodeUid;
            const nodeData = cognitiveToolkitData.framework_data.frameworkNodes.nodes.find(n => n.uid === nodeId);
            if (nodeData) {
                showNodeModal(nodeData);
            }
        } else if (navLink && navLink.dataset.view && !navLink.closest('#sidebar-nav')) {
            e.preventDefault();
            const url = new URL(window.location);
            url.searchParams.set('view', navLink.dataset.view);
            if (navLink.dataset.id) url.searchParams.set('id', navLink.dataset.id);
            else url.searchParams.delete('id');
            history.pushState({}, '', url.search);
            renderView(navLink.dataset.view, navLink.dataset.id);
        } else if (accordionHeader && !accordionHeader.closest('#pathway-matrix') && !accordionHeader.closest('.concept-cloud-item')) {
            toggleAccordion(accordionHeader);
        } else if (accordionHeader && accordionHeader.closest('#concept-cloud-accordion-group')) {
            toggleAccordion(accordionHeader);
        } else if (perspectiveTab) {
            handlePerspectiveTabClick(perspectiveTab);
        } else if (miniMapSegment) {
            const toolId = miniMapSegment.dataset.id;
            const url = new URL(window.location);
            url.searchParams.set('view', 'tool');
            url.searchParams.set('id', toolId);
            history.pushState({}, '', url.search);
            renderView('tool', toolId);
        } else if (exportButton) {
            exportLog();
        } else if (generateBtn) {
            generatePlannerPrompt();
        }
    }
    
    function showNodeModal(nodeData) {
        const modal = document.getElementById('node-details-modal');
        if (!modal) return;

        const { frameworkNodes, tools } = cognitiveToolkitData.framework_data;
        const theme = frameworkNodes.themes[nodeData.theme];
        const parentTool = tools.find(t => t.id === nodeData.parentTool);

        document.getElementById('modal-node-icon').className = `fas ${theme.icon}`;
        document.getElementById('modal-node-icon').style.color = theme.color;
        document.getElementById('modal-node-name').textContent = nodeData.name;
        document.getElementById('modal-node-uid').textContent = nodeData.uid;

        document.getElementById('modal-node-description').innerHTML = parseMarkdown(nodeData.description);
        document.getElementById('modal-node-parent-tool').textContent = parentTool ? parentTool.name : 'N/A';
        document.getElementById('modal-node-theme').textContent = theme ? theme.name : 'N/A';

        const tagsEl = document.getElementById('modal-node-tags');
        tagsEl.innerHTML = nodeData.tags.map(tag => `<span>${tag}</span>`).join('');

        const inputs = Array.isArray(nodeData.inputs) ? nodeData.inputs : [nodeData.inputs];
        const outputs = Array.isArray(nodeData.outputs) ? nodeData.outputs : [nodeData.outputs];

        const inputsEl = document.getElementById('modal-node-inputs');
        inputsEl.innerHTML = inputs.map(input => `<li>${input}</li>`).join('');

        const outputsEl = document.getElementById('modal-node-outputs');
        outputsEl.innerHTML = outputs.map(output => `<li>${output}</li>`).join('');

        const systemsLensContainer = document.getElementById('modal-systems-lens-container');
        if (systemsLensContainer) {
            const { render } = window.litHtml;
            render(UI.renderSystemsLensAnalysis(nodeData.systemsThinkingAnalysis), systemsLensContainer);
        }

        modal.showModal();
    }

    function handlePerspectiveTabClick(tab) {
        if (!tab) return;
        const perspectiveKey = tab.dataset.perspective;
        
        // 1. Update the global state
        currentToolState.activePerspective = perspectiveKey;

        // 2. Get current view parameters
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'tool';
        const id = params.get('id');

        // 3. Re-render the view to update the Playbook section
        // { scroll: false } prevents the page from jumping to the top
        renderView(view, id, { scroll: false });
    }
    
    function renderView(view, id = null, options = { scroll: true }) {
        if (isRendering) {
            console.warn(`[WARN] Render already in progress. Ignoring request for view: '${view}'`);
            return;
        }
        isRendering = true;
        console.log(`[DEBUG] Starting renderView for view: '${view}', id: '${id}'`);

        let targetView; 
        try {
            const { render, html } = window.litHtml;

            const viewId = view === 'tool' ? 'tool-focus-view' : `${view}-view`;
            targetView = document.getElementById(viewId);

            if (!targetView) {
                console.error(`[FATAL] View container with id '${viewId}' not found in the DOM. Aborting render.`);
                isRendering = false;
                return; 
            }

            render(html``, targetView);

            if (!targetView.classList.contains('active-view')) {
                document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
                targetView.classList.add('active-view');
            }
            
                        previousToolId = (view === 'tool') ? id : null; 
            
            updateActiveSidebarLink(view, id);
            updateMiniMap(view, id);
            updateBreadcrumbs(view, id);
            
            if (options.scroll) {
                window.scrollTo(0, 0);
            }

            const viewLabels = {
                'welcome': 'Welcome', 'diagnostic': 'Diagnostic Navigator', 'tool': `Tool: ${id ? cognitiveToolkitData.framework_data.tools.find(t => t.id === id)?.name : 'Unknown'}`,
                'overview': 'Overview', 'map': 'Visual Map', 'network': 'Network Map', 'nodes': 'Node Explorer', 'modalities': 'Modality Explorer', 'hub': 'Actionability Hub',
                'log': 'Positionality Log', 'synthesis-table': 'Grand Synthesis Table', 'rubrics': 'Rubrics', 'glossary': 'Glossary', 'glossary-tool': 'Dynamic Glossary', 'playbooks-reports': 'Playbooks & Reports',
                'genesis-project': 'Project Genesis Case Study','bibliography': 'Bibliography',
                'strategy': 'Strategic Blueprint', 'protocol': 'AI Command Protocol', 'about': 'About', 'community': 'Community & Contribution',
                'advanced-toolkits': 'Advanced Toolkits', 'pathways': 'Pathway Explorer', 'planner': 'Integrated Planner'
            };
            const announcer = document.getElementById('main-content');
            if (announcer) { announcer.setAttribute('aria-label', `Loading ${viewLabels[view] || view} view`); }
            
            const isDismissed = localStorage.getItem(`onboarding-dismissed-${viewId}`) === 'true';
            const onboardingData = (!isDismissed && cognitiveToolkitData.onboarding_content.onboarding[viewId]) 
                ? cognitiveToolkitData.onboarding_content.onboarding[viewId] 
                : null;

            if (view === 'planner') {
                const plannerContainer = document.getElementById('planner-view');
                if (window.litHtml && cognitiveToolkitData.planner_content) {
                    render(UI.renderPlannerView(cognitiveToolkitData.planner_content, onboardingData, viewId), plannerContainer);
                } else {
                    render(html`<h1>Error: Planner content could not be loaded.</h1>`, plannerContainer);
                }
                if (announcer) { announcer.setAttribute('aria-label', `${viewLabels[view] || view} view loaded`); }
                isRendering = false;
                requestAnimationFrame(initializeNativePlanner);
                return; 
            }

            if (view === 'about') {
                const aboutData = cognitiveToolkitData.framework_data.about;
                const aboutContent = html`
                    <h1>${aboutData.title}</h1>
                    ${window.litHtml.unsafeHTML(parseMarkdown(aboutData.content))}
                `;
                render(aboutContent, targetView);
                if (announcer) { announcer.setAttribute('aria-label', `${viewLabels[view] || view} view loaded`); }
                isRendering = false;
                return; 
            }

            if (view === 'tool') {
                const tool = cognitiveToolkitData.framework_data.tools.find(t => t.id === id);
                if (tool) {
                    const conceptCloudFilterDomain = useStore.getState().conceptCloudFilterDomain;
                    const currentDomain = useStore.getState().currentDomain; // Get domain
                    
                    // Pass currentDomain as the last argument
                    render(UI.renderToolFocus(tool, currentStance, currentPersona, cognitiveToolkitData, onboardingData, viewId, currentToolState.activePerspective, conceptCloudFilterDomain, currentDomain), targetView);
                } else {
                    
                }
                if (announcer) { announcer.setAttribute('aria-label', `${viewLabels[view] || view} view loaded`); }
                applySimpleMode(localStorage.getItem('cognitive-toolkit-simple-mode') === 'true');
                isRendering = false;
                return; 
            }
            
            let content;
            switch(view) {
                case 'governance': content = UI.renderGovernanceEngine(cognitiveToolkitData.framework_data.process_models_data); break;
                case 'welcome':
                    content = UI.renderWelcome(cognitiveToolkitData.application_views, onboardingData, viewId);
                    break;
                case 'diagnostic':
                    content = UI.renderDiagnostic(cognitiveToolkitData.application_views);
                    break;
                case 'overview':
                    content = UI.renderOverviewView(cognitiveToolkitData.framework_data.tools, cognitiveToolkitData.methodologies_data.methodologies);
                    break;
                case 'map':
                    content = UI.renderVisualMap(cognitiveToolkitData.framework_data.frameworkNodes, cognitiveToolkitData.framework_data.tools, onboardingData, viewId);
                    break;
                case 'network':
                    content = UI.renderNetworkMapView(cognitiveToolkitData.framework_data.frameworkNodes, cognitiveToolkitData.framework_data.tools, onboardingData, viewId);
                    break;
                case 'nodes':
                    content = UI.renderNodeExplorer(cognitiveToolkitData.framework_data.frameworkNodes, cognitiveToolkitData.framework_data.tools, onboardingData, viewId);
                    break;
                case 'modalities':
                    content = UI.renderModalityExplorer(cognitiveToolkitData.framework_data.dls_modalities_framework, onboardingData, viewId);
                    break;
                case 'hub':
                    content = UI.renderHub();
                    break;
                case 'log':
                    content = UI.renderLog(getLogData());
                    break;
                case 'synthesis-table':
                    content = UI.renderGrandSynthesisTable(cognitiveToolkitData.framework_data.grandSynthesisTable, onboardingData, viewId);
                    break;
                case 'rubrics':
                    content = UI.renderRubricsView(cognitiveToolkitData.framework_data.rubrics);
                    break;
                case 'glossary':
                    content = UI.renderGlossaryView(cognitiveToolkitData.framework_data.glossary);
                    break;
                case 'glossary-tool':
                    content = UI.renderGlossaryToolView();
                    break;
                case 'playbooks-reports':
                    content = UI.renderPlaybooksReports(cognitiveToolkitData.playbooks_and_reports_data);
                    break;
                case 'bibliography':
                    content = UI.renderBibliographyView(cognitiveToolkitData.framework_data.bibliography);
                    break;
                case 'advanced-toolkits':
                    content = UI.renderAdvancedToolkits(cognitiveToolkitData.framework_data.node_foundry_enhanced);
                    break;
                case 'pathways':
                    content = UI.renderPathwayExplorer(cognitiveToolkitData.scaffold_model_data.content, cognitiveToolkitData.framework_data.tools, cognitiveToolkitData.framework_data.bibliography, onboardingData, viewId);
                    break;
                case 'strategy':
                    content = UI.renderStrategyView(cognitiveToolkitData.framework_data.strategy);
                    break;
                case 'protocol':
                    content = UI.renderProtocolView(cognitiveToolkitData.framework_data.ai_command_protocol);
                    break;
                case 'community':
                    content = UI.renderCommunity();
                    break;
                case 'genesis-project':
                    content = UI.renderGenesisProjectView(cognitiveToolkitData.project_genesis_data, onboardingData, viewId);
                    break;
                default:
                    content = UI.renderWelcome(cognitiveToolkitData.application_views, onboardingData, viewId);
            }
            
            render(content, targetView);

            requestAnimationFrame(() => {
                if (announcer) { announcer.setAttribute('aria-label', `${viewLabels[view] || view} view loaded`); }

                if (view === 'overview') {
                    content = UI.renderOverviewView(cognitiveToolkitData.framework_data.tools, cognitiveToolkitData.methodologies_data.methodologies);
                    render(content, targetView);
                    requestAnimationFrame(() => {
                        setupScrollControls('overview-scroll-container', '.workflow-container-wrapper');
                    });
                }

                if (view === 'network') initializeNetworkMapEvents();
                if (view === 'nodes') initializeNodeExplorerEvents();
                if (view === 'map') initializeVisualMapEvents();
                if (view === 'modalities') initializeModalityExplorerEvents();
                if (view === 'glossary-tool') initializeGlossaryToolEvents();
                if (view === 'welcome') applyStanceHighlight();
                if (view === 'pathways') initializePathwayExplorerEvents();
            });
            
            applySimpleMode(localStorage.getItem('cognitive-toolkit-simple-mode') === 'true');

        } catch (error) {
            console.error(`[FATAL] Error during lit-html render() for view '${view}':`, error);
            if (targetView) {
                targetView.innerHTML = `<h1>Render Error</h1><p>Could not render this view. Please check the console for the specific error message.</p><pre>${error.stack}</pre>`;
            }
        } finally {
            isRendering = false;
        }
    }
    
    function getLogData() {
        return cognitiveToolkitData.framework_data.tools.map(tool => {
            const promptItem = tool.pedagogicalPlaybook.find(item => item.title.includes("Reflection Prompt"));
            if (!promptItem) return null;
            const promptText = promptItem.content;
            const textareaId = `log-prompt-${tool.id}`;
            const savedAnswer = localStorage.getItem(textareaId) || 'No entry yet.';
            return { toolName: tool.name, prompt: promptText, answer: savedAnswer };
        }).filter(Boolean);
    }

    function exportLog() {
        let fullLog = `An Integrated Language for Inquiry and Creation Positionality Log\nExported: ${new Date().toLocaleString()}\n\n========================================\n\n`;
        getLogData().forEach(entry => {
            fullLog += `TOOL: ${entry.toolName}\n`;
            fullLog += `PROMPT: ${entry.prompt}\n\n`;
            fullLog += `RESPONSE:\n${entry.answer.replace(/<br>/g, '\n')}\n\n========================================\n\n`;
        });
        const blob = new Blob([fullLog], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CognitiveToolkit_Log.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function renderCognitiveModel(toolId) {
        const { render } = window.litHtml;
        const tool = cognitiveToolkitData.framework_data.tools.find(t => t.id === toolId);
        const container = document.getElementById('cognitive-model-content');
        if (!container) return;
        render(UI.renderCognitiveModel(tool), container);
    }

    function renderCynefinAnalysis(toolId) {
        const { render } = window.litHtml;
        const tool = cognitiveToolkitData.framework_data.tools.find(t => t.id === toolId);
        const container = document.getElementById('cynefin-analysis-content');
        if (!container) return;
        render(UI.renderCynefinAnalysis(tool), container);
    }
    
    function applyStance(stance) {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        const id = params.get('id');
        if (view === 'tool' && id) {
            renderView(view, id);
        } else {
            applyStanceHighlight();
        }
    }

    function applyStanceHighlight() {
        const learnCard = document.getElementById('welcome-choice-learn');
        const findCard = document.getElementById('welcome-choice-find');
        if (learnCard && findCard) {
            learnCard.classList.toggle('is-recommended', currentStance === 'learning');
            findCard.classList.toggle('is-recommended', currentStance === 'performance');
        }
    }

    function updateActiveSidebarLink(view, id) {
        document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
        const selector = id ? `.sidebar a[data-view="${view}"][data-id="${id}"]` : `.sidebar a[data-view="${view}"]:not([data-id])`;
        const activeLink = document.querySelector(selector);
        if (activeLink) activeLink.classList.add('active');
    }
    function updateMiniMap(view, id) {
        const container = document.getElementById('mini-map-container');
        container.querySelectorAll('.mini-map-segment').forEach(seg => seg.classList.remove('active-tool'));
        if (view === 'tool' && id) {
            const activeSegment = container.querySelector(`.mini-map-segment[data-id="${id}"]`);
            if (activeSegment) activeSegment.classList.add('active-tool');
        }
    }
    function updateBreadcrumbs(view, id) {
        const breadcrumbList = document.getElementById('breadcrumb-list');
        if (!breadcrumbList) return;
        let breadcrumbs = [{ label: 'Home', view: 'welcome' }];
        const viewLabels = {
            'welcome': 'Home', 'diagnostic': 'Diagnostic Navigator', 'tool': 'Tool', 'overview': 'Overview', 'map': 'Visual Map', 'network': 'Network Map',
            'nodes': 'Node Explorer', 'modalities': 'Modality Explorer', 'hub': 'Actionability Hub', 'log': 'Positionality Log',
            'synthesis-table': 'Grand Synthesis Table', 'rubrics': 'Rubrics', 'glossary': 'Glossary', 'glossary-tool': 'Dynamic Glossary', 'playbooks-reports': 'Playbooks & Reports',
            'genesis-project': 'Project Genesis Case Study','bibliography': 'Bibliography',
            'strategy': 'Strategic Blueprint', 'protocol': 'AI Command Protocol', 'about': 'About', 'community': 'Community & Contribution',
            'advanced-toolkits': 'Advanced Toolkits', 'pathways': 'Pathway Explorer', 'planner': 'Integrated Planner'
        };
        if (view !== 'welcome') {
            if (view === 'tool') {
                const tool = cognitiveToolkitData.framework_data.tools.find(t => t.id === id);
                breadcrumbs.push({ label: tool ? tool.name : 'Tool', view: view, id: id });
            } else {
                breadcrumbs.push({ label: viewLabels[view] || view, view: view });
            }
        }
        breadcrumbList.innerHTML = breadcrumbs.map((crumb, i) => {
            if (i === breadcrumbs.length - 1) {
                return `<li><span aria-current="page">${crumb.label}</span></li>`;
            }
            return `<li><a href="?view=${crumb.view}${crumb.id ? '&id=' + crumb.id : ''}" data-view="${crumb.view}" data-id="${crumb.id || ''}">${crumb.label}</a></li>`;
        }).join('');
    }
    function toggleAccordion(header) {
        const item = header.closest('.accordion-item');
        const content = item.querySelector('.accordion-content');
        const wasActive = item.classList.contains('active');
        item.classList.toggle('active', !wasActive);
        content.style.maxHeight = !wasActive ? content.scrollHeight + "px" : null;
    }
    
    function toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const isExpanded = sidebar.classList.toggle('open');
        document.getElementById('menu-toggle').setAttribute('aria-expanded', isExpanded);
    }
    
    function initializeAccessibilityToggles() {
        const restoreToggle = (checkboxId, storageKey, className, isSimpleMode = false) => {
            const checkbox = document.getElementById(checkboxId);
            if (!checkbox) return;
            const isEnabled = localStorage.getItem(storageKey) === 'true';
            checkbox.checked = isEnabled;
            if (isSimpleMode) {
                toggleSimpleMode(isEnabled);
            } else {
                toggleAccessibilityMode(className, isEnabled);
            }
        };
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        const isDarkInitially = savedTheme ? savedTheme === 'dark' : prefersDark;
        localStorage.setItem('cognitive-toolkit-dark-mode-active', String(isDarkInitially));
        restoreToggle('dark-mode-checkbox', 'cognitive-toolkit-dark-mode-active', 'dark-mode-active');
        restoreToggle('high-contrast-checkbox', 'cognitive-toolkit-high-contrast-mode', 'high-contrast-mode');
        restoreToggle('reader-mode-checkbox', 'cognitive-toolkit-reader-mode', 'reader-mode');
        restoreToggle('simple-mode-checkbox', 'cognitive-toolkit-simple-mode', 'simple-mode', true);
    }
    function toggleAccessibilityMode(modeClass, isEnabled) {
        document.body.classList.toggle(modeClass, isEnabled);
        localStorage.setItem('cognitive-toolkit-' + modeClass, isEnabled);
        if (modeClass === 'dark-mode-active') {
            localStorage.setItem('theme', isEnabled ? 'dark' : 'light');
        }
    }
    function toggleSimpleMode(isSimple) {
        localStorage.setItem('cognitive-toolkit-simple-mode', isSimple);
        applySimpleMode(isSimple);
    }
    function applySimpleMode(isSimple) {
        document.querySelectorAll('[data-jargon]').forEach(el => {
            el.textContent = isSimple ? el.dataset.simple : el.dataset.jargon;
        });
    }
    function initializeStanceSwitch() {
        document.querySelectorAll('.stance-switch button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.stance === currentStance);
        });
        document.querySelector('.stance-switch').addEventListener('click', e => {
            const button = e.target.closest('button');
            if (button) {
                currentStance = button.dataset.stance;
                localStorage.setItem('cognitive-toolkit-stance', currentStance);
                document.querySelectorAll('.stance-switch button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                applyStance(currentStance);
            }
        });
    }

    function initializeNativePlanner() {
        const domainData = {
            general: { name: 'General / Pluralist', icon: '🌐' },
            science_and_engineering: { name: 'Science & Engineering', icon: '🔬' },
            humanities_and_ss: { name: 'Humanities & Social Sciences', icon: '🏛️' },
            arts_and_design: { name: 'Arts & Design', icon: '🎨' },
            business_and_agile: { name: 'Business & Agile', icon: '🚀' },
            culture_and_ethics: { name: 'Culture & Ethics', icon: '🌏' },
            pedagogy_and_facilitation: { name: 'Pedagogy & Facilitation', icon: '🧑‍🏫' }
        };

        const domainSwitcherContainer = document.getElementById('domain-switcher-container');
        if (domainSwitcherContainer) {
            const optionsHTML = Object.entries(domainData).map(([key, value]) => 
                `<option value="${key}">${value.icon} ${value.name}</option>`
            ).join('');
            
            domainSwitcherContainer.innerHTML = `
                <label for="domain-select">Active Domain:</label>
                <select id="domain-select">${optionsHTML}</select>
            `;
            
            const domainSelect = document.getElementById('domain-select');
            const savedDomain = localStorage.getItem('planner-currentDomain') || 'general';
            useStore.setState({ currentDomain: savedDomain });
            domainSelect.value = savedDomain;
            
            domainSelect.addEventListener('change', (e) => {
                const newDomain = e.target.value;
                localStorage.setItem('planner-currentDomain', newDomain);
                useStore.setState({ currentDomain: newDomain });
            });
        }

        let debounceTimer;
        const statusEl = document.getElementById('persistence-status');
        const textareas = document.querySelectorAll('.planner-textarea');
        textareas.forEach(textarea => {
            const savedValue = localStorage.getItem(textarea.id);
            if (savedValue) {
                textarea.value = savedValue;
            }
            textarea.addEventListener('input', () => {
                if (statusEl) {
                    statusEl.textContent = 'Saving...';
                    statusEl.style.opacity = '1';
                }
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    localStorage.setItem(textarea.id, textarea.value);
                    if (statusEl) {
                        statusEl.textContent = 'Saved.';
                        setTimeout(() => { statusEl.style.opacity = '0'; }, 1500);
                    }
                }, 500);
            });
        });

        useStore.subscribe(
            (state) => state.currentDomain,
            (currentDomain) => {
                const container = document.getElementById('planner-view');
                if (container) {
                    for (const key in domainData) {
                        container.classList.remove(`domain-active-${key}`);
                    }
                    container.classList.add(`domain-active-${currentDomain}`);
                }
            }
        );
        document.getElementById('planner-view').classList.add(`domain-active-${useStore.getState().currentDomain}`);
    }

    function generatePlannerPrompt() {
        const currentDomain = useStore.getState().currentDomain;
        const domainData = cognitiveToolkitData.planner_content.parts.tools[0].domains.find(d => d.domainId === currentDomain);
        const domainName = domainData ? domainData.name : currentDomain;

        let prompt = `# PROJECT BRIEF & AI PROMPT\n\n**Active Domain Context: ${domainName}**\n\n`;

        cognitiveToolkitData.planner_content.parts.tools.forEach(tool => {
            prompt += `### ${tool.title}\n`;
            const generalDomain = tool.domains.find(d => d.domainId === 'general');
            const specificDomain = tool.domains.find(d => d.domainId === currentDomain);

            const fieldsToUse = specificDomain ? specificDomain.fields : (generalDomain ? generalDomain.fields : []);

            fieldsToUse.forEach(field => {
                const el = document.getElementById(field.id);
                const value = el && el.value.trim() ? el.value.trim() : 'Not specified.';
                prompt += `- **${field.label}** ${value}\n`;
            });
            prompt += '\n';
        });

        prompt += `---
## AI TASK REQUEST

Based on the comprehensive plan above, please [**INSERT YOUR SPECIFIC REQUEST HERE**]. 

For example:
- "Critique the alignment between the Guiding Question and the Definition of Success."
- "Brainstorm three more creative options for Tool 3 based on the generated possibilities."
- "Help me flesh out the Work Breakdown Structure in Tool 5 for the chosen decision."
- "Act as a 'red team' and identify two more potential challenges for the plan in Tool 2."`;
        
        const promptTextarea = document.getElementById('generated-prompt');
        if (promptTextarea) {
            promptTextarea.value = prompt.trim();
            promptTextarea.readOnly = false;
        }
    }

    function initializeNodeExplorerEvents() {
        nodeFrameworkData = cognitiveToolkitData;
        const searchInput = document.getElementById('node-search');
        const pathwaySelect = document.getElementById('pathway-select');
        const container = document.querySelector('#nodes-view .node-explorer-container');

        if (searchInput) searchInput.addEventListener('input', filterNodes);
        if (pathwaySelect) pathwaySelect.addEventListener('change', highlightPathway);
        if (container) container.addEventListener('click', handleNodeExplorerEvents);

        setupScrollControls('node-scroll-container', '.node-map-wrapper');
    }
    function handleNodeExplorerEvents(e) {
        const card = e.target.closest('.node-card');
        if (card) {
            document.querySelectorAll('.node-card.is-active').forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active');
            displayNodeDetails(card.dataset.nodeId);
            return;
        }
        const themeButton = e.target.closest('.theme-filter-btn');
        if (themeButton) {
            document.querySelectorAll('.theme-filter-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });
            themeButton.classList.add('active');
            themeButton.setAttribute('aria-checked', 'true');
            filterNodes();
            return;
        }
    }
    function displayNodeDetails(nodeId) {
        const node = nodeFrameworkData.framework_data.frameworkNodes.nodes.find(n => n.id === nodeId);
        const pane = document.getElementById('node-details-pane');
        if (!node || !pane) return;
        const theme = nodeFrameworkData.framework_data.frameworkNodes.themes[node.theme];
        const inputsHTML = node.inputs.map(i => `<li>${i}</li>`).join('');
        const outputsHTML = node.outputs.map(o => `<li>${o}</li>`).join('');
        const tagsHTML = node.tags.map(t => `<span>${t}</span>`).join('');
        pane.innerHTML = `<h3><i class="fas ${theme.icon}" style="color: ${theme.color};"></i> ${node.name} <code class="uid-tag">${node.uid}</code></h3>
            <p>${node.description}</p>
            <h4>Parent Tool</h4><ul><li>${nodeFrameworkData.framework_data.tools.find(t => t.id === node.parentTool).name}</li></ul>
            <h4>Inputs</h4><ul>${inputsHTML}</ul>
            <h4>Outputs</h4><ul>${outputsHTML}</ul>
            <h4>Tags</h4><div class="tags">${tagsHTML}</div>`;
    }
    function filterNodes() {
        const searchInput = document.getElementById('node-search');
        if (!searchInput) return;
        const searchTerm = searchInput.value.toLowerCase();
        const activeTheme = document.querySelector('.theme-filter-btn.active')?.dataset.theme || 'all';
        document.querySelectorAll('.node-card').forEach(card => {
            const matchesSearch = card.textContent.toLowerCase().includes(searchTerm);
            const matchesTheme = activeTheme === 'all' || card.dataset.nodeTheme === activeTheme;
            card.classList.toggle('is-hidden', !(matchesSearch && matchesTheme));
        });
    }
    function highlightPathway() {
        const select = document.getElementById('pathway-select');
        if (!select) return;
        const pathwayKey = select.value;
        const { pathways } = nodeFrameworkData.framework_data.frameworkNodes;
        document.querySelectorAll('.node-card').forEach(c => c.classList.remove('is-path-member', 'is-hidden'));
        const svg = document.getElementById('pathway-lines-svg');
        const map = document.querySelector('.node-map');
        if (!pathwayKey || !svg || !map) {
            if (svg) { svg.innerHTML = ''; svg.classList.remove('visible'); }
            return;
        }
        const pathway = pathways[pathwayKey];
        const pathNodeIds = pathway.nodes;
        document.querySelectorAll('.node-card').forEach(card => {
            const isMember = pathNodeIds.includes(card.dataset.nodeId);
            card.classList.toggle('is-path-member', isMember);
            card.classList.toggle('is-hidden', !isMember);
        });
        Visuals.drawPathwayLines(svg, map, pathNodeIds, pathway.color || '#3498db', true);
    }

    function initializeVisualMapEvents() {
        mapFrameworkData = cognitiveToolkitData;
        const pathwaySelect = document.getElementById('map-pathway-select');
        if (pathwaySelect) {
            pathwaySelect.addEventListener('change', highlightMapPathway);
        }

        const mapContainer = document.querySelector('#map-view .map-grid');
        if (mapContainer) {
            mapContainer.addEventListener('click', (e) => {
                const item = e.target.closest('.node-item');
                if (item) {
                    const nodeId = item.dataset.nodeId;
                    const nodeData = mapFrameworkData.framework_data.frameworkNodes.nodes.find(n => n.id === nodeId);
                    if (nodeData) {
                        showNodeModal(nodeData);
                    }
                }
            });
        }

        setupScrollControls('map-scroll-container', '.map-grid-wrapper');
    }
    function highlightMapPathway() {
        const select = document.getElementById('map-pathway-select');
        if (!select) return;
        const pathwayKey = select.value;
        const { pathways } = mapFrameworkData.framework_data.frameworkNodes;
        const svg = document.getElementById('map-pathway-svg');
        const map = document.querySelector('.map-grid');
        document.querySelectorAll('.node-item').forEach(item => item.classList.remove('is-hidden'));
        if (!pathwayKey || !svg || !map) {
            if (svg) { svg.innerHTML = ''; svg.classList.remove('visible'); }
            return;
        }
        const pathway = pathways[pathwayKey];
        const pathNodeIds = pathway.nodes;
        document.querySelectorAll('.node-item').forEach(item => {
            item.classList.toggle('is-hidden', !pathNodeIds.includes(item.dataset.nodeId));
        });
        Visuals.drawPathwayLines(svg, map, pathNodeIds, pathway.color || '#e67e22', false);
    }

    function initializeModalityExplorerEvents() {
        modalitiesFrameworkData = cognitiveToolkitData.framework_data.dls_modalities_framework;
        const view = document.getElementById('modalities-view');
        if (view) {
            view.addEventListener('click', handleModalityExplorerEvents);
        }
    }
    function handleModalityExplorerEvents(e) {
        const card = e.target.closest('.modality-card');
        if (card) {
            const modalityId = card.dataset.modalityId;
            document.querySelectorAll('.modality-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            displayModalityDetails(modalityId);
        }
    }
    function displayModalityDetails(modalityId) {
        const modality = modalitiesFrameworkData.modalities.find(m => m.id === modalityId);
        const pane = document.getElementById('modality-details-pane');
        if (!modality || !pane) return;
        const depsToList = (arr, title) => {
            if (!arr || arr.length === 0) return '';
            return `<h4>${title}</h4><ul class="dependency-list">${arr.map(dep => `<li><strong>${modalitiesFrameworkData.modalities.find(m => m.id === dep.modality_id).name}</strong> <span class="strength strength-${dep.strength}">${dep.strength}</span><p>${dep.reasoning}</p></li>`).join('')}</ul>`;
        };
        pane.innerHTML = `<h3>${modality.name}</h3><p>${parseMarkdown(modality.definition)}</p>
            <h4>Neuroscientific Grounding</h4><div class="neuro-grounding">${parseMarkdown(modality.neuroscientific_grounding)}</div>
            ${depsToList(modality.prerequisites, 'Prerequisites')}
            ${depsToList(modality.dependents, 'Dependents')}`;
    }

    function initializeGlossaryToolEvents() {
        console.log("[Glossary] Initializing...");
        
        // 1. Load Data safely
        if (typeof cognitiveToolkitData !== 'undefined' && cognitiveToolkitData.glossary_tool_data) {
            glossaryToolData = cognitiveToolkitData.glossary_tool_data;
            
            // Safety check for array
            if (!Array.isArray(glossaryToolData)) {
                console.warn("[Glossary] Data is not an array. Attempting to unwrap...");
                // Try to find an array property if it was wrapped
                if (glossaryToolData.terms && Array.isArray(glossaryToolData.terms)) {
                    glossaryToolData = glossaryToolData.terms;
                } else if (glossaryToolData.data && Array.isArray(glossaryToolData.data)) {
                    glossaryToolData = glossaryToolData.data;
                } else {
                    // Fallback: check if it's the metadata wrapper issue
                    const keys = Object.keys(glossaryToolData).filter(k => k !== '_metadata');
                    if (keys.length > 0 && Array.isArray(glossaryToolData[keys[0]])) {
                         glossaryToolData = glossaryToolData[keys[0]];
                    }
                }
            }
            
            if (Array.isArray(glossaryToolData)) {
                console.log(`[Glossary] Loaded ${glossaryToolData.length} terms.`);
            } else {
                console.error("[Glossary] Data structure invalid. Expected Array, got:", typeof glossaryToolData);
                glossaryToolData = []; // Prevent crash
            }
        } else {
            console.error("[Glossary] Data missing. Check glossary_data.json and dataLoader.js");
            const container = document.getElementById('glossary-results');
            if (container) container.innerHTML = '<p class="error-message">Error: Glossary data could not be loaded.</p>';
            return;
        }

        // 2. Attach Listeners
        const searchInput = document.getElementById('glossary-search-input');
        if (searchInput) {
            // Remove old listeners to prevent duplicates (cloning trick)
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            
            newInput.addEventListener('input', filterGlossary);
            
            // 3. Trigger initial render
            // Pass the input element explicitly to avoid DOM lookup race conditions
            filterGlossary({ target: newInput }); 
        } else {
            console.error("[Glossary] Search input element not found in DOM.");
        }
    }

    function filterGlossary(e) {
        // Handle both event objects and direct calls
        const inputVal = e && e.target ? e.target.value : '';
        const searchTerm = inputVal.toLowerCase();
        
        const resultsContainer = document.getElementById('glossary-results');
        
        if (!resultsContainer || !glossaryToolData) return;

        const filteredData = glossaryToolData.filter(entry => {
            // Guard clause for malformed data
            if (!entry || !entry.term) return false;
            return entry.term.toLowerCase().includes(searchTerm);
        });

        if (filteredData.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-state">No matching terms found.</p>';
            return;
        }

        resultsContainer.innerHTML = filteredData.map(entry => {
            const translationsHTML = (entry.translations || []).map(t => 
                `<li><span class="domain-tag">${t.domain}:</span> <span class="translation-text">${t.expression}</span></li>`
            ).join('');

            return `
                <div class="glossary-entry card">
                    <div class="glossary-header">
                        <h3>${entry.term}</h3>
                        <span class="tool-badge">${entry.parent_tool || 'General'}</span>
                    </div>
                    <div class="glossary-body">
                        <p class="principle"><strong>Universal Principle:</strong> ${entry.general_principle}</p>
                        <div class="translations-container">
                            <h4>Domain Expressions:</h4>
                            <ul class="translation-list">${translationsHTML}</ul>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
    
    function initializeNetworkMapEvents() {
        const gridContainer = document.getElementById('network-grid');
        const svg = document.getElementById('connection-svg');
        
        if (!gridContainer || !svg) {
            console.error("Network Map initialization failed: Core container or SVG element not found.");
            return;
        }

        const networkConnections = {
            "N03": [
                { target: "tool1", type: "primary", reason: "Defining a problem requires identifying the entities affected by it." },
                { target: "tool2", type: "secondary", reason: "The map identifies constraints and approval gates for the plan." },
                { target: "tool8", type: "secondary", reason: "The map identifies the audience for final validation." },
                { target: "tool4", type: "missing-secondary", reason: "Decision-making requires assessing impact on specific stakeholders." },
                { target: "tool9", type: "tertiary", reason: "Long-term maintenance requires identifying future owners." }
            ],
            "N11": [
                { target: "tool2", type: "primary", reason: "Analyzing a plan before execution to identify failure modes." },
                { target: "tool4", type: "secondary", reason: "Comparing options to determine which has fewer failure modes." },
                { target: "tool5", type: "missing-secondary", reason: "Identifying logical inconsistencies in the structure before building." },
                { target: "tool10", type: "tertiary", reason: "Anticipating process failures like resource depletion." }
            ],
            "N34": [
                { target: "tool7", type: "primary", reason: "Receiving feedback on a work-in-progress to guide improvement." },
                { target: "tool8", type: "secondary", reason: "Simulating the external audience to test against standards." },
                { target: "tool3", type: "missing-secondary", reason: "Selecting the most viable concepts after generation." },
                { target: "tool5", type: "tertiary", reason: "Critiquing the plan allows for structural corrections early." }
            ],
            "N44": [
                { target: "tool10", type: "primary", reason: "Analyzing the workflow to improve system efficiency." },
                { target: "tool7", type: "secondary", reason: "Addressing process failures within a specific work cycle." },
                { target: "tool9", type: "secondary", reason: "Extracting general principles at the conclusion of a project." },
                { target: "tool6", type: "missing-secondary", reason: "Adjusting immediate tactics during execution." },
                { target: "tool2", type: "tertiary", reason: "Informing the planning of a new project to prevent recurring errors." }
            ],
            "N65": [
                { target: "tool4", type: "primary", reason: "Establishing shared agreement on complex decisions." },
                { target: "tool3", type: "secondary", reason: "Facilitating the emergence of ideas through collective interaction." },
                { target: "tool8", type: "secondary", reason: "Presenting work for formal acceptance or approval." },
                { target: "tool1", type: "missing-secondary", reason: "Reaching consensus on the definition of the problem." },
                { target: "tool9", type: "tertiary", reason: "Agreeing on the final narrative or lessons learned." }
            ],
            "N74": [
                { target: "tool10", type: "primary", reason: "Monitoring performance to maintain standards." },
                { target: "tool1", type: "secondary", reason: "Analyzing biases to ensure the inquiry is framed accurately." },
                { target: "tool9", type: "secondary", reason: "Identifying individual learning outcomes." },
                { target: "tool6", type: "missing-secondary", reason: "Analyzing actions during execution to adjust technique." },
                { target: "tool7", type: "tertiary", reason: "Separating personal identity from the work product." }
            ],
            "N81": [
                { target: "tool7", type: "primary", reason: "Managing internal reactions to enable objective analysis." },
                { target: "tool1", type: "secondary", reason: "Identifying internal drivers to ensure alignment." },
                { target: "tool10", type: "secondary", reason: "Diagnosing contribution to team dynamics." },
                { target: "tool4", type: "missing-secondary", reason: "Identifying cognitive biases before making a decision." },
                { target: "tool8", type: "tertiary", reason: "Regulating internal states before high-stakes presentation." }
            ],
            "N95": [
                { target: "tool7", type: "primary", reason: "Defining the scope of feedback to ensure relevance." },
                { target: "tool8", type: "secondary", reason: "Establishing context and criteria for evaluation." },
                { target: "tool3", type: "missing-secondary", reason: "Defining constraints to enable divergent thinking." },
                { target: "tool1", type: "tertiary", reason: "Framing the central question for the project." }
            ],
            "N98": [
                { target: "tool5", type: "primary", reason: "Ensuring specifications are understood before work begins." },
                { target: "tool6", type: "secondary", reason: "Marking the commencement of the execution phase." },
                { target: "tool4", type: "missing-secondary", reason: "Communicating the decision to the execution team." },
                { target: "tool9", type: "tertiary", reason: "Transferring the completed project to maintenance." }
            ],
            "N100": [
                { target: "tool10", type: "primary", reason: "Assessing the state of the process when progress is impeded." },
                { target: "tool1", type: "missing-secondary", reason: "Categorizing the problem type to determine strategy." },
                { target: "tool7", type: "tertiary", reason: "Determining the cause of a failure." }
            ]
        };

        let lockedMethodId = null;

        const styles = getComputedStyle(document.documentElement);
        const primaryLineColor = styles.getPropertyValue('--primary-line-color').trim();
        const secondaryLineColor = styles.getPropertyValue('--secondary-line-color').trim();
        const tertiaryLineColor = "#95a5a6"; 

        const methodCards = document.querySelectorAll('.method-card');
        let positions = {};

        function calculatePositions() {
            positions = {};
            const allCards = document.querySelectorAll('.tool-card, .method-card');
            allCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const containerRect = gridContainer.getBoundingClientRect();
                positions[card.id] = {
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top + rect.height / 2,
                    top: rect.top - containerRect.top,
                    bottom: rect.top - containerRect.top + rect.height,
                };
            });
        }

        function drawLine(fromId, toId, type) {
            const fromPos = positions[fromId];
            const toPos = positions[toId];
            if (!fromPos || !toPos) return;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromPos.x);
            line.setAttribute('y1', fromPos.bottom);
            line.setAttribute('x2', toPos.x);
            line.setAttribute('y2', toPos.top);
            
            if (type === 'primary') {
                line.setAttribute('stroke', primaryLineColor);
                line.setAttribute('stroke-width', '4');
            } else if (type === 'secondary' || type === 'missing-secondary') {
                line.setAttribute('stroke', secondaryLineColor);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-dasharray', '6, 4'); 
            } else if (type === 'tertiary') {
                line.setAttribute('stroke', tertiaryLineColor);
                line.setAttribute('stroke-width', '1');
                line.setAttribute('stroke-dasharray', '2, 4'); 
                line.setAttribute('opacity', '0.6');
            }

            const length = Math.hypot(toPos.x - fromPos.x, toPos.top - fromPos.bottom);
            line.setAttribute('stroke-dasharray', length); 
            line.setAttribute('stroke-dashoffset', length);
            
            if (type !== 'primary') {
                setTimeout(() => {
                    if (type === 'secondary' || type === 'missing-secondary') line.setAttribute('stroke-dasharray', '6, 4');
                    if (type === 'tertiary') line.setAttribute('stroke-dasharray', '2, 4');
                }, 300);
            }

            svg.appendChild(line);
            requestAnimationFrame(() => {
                line.setAttribute('stroke-dashoffset', 0);
            });
        }

        function highlightConnections(methodId) {
            resetView();
            
            const methodEl = document.getElementById(methodId);
            if (methodEl) methodEl.classList.add('highlighted');
            
            const connections = networkConnections[methodId] || [];
            
            connections.forEach(conn => {
                const toolEl = document.getElementById(conn.target);
                if (toolEl) {
                    toolEl.classList.add('highlighted');
                    drawLine(methodId, conn.target, conn.type);
                }
            });
        }

        function resetView() {
            svg.innerHTML = '';
            const highlighted = document.querySelectorAll('.highlighted');
            highlighted.forEach(el => el.classList.remove('highlighted'));
        }

        const resizeObserver = new ResizeObserver(() => {
            calculatePositions();
            if (lockedMethodId) {
                highlightConnections(lockedMethodId);
            }
        });
        resizeObserver.observe(gridContainer);

        setTimeout(calculatePositions, 100); 

        methodCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!lockedMethodId) {
                    highlightConnections(card.id);
                }
            });

            card.addEventListener('click', (e) => {
                if (e.target.closest('.method-info-btn')) return;
                e.stopPropagation(); 
                
                if (lockedMethodId === card.id) {
                    lockedMethodId = null;
                    resetView();
                } else {
                    lockedMethodId = card.id;
                    highlightConnections(card.id);
                }
            });
        });

        gridContainer.addEventListener('click', (e) => {
            const infoBtn = e.target.closest('.method-info-btn');
            if (infoBtn) {
                e.stopPropagation();
                const nodeId = infoBtn.dataset.nodeUid;
                const nodeData = cognitiveToolkitData.framework_data.frameworkNodes.nodes.find(n => n.uid === nodeId);
                
                if (nodeData) {
                    showNodeModal(nodeData);
                    
                    const connections = networkConnections[nodeId];
                    if (connections) {
                        const modalBody = document.querySelector('.node-modal-body');
                        
                        const reasoningHTML = `
                            <div class="network-reasoning-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border);">
                                <h4>Network Connections & Reasoning</h4>
                                <ul class="reasoning-list">
                                    ${connections.map(c => {
                                        let typeLabel = '';
                                        let typeClass = '';
                                        if(c.type === 'primary') { typeLabel = 'Primary'; typeClass = 'tag-primary'; }
                                        else if(c.type === 'secondary') { typeLabel = 'Secondary'; typeClass = 'tag-secondary'; }
                                        else if(c.type === 'missing-secondary') { typeLabel = 'Secondary'; typeClass = 'tag-secondary'; }
                                        else { typeLabel = 'Tertiary'; typeClass = 'tag-tertiary'; }
                                        
                                        const tool = cognitiveToolkitData.framework_data.tools.find(t => t.id === c.target);
                                        const toolName = tool ? tool.name : c.target;

                                        return `
                                            <li style="margin-bottom: 10px; background: var(--color-background); padding: 10px; border-radius: 4px;">
                                                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                                    <strong>${toolName}</strong>
                                                    <span class="connection-tag ${typeClass}">${typeLabel}</span>
                                                </div>
                                                <div style="font-size: 0.9em; color: var(--color-text-primary);">${c.reason}</div>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </div>
                        `;
                        
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = reasoningHTML;
                        modalBody.appendChild(tempDiv);
                    }
                }
                return;
            }
            
            const listLink = e.target.closest('.network-node-link');
            if (listLink) {
                e.stopPropagation();
                const nodeId = listLink.dataset.nodeId;
                const nodeData = cognitiveToolkitData.framework_data.frameworkNodes.nodes.find(n => n.id === nodeId);
                if (nodeData) {
                    showNodeModal(nodeData);
                }
                return;
            }
        });

        gridContainer.addEventListener('mouseleave', () => {
            if (!lockedMethodId) {
                resetView();
            }
        });

        document.addEventListener('click', (e) => {
            if (lockedMethodId && !e.target.closest('.method-card') && !e.target.closest('.node-modal')) {
                lockedMethodId = null;
                resetView();
            }
        });
    }

    function initializePathwayExplorerEvents() {
        const searchInput = document.getElementById('pathway-search');
        const domainFilterGroup = document.getElementById('domain-filter-group');
        const typeFilter = document.getElementById('type-filter');
        const toolFilter = document.getElementById('tool-filter');
        const matrix = document.getElementById('pathway-matrix');
        const domainLabel = document.getElementById('selected-domain-name');
    
        if (!searchInput || !domainFilterGroup || !typeFilter || !toolFilter || !matrix) {
            console.warn("Pathway Explorer controls not found. Skipping event listener setup.");
            return;
        }
    
        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase();
            const activeDomain = domainFilterGroup.querySelector('.filter-btn.active')?.dataset.domain || 'all';
            const activeType = typeFilter.value;
    
            document.querySelectorAll('#pathway-matrix .accordion-item').forEach(card => {
                const cardDomain = card.dataset.domain || '';
                const cardType = card.dataset.type || '';
                const cardText = (card.textContent || '').toLowerCase();
    
                const matchesSearch = cardText.includes(searchTerm);
                const matchesDomain = activeDomain === 'all' || cardDomain === activeDomain;
                const matchesType = activeType === 'all' || cardType === activeType;
    
                card.style.display = (matchesSearch && matchesDomain && matchesType) ? '' : 'none';
            });
        }
        function handleToolFilter() {
            const selectedTool = toolFilter.value;
            
            document.querySelectorAll('.tool-column').forEach(col => {
                col.style.display = (selectedTool === 'all' || col.id === selectedTool) ? '' : 'none';
            });
        }

        searchInput.addEventListener('input', applyFilters);
        typeFilter.addEventListener('change', applyFilters);
        toolFilter.addEventListener('change', handleToolFilter);

        domainFilterGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (btn) {
                domainFilterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (domainLabel) {
                    domainLabel.textContent = btn.dataset.domain === 'all' ? 'All Domains' : btn.title;
                }
                applyFilters();
            }
        });

        matrix.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (header) {
                const item = header.parentElement;
                const content = item.querySelector('.accordion-content');
                const wasActive = item.classList.contains('active');
                
                item.closest('.pathway-matrix').querySelectorAll('.accordion-item.active').forEach(openItem => {
                    if (openItem !== item) {
                        openItem.classList.remove('active');
                        const openContent = openItem.querySelector('.accordion-content');
                        if(openContent) openContent.style.maxHeight = null;
                    }
                });

                item.classList.toggle('active', !wasActive);
                if (content) {
                    content.style.maxHeight = !wasActive ? content.scrollHeight + "px" : null;
                }
            }
        });

        applyFilters();
        handleToolFilter();

        const params = new URLSearchParams(window.location.search);
        const expandId = params.get('expand');

        if (expandId) {
            const targetItem = document.querySelector(`.accordion-item[data-id="${expandId}"]`);
            
            if (targetItem) {
                targetItem.classList.add('active');
                const content = targetItem.querySelector('.accordion-content');
                if (content) {
                    content.style.maxHeight = content.scrollHeight + "px";
                }

                setTimeout(() => {
                    targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetItem.style.transition = 'box-shadow 0.5s ease';
                    targetItem.style.boxShadow = '0 0 0 4px var(--color-highlight)';
                    setTimeout(() => {
                        targetItem.style.boxShadow = '';
                    }, 2000);
                }, 100);
            }
        }

        setupScrollControls('pathway-scroll-container', '.pathway-matrix-wrapper');
    }

    init();
});