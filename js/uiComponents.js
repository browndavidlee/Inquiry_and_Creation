// js/uiComponents.js

import { html } from 'https://cdn.jsdelivr.net/npm/lit-html@3.1.2/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3.1.2/directives/unsafe-html.js';

// Helper function to safely parse markdown content
function parseMarkdown(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return '';
    }
    return window.marked ? window.marked.parse(text, { breaks: true }) : text;
}

const escapeAttr = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// --- MODALITY CONFIGURATION ---
const modalityConfig = [
    { id: 'visual', name: 'Visual', fullName: 'Visual', group: 'Sensory', color: '#63b3ed' },
    { id: 'auditory', name: 'Auditory', fullName: 'Auditory', group: 'Sensory', color: '#4299e1' },
    { id: 'tactile', name: 'Tactile', fullName: 'Tactile', group: 'Sensory', color: '#3182ce' },
    { id: 'proprioceptive', name: 'Proprio', fullName: 'Proprioceptive', group: 'Embodied', color: '#68d391' },
    { id: 'interoceptive', name: 'Intero', fullName: 'Interoceptive', group: 'Embodied', color: '#48bb78' },
    { id: 'kinesthetic', name: 'Kinest', fullName: 'Kinesthetic', group: 'Embodied', color: '#38a169' },
    { id: 'verbal', name: 'Verbal', fullName: 'Verbal', group: 'Symbolic', color: '#f6ad55' },
    { id: 'numerical', name: 'Numeric', fullName: 'Numerical', group: 'Symbolic', color: '#ed8936' },
    { id: 'spatial', name: 'Spatial', fullName: 'Spatial', group: 'Symbolic', color: '#dd6b20' },
    { id: 'logical', name: 'Logical', fullName: 'Logical', group: 'Cognitive', color: '#fc8181' },
    { id: 'associative', name: 'Assoc', fullName: 'Associative', group: 'Cognitive', color: '#f56565' },
    { id: 'emotional', name: 'Emotion', fullName: 'Emotional', group: 'Cognitive', color: '#e53e3e' },
    { id: 'social', name: 'Social', fullName: 'Social', group: 'Cognitive', color: '#c53030' },
    { id: 'creative', name: 'Creative', fullName: 'Creative', group: 'Meta', color: '#b794f4' },
    { id: 'metacognitive', name: 'Meta', fullName: 'Metacognitive', group: 'Meta', color: '#9f7aea' }
];

const modalityIconMap = {
    visual: { icon: 'fa-eye', groupClass: 'sensory-icon' },
    auditory: { icon: 'fa-volume-up', groupClass: 'sensory-icon' },
    tactile: { icon: 'fa-hand-paper', groupClass: 'sensory-icon' },
    proprioceptive: { icon: 'fa-street-view', groupClass: 'embodied-icon' },
    interoceptive: { icon: 'fa-heartbeat', groupClass: 'embodied-icon' },
    kinesthetic: { icon: 'fa-running', groupClass: 'embodied-icon' },
    verbal: { icon: 'fa-font', groupClass: 'symbolic-icon' },
    numerical: { icon: 'fa-calculator', groupClass: 'symbolic-icon' },
    spatial: { icon: 'fa-draw-polygon', groupClass: 'symbolic-icon' },
    logical: { icon: 'fa-sitemap', groupClass: 'cognitive-icon' },
    associative: { icon: 'fa-random', groupClass: 'cognitive-icon' },
    emotional: { icon: 'fa-theater-masks', groupClass: 'cognitive-icon' },
    social: { icon: 'fa-users', groupClass: 'cognitive-icon' },
    creative: { icon: 'fa-lightbulb', groupClass: 'meta-icon' },
    metacognitive: { icon: 'fa-cogs', groupClass: 'meta-icon' }
};

// --- DOMAIN MAPPING HELPER ---
const domainKeyMap = {
    "Science & Eng.": "science_and_engineering",
    "Humanities & SS.": "humanities_and_ss",
    "Arts & Design": "arts_and_design",
    "Business & Agile": "business_and_agile",
    "Integrated Knowledge & Ethics": "integrated_knowledge_and_ethics",
    "Pedagogy & Facil.": "pedagogy_and_facil"
};

const fallbackKeys = {
    "integrated_knowledge_and_ethics": "wisdom_and_ethics"
};

// --- GLOBAL CHART CONTROLLER ---
window.updateEqualizer = function(toolId, domain) {
    const stage = document.getElementById(`chart-stage-${toolId}`);
    if (!stage) return;
    
    if (stage.dataset.modalityJson) {
        try {
            const allData = JSON.parse(stage.dataset.modalityJson);
            const domainScores = allData[domain] || allData['General / Pluralist'] || [];
            
            const allBars = stage.querySelectorAll('.bar');
            allBars.forEach(bar => bar.style.height = '0%');

            if (domainScores.length > 0) {
                domainScores.forEach((score, index) => {
                    const bar = document.getElementById(`bar-${toolId}-${index}`);
                    const tooltip = document.getElementById(`tooltip-${toolId}-${index}`);
                    if (bar) {
                        requestAnimationFrame(() => {
                            bar.style.height = `${(score / 5) * 100}%`;
                        });
                    }
                    if (tooltip) tooltip.innerText = score;
                });
            }
        } catch (e) {
            console.error("Error updating equalizer:", e);
        }
    }

    const pills = document.querySelectorAll(`#domain-pills-${toolId} .domain-pill`);
    pills.forEach(p => {
        p.classList.toggle('active', p.dataset.domain === domain);
    });

    const insightContainer = document.getElementById(`insight-content-${toolId}`);
    if (insightContainer && stage.dataset.insightsJson) {
        try {
            const insights = JSON.parse(stage.dataset.insightsJson);
            const generalAnalysis = stage.dataset.generalAnalysis || "Select a domain.";

            let primaryKey = domainKeyMap[domain];
            let secondaryKey = fallbackKeys[primaryKey];
            let rawText = insights[primaryKey] || insights[secondaryKey] || generalAnalysis;
            
            if (!rawText) rawText = "Insight not available for this domain.";

            insightContainer.innerHTML = window.marked ? window.marked.parse(rawText) : rawText;
        } catch (e) {
            console.error("Error updating insights:", e);
        }
    }
};

function parseModalityTable(markdownString) {
    const data = {};
    let generalAnalysis = "Select a domain to see the cognitive signature.";

    if (!markdownString) return { data, generalAnalysis };

    try {
        const parts = markdownString.split(/####\s*(Deeper Analysis|Insight|Insights)/i);
        const tablePart = parts[0];
        
        if (parts.length > 2) {
            generalAnalysis = "#### " + parts[1] + parts[2]; 
        }

        const lines = tablePart.split(/\r?\n/);
        
        lines.forEach(line => {
            if (line.includes('|') && !line.includes('---')) {
                const cols = line.split('|').map(c => c.trim()).filter(c => c !== "");
                if (cols.length > 2) {
                    const domainName = cols[0].replace(/\*\*/g, '').trim();
                    const scores = cols.slice(1).map(val => {
                        const num = parseFloat(val);
                        return isNaN(num) ? 0 : num;
                    });
                    if (scores.length > 0 && domainName.toLowerCase() !== "domain") {
                        data[domainName] = scores;
                    }
                }
            }
        });
    } catch (e) {
        console.error("Error parsing modality table:", e);
    }

    return { data, generalAnalysis };
}

const renderPersonaSwitch = (currentPersona) => html`
    <div class="persona-switch">
        <button data-persona="practitioner" class="${currentPersona === 'practitioner' ? 'active' : ''}" title="View as the person doing the work">Practitioner</button>
        <button data-persona="facilitator" class="${currentPersona === 'facilitator' ? 'active' : ''}" title="View as the person guiding the work">Facilitator</button>
    </div>
`;

const renderActionCard = ({ href, view, id, icon, title, description }) => {
    const linkHref = href || `?view=${view}${id ? '&id=' + id : ''}`;
    const dataAttrs = `data-view="${view}" ${id ? `data-id="${id}"` : ''}`;
    return html`<a href="${linkHref}" ${dataAttrs} class="welcome-action-card">
        <i class="fas ${icon} resource-icon"></i>
        <h4>${title}</h4>
        <p>${description}</p>
    </a>`;
};

const createCollapsibleNodeCard = (node) => {
    return html`<div class="accordion-item genesis-node-card" data-uid="${node.uid}">
        <button class="accordion-header">
            <span class="accordion-title-group">
                <code class="uid-tag">${node.uid}</code> ${node.name}
            </span>
            <i class="fas fa-chevron-down accordion-icon"></i>
        </button>
        <div class="accordion-content">
            <div class="accordion-content-inner">
                <h4>Action</h4>
                <p>${unsafeHTML(parseMarkdown(node.action))}</p>
                <h4>Deliverable</h4>
                <p>${unsafeHTML(parseMarkdown(node.deliverable))}</p>
                <h4>Reasoning</h4>
                <p>${unsafeHTML(parseMarkdown(node.reasoning))}</p>
            </div>
        </div>
    </div>`;
};

export const UI = {
    renderOnboarding: function(data, viewId) {
        if (!data) return '';
        return html`
            <div class="onboarding-card" id="onboarding-${viewId}">
                <div class="onboarding-header">
                    <h4><i class="fas fa-route"></i> ${data.title}</h4>
                    <button class="onboarding-close" data-action="dismiss-onboarding" data-view-id="${viewId}" aria-label="Dismiss guide">&times;</button>
                </div>
                <div class="onboarding-content">
                    <p>${data.text}</p>
                </div>
            </div>
        `;
    },

    renderGovernanceEngine: function(data) {
        if (!data) return html`<h1>Error: Governance data missing.</h1>`;

        if (!window.govState) {
            window.govState = { mode: 'science', selectedGate: null, persona: 'practitioner' };
        }

        const tools = [
            { id: "T1", name: "Define" }, { id: "T2", name: "Plan" }, { id: "T3", name: "Generate" },
            { id: "T4", name: "Decide" }, { id: "T5", name: "Structure" }, { id: "T6", name: "Execute" },
            { id: "T7", name: "Analyze" }, { id: "T8", name: "Present" }, { id: "T9", name: "Synthesize" },
            { id: "T10", name: "Orchestrate" }
        ];

        const modes = [
            { val: 'science', label: 'Science & Engineering' },
            { val: 'business', label: 'Business & Agile' },
            { val: 'humanities', label: 'Humanities & SS' },
            { val: 'arts', label: 'Arts & Design' },
            { val: 'culture', label: 'Culture & Ethics' },
            { val: 'pedagogy', label: 'Pedagogy' }
        ];

        window.setGovMode = (mode) => { window.govState.mode = mode; window.govState.selectedGate = null; render(); };
        window.selectGate = (index) => { window.govState.selectedGate = index; render(); };
        window.setPersona = (role) => { window.govState.persona = role; render(); };
        window.toggleArchModal = () => { 
            const modal = document.getElementById('arch-modal');
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        };

        const render = () => {
            const currentProcess = data.processes[window.govState.mode];
            const currentRoles = data.roles[window.govState.mode];
            const gateData = window.govState.selectedGate !== null ? currentProcess[window.govState.selectedGate] : null;
            const container = document.getElementById('governance-view');
            if(container) {
                const { render: litRender, html } = window.litHtml;
                litRender(template(currentProcess, currentRoles, gateData), container);
            }
        };

        const template = (process, roles, gateData) => html`
            <div class="governance-container theme-${window.govState.mode}">
                <header class="gov-header">
                    <h1>Governance Engine</h1>
                    <div class="gov-controls">
                        <button class="info-btn" onclick="window.toggleArchModal()"><i class="fas fa-sitemap"></i> Architecture</button>
                        <select onchange="window.setGovMode(this.value)" class="mode-selector">
                            ${modes.map(m => html`<option value="${m.val}" ?selected=${window.govState.mode === m.val}>${m.label}</option>`)}
                        </select>
                    </div>
                </header>

                <div class="workflow-map">
                    ${tools.map((tool, i) => html`
                        <div class="tool-node">
                            <div class="tool-id">${tool.id}</div>
                            <div class="tool-name">${tool.name}</div>
                        </div>
                        ${i < tools.length - 1 && i < process.length ? html`
                            <div class="gate-node ${window.govState.selectedGate === i ? 'selected' : ''}" 
                                 onclick="window.selectGate(${i})">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                        ` : ''}
                    `)}
                </div>

                <div class="gov-dashboard">
                    <div class="icd-panel">
                        ${gateData ? html`
                            <div class="icd-header">
                                <div class="icd-subtitle">${gateData.id}</div>
                                <h2 class="icd-title">${gateData.name}</h2>
                            </div>
                            
                            <div class="persona-tabs">
                                <button class="p-btn ${window.govState.persona === 'practitioner' ? 'active' : ''}" 
                                        onclick="window.setPersona('practitioner')">
                                    <strong>${gateData.source.split('/')[0]}</strong> (Source)
                                </button>
                                <button class="p-btn ${window.govState.persona === 'gatekeeper' ? 'active' : ''}" 
                                        onclick="window.setPersona('gatekeeper')">
                                    <strong>${gateData.target.split('/')[0]}</strong> (Target)
                                </button>
                            </div>

                            <div class="icd-content">
                                ${window.govState.persona === 'practitioner' ? html`
                                    <div class="data-block">
                                        <span class="data-label">Required Payload</span>
                                        <div class="payload-box"><i class="fas fa-file-alt"></i> ${gateData.payload}</div>
                                    </div>
                                ` : html`
                                    <div class="data-block">
                                        <span class="data-label">Review Criteria</span>
                                        <ul class="criteria-list">
                                            ${gateData.criteria.map(c => html`<li>${c}</li>`)}
                                        </ul>
                                    </div>
                                `}
                            </div>
                        ` : html`
                            <div class="empty-state">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>Select a Gate Node to view the Interface Control Document.</p>
                            </div>
                        `}
                    </div>
                </div>

                <div id="arch-modal" class="modal-overlay" style="display:none;">
                    <div class="modal-card" style="width: 800px;">
                        <div class="modal-header">
                            <h2>Governance Architecture</h2>
                            <button class="btn-close" onclick="window.toggleArchModal()">Close</button>
                        </div>
                        <div class="modal-body">
                            <div class="hierarchy-grid">
                                <div class="chain-col">
                                    <div class="chain-header prog-header">${roles.left.header}</div>
                                    <div class="role-card"><span class="role-title">${roles.left.l3}</span></div>
                                    <div class="role-card"><span class="role-title">${roles.left.l2}</span></div>
                                    <div class="role-card"><span class="role-title">${roles.left.l1}</span></div>
                                </div>
                                <div class="tension-zone">
                                    <div class="tension-line"></div>
                                </div>
                                <div class="chain-col">
                                    <div class="chain-header tech-header">${roles.right.header}</div>
                                    <div class="role-card"><span class="role-title">${roles.right.l3}</span></div>
                                    <div class="role-card"><span class="role-title">${roles.right.l2}</span></div>
                                    <div class="role-card"><span class="role-title">${roles.right.l1}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(render, 0);
        return html`<div id="governance-view"></div>`;
    },

    renderWelcome: function(data, onboardingData, viewId) {
        if (!data || !data.welcome) return html`<h1>Error: Welcome data is missing.</h1>`;
        const { title, subtitle } = data.welcome;
        return html`<div>
            <div class="card full-width">
                <div class="welcome-header">
                    <h1>${title}</h1>
                    <p class="key-question">${subtitle.replace('Dialogic ', '')}</p>
                </div>
                <div class="welcome-hub-container">
                    <div class="welcome-choice-card" id="welcome-choice-learn">
                        <div class="welcome-choice-content">
                            <i class="fas fa-graduation-cap welcome-choice-icon"></i>
                            <h2>Learning Stance</h2>
                            <p>I want to understand the process, explore the concepts, and build my capabilities as a practitioner.</p>
                        </div>
                        <a href="?view=overview" data-view="overview" class="welcome-choice-button">Start the Guided Tour</a>
                    </div>
                    <div class="welcome-choice-card" id="welcome-choice-find">
                        <div class="welcome-choice-content">
                            <i class="fas fa-map-signs welcome-choice-icon"></i>
                            <h2>Performance Stance</h2>
                            <p>I have a specific problem or job-to-be-done. Help me find the right tool to get unstuck and deliver results.</p>
                        </div>
                        <a href="?view=diagnostic" data-view="diagnostic" class="welcome-choice-button">Find My Tool</a>
                    </div>
                </div>
                <div style="text-align: center; margin-top: var(--space-6);">
                    <a href="?view=about" data-view="about">Learn more about the framework's philosophy...</a>
                </div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },

    renderInternalLink: function(linkData, frameworkData) {
        const { type, identifier, displayText } = linkData;
        let targetData = null;
        let defaultText = displayText || identifier;
        let href = '#';
        let dataAttributes = `data-link-type="${type}"`;
        let titleAttribute = '';

        try {
            switch (type) {
                case 'tool':
                    targetData = frameworkData.tools.find(t => t.id === identifier);
                    if (targetData) {
                        defaultText = displayText || targetData.name;
                        href = `?view=tool&id=${identifier}`;
                        dataAttributes += ` data-view="tool" data-id="${identifier}"`;
                        titleAttribute = `Navigate to Tool: ${targetData.name}`;
                    }
                    break;
                case 'node':
                    targetData = frameworkData.frameworkNodes.nodes.find(n => n.uid === identifier);
                    if (targetData) {
                        defaultText = displayText || targetData.name;
                        dataAttributes += ` data-node-uid="${identifier}"`;
                        titleAttribute = `View details for Node: ${targetData.name}`;
                    }
                    break;
                case 'glossary':
                    targetData = frameworkData.glossary.terms.find(t => t.term === identifier);
                    if (targetData) {
                        defaultText = displayText || targetData.term;
                        href = `?view=glossary-tool&term=${encodeURIComponent(identifier)}`;
                        dataAttributes += ` data-view="glossary-tool" data-term="${encodeURIComponent(identifier)}"`;
                        titleAttribute = `View glossary definition for: ${targetData.term}`;
                    }
                    break;
                case 'playbook':
                    const entries = frameworkData.playbooks_and_reports_data.documents;
                    targetData = entries.find(p => p.id === identifier);
                    if (targetData) {
                        defaultText = displayText || targetData.title;
                        href = `?view=playbooks-reports&highlight=${identifier}`;
                        dataAttributes += ` data-view="playbooks-reports" data-highlight-id="${identifier}"`;
                        titleAttribute = `Go to Playbook: ${targetData.title}`;
                    }
                    break;
            }
        } catch (e) {
            console.error("Error finding target for link:", linkData, e);
            targetData = null;
        }

        if (!targetData) {
            return `<span class="broken-link" style="color:red;background:#ffeeee;padding:0 4px;border-radius:2px;border:1px solid red;" title="Target ID not found in database">⚠️ ${displayText || identifier}</span>`;
        }

        return `<a href="${href}" class="internal-link" ${dataAttributes} title="${escapeAttr(titleAttribute)}">${defaultText}</a>`;
    },

    renderGenesisProjectView: function(data, onboardingData, viewId) {
        if (!data) return html`<h1>Error: Genesis Project data is missing.</h1>`;
        const phasesHTML = data.phases.map(phase => html`
            <div class="accordion-item genesis-phase-card">
                <button class="accordion-header">
                    <span class="accordion-title-group">${phase.phaseTitle}</span>
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        <p class="key-question"><strong>Goal:</strong> ${phase.phaseGoal}</p>
                        <div class="accordion-group">
                            ${phase.nodes.map(createCollapsibleNodeCard)}
                        </div>
                    </div>
                </div>
            </div>
        `);

        return html`<div>
            <h1>${data.title}</h1>
            <p class="key-question"><em>${data.guidingQuestion}</em></p>
            <p>This is a living, interactive case study documenting the application of all 119 framework nodes to the creation of this very project. It serves as a master-level exemplar of the framework's process. Click on any phase or node to expand it and see the detailed action, deliverable, and reasoning for that step.</p>
            <div class="accordion-group">${phasesHTML}</div>
            <div class="card full-width" style="margin-top: var(--space-6); text-align: center;">
                <h3>Continue Your Journey</h3>
                <p>You've seen our journey. Now, it's your turn. Use the structure of our 'Genesis Project' as a scaffold to build the plan for your own inquiry.</p>
                <a href="#" data-view="planner" data-action="pre-populate-genesis" class="welcome-choice-button">Apply this Process: Start Your Own Plan</a>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },

    renderDiagnostic: function(data) {
        if (!data || !data.diagnostic) return html`<h1>Error: Diagnostic data is missing.</h1>`;
        const { title, description, struggles } = data.diagnostic;
        const cardsHTML = struggles.map(item => renderActionCard({
            view: 'tool',
            id: item.target_tool,
            icon: item.icon,
            title: item.struggle,
            description: item.diagnosing
        }));

        return html`<div>
            <h1>${title}</h1>
            <p>${description}</p>
            <div class="welcome-actions" style="justify-content: flex-start;">${cardsHTML}</div>
        </div>`;
    },
    renderJtbdPerspective: function(jtbdData, currentPersona) {
        if (!jtbdData) return html`<p>No Job-to-be-Done analysis available for this tool.</p>`;
        
        const personaData = jtbdData[currentPersona];
        if (!personaData) return html`<p>No data for the selected persona.</p>`;

        return html`
            <div class="jtbd-perspective-content">
                <div class="jtbd-core-story">
                    <h3>Core Job Story</h3>
                    <p><em>${jtbdData.coreJobStory}</em></p>
                </div>
                <div class="jtbd-forces-grid">
                    <div class="jtbd-force-card push">
                        <h4><i class="fas fa-arrow-down"></i> Push of the Situation</h4>
                        <p>${jtbdData.forces.push}</p>
                    </div>
                    <div class="jtbd-force-card pull">
                        <h4><i class="fas fa-arrow-up"></i> Pull of the New Solution</h4>
                        <p>${jtbdData.forces.pull}</p>
                    </div>
                    <div class="jtbd-force-card habit">
                        <h4><i class="fas fa-sync-alt"></i> Habit of the Present</h4>
                        <p>${jtbdData.forces.habit}</p>
                    </div>
                    <div class="jtbd-force-card anxiety">
                        <h4><i class="fas fa-exclamation-triangle"></i> Anxiety of the New Solution</h4>
                        <p>${jtbdData.forces.anxiety}</p>
                    </div>
                </div>
                <div class="jtbd-persona-plan">
                    <div class="jtbd-persona-header">
                        <h3>${currentPersona === 'practitioner' ? "Practitioner's Job" : "Facilitator's Job"}</h3>
                    </div>
                    <p>${personaData.job}</p>
                </div>
            </div>
        `;
    },

    createSummaryCard: function(tool) {
        const summary = tool.summary || [];
        const textBlocks = summary.filter(b => 
            b.title !== "Concept Cloud" && 
            b.title !== "Data-Driven Modality Profile" &&
            b.title !== "Core Modalities"
        );

        const profileBlock = summary.find(b => b.title && b.title.includes("Modality Profile"));
        
        let modalityData = {};
        let domainVariations = {};
        let defaultInsight = "Select a domain to see the cognitive signature.";
        let generalAnalysis = "";

        if (profileBlock) {
            const parsed = parseModalityTable(profileBlock.human_display_content);
            modalityData = parsed.data;
            generalAnalysis = parsed.generalAnalysis;
            
            if (profileBlock.ai_instructional_context && profileBlock.ai_instructional_context.key_domain_variations) {
                domainVariations = profileBlock.ai_instructional_context.key_domain_variations;
                if(domainVariations.general) {
                    defaultInsight = domainVariations.general;
                } else if (generalAnalysis) {
                    defaultInsight = generalAnalysis;
                }
            }
        }

        const domains = Object.keys(modalityData);
        const initialDomain = domains.includes("General / Pluralist") ? "General / Pluralist" : (domains.length > 0 ? domains[0] : null);
        const initialScores = initialDomain ? modalityData[initialDomain] : [];
        
        let initialInsightText = defaultInsight;
        if(initialDomain) {
            const key = domainKeyMap[initialDomain];
            const secondaryKey = fallbackKeys[key];
            if (domainVariations[key]) {
                initialInsightText = domainVariations[key];
            } else if (domainVariations[secondaryKey]) {
                initialInsightText = domainVariations[secondaryKey];
            }
        }

        const contextGridHTML = html`
            <div class="context-grid">
                ${textBlocks.map(block => {
                    if (block.title === "Objective & Actions") {
                        return html`
                            <div class="context-card objective-card">
                                <div class="card-header">
                                    <i class="fas fa-bullseye"></i>
                                    <h4>${block.title}</h4>
                                </div>
                                <div class="card-content">
                                    ${unsafeHTML(parseMarkdown(block.content))}
                                </div>
                            </div>
                        `;
                    } else if (block.title === "Core Dynamics & Interactions") {
                        return html`
                            <div class="context-card dynamics-card">
                                <div class="card-header">
                                    <i class="fas fa-sync-alt"></i>
                                    <h4>${block.title}</h4>
                                </div>
                                <div class="card-content">
                                    ${unsafeHTML(parseMarkdown(block.content))}
                                </div>
                            </div>
                        `;
                    } else {
                        return html`
                            <div class="context-card">
                                <div class="card-header">
                                    <i class="fas fa-info-circle"></i>
                                    <h4>${block.title}</h4>
                                </div>
                                <div class="card-content">
                                    ${unsafeHTML(parseMarkdown(block.content))}
                                </div>
                            </div>
                        `;
                    }
                })}
            </div>
        `;

        const groups = { "Sensory": [], "Embodied": [], "Symbolic": [], "Cognitive": [], "Meta": [] };
        modalityConfig.forEach((m, i) => groups[m.group].push({ ...m, index: i }));

        const equalizerHTML = domains.length > 0 ? html`
            <div class="equalizer-wrapper">
                <div class="equalizer-header">
                    <h4>Cognitive Signature</h4>
                    <div class="domain-pills" id="domain-pills-${tool.id}">
                        ${domains.map((domain) => html`
                            <button class="domain-pill ${domain === initialDomain ? 'active' : ''}" 
                                    data-domain="${domain}"
                                    onclick="window.updateEqualizer('${tool.id}', '${domain}')">
                                ${domain}
                            </button>
                        `)}
                    </div>
                </div>
                
                <div class="chart-stage" 
                     id="chart-stage-${tool.id}" 
                     data-modality-json="${JSON.stringify(modalityData)}"
                     data-insights-json="${JSON.stringify(domainVariations)}"
                     data-general-analysis="${escapeAttr(generalAnalysis)}">
                     
                    ${Object.entries(groups).map(([groupName, mods]) => html`
                        <div class="modality-group">
                            ${mods.map(mod => {
                                const score = initialScores[mod.index] || 0;
                                const height = (score / 5) * 100;
                                
                                return html`
                                <div class="bar-container" onclick="void(0)">
                                    <div class="bar-tooltip" id="tooltip-${tool.id}-${mod.index}">${score}</div>
                                    <div class="bar" 
                                         id="bar-${tool.id}-${mod.index}" 
                                         style="height: ${height}%; background-color: ${mod.color};">
                                    </div>
                                </div>
                            `})}
                            <div class="group-label">${groupName}</div>
                        </div>
                    `)}
                </div>

                <div class="legend-container">
                    ${Object.entries(groups).map(([groupName, mods]) => html`
                        <div class="legend-group">
                            <h6>${groupName}</h6>
                            ${mods.map(mod => html`
                                <div class="legend-item">
                                    <div class="legend-swatch" style="background-color: ${mod.color}"></div>
                                    ${mod.fullName}
                                </div>
                            `)}
                        </div>
                    `)}
                </div>

                <div class="insight-footer">
                    <div class="insight-text" id="insight-${tool.id}">
                        <h5><i class="fas fa-info-circle"></i> Insight</h5>
                        <div class="insight-content" id="insight-content-${tool.id}">
                            ${unsafeHTML(parseMarkdown(initialInsightText))}
                        </div>
                    </div>
                </div>
            </div>
        ` : html`<div class="equalizer-wrapper"><p>Cognitive signature data not available for this tool.</p></div>`;

        return html`
            <div class="tool-dashboard">
                ${contextGridHTML}
                ${equalizerHTML}
            </div>
        `;
    },
renderInteractiveConceptCloud: function(concepts) {
        if (!concepts || concepts.length === 0) return html`<p>No concepts available.</p>`;

        const domains = new Set();
        concepts.forEach(c => {
            if (Array.isArray(c.variations)) {
                c.variations.forEach(v => domains.add(v.domain));
            }
        });
        const uniqueDomains = Array.from(domains).sort();

        const domainIcons = {
            "Science & Engineering": "fa-flask", "Business & Agile": "fa-rocket",
            "Humanities & Social Sciences": "fa-landmark", "Arts & Design": "fa-palette",
            "Culture & Ethics": "fa-hand-holding-heart", "Pedagogy & Facilitation": "fa-chalkboard-teacher",
            "General / Pluralist": "fa-globe", "Science": "fa-flask", "Business": "fa-chart-line", 
            "Humanities": "fa-book", "Arts": "fa-palette", "Culture": "fa-globe-americas", 
            "Pedagogy": "fa-chalkboard-teacher", "Agile": "fa-rocket"
        };

        const domainColors = {
            "Science & Engineering": "#2980b9", "Business & Agile": "#27ae60",
            "Humanities & Social Sciences": "#8e44ad", "Arts & Design": "#e67e22",
            "Culture & Ethics": "#c0392b", "Pedagogy & Facilitation": "#16a085",
            "General / Pluralist": "#7f8c8d", "Science": "#2980b9", "Business": "#27ae60", 
            "Humanities": "#8e44ad", "Arts": "#e67e22", "Culture": "#c0392b", 
            "Pedagogy": "#16a085", "Agile": "#27ae60"
        };

        return html`
            <div class="concept-cloud-wrapper">
                <div class="concept-filter-bar" id="concept-filter-bar">
                    <button class="filter-chip active" data-domain="all">
                        <i class="fas fa-layer-group"></i> All
                    </button>
                    ${uniqueDomains.map(domain => html`
                        <button class="filter-chip" data-domain="${domain}">
                            <i class="fas ${domainIcons[domain] || 'fa-circle'}" style="color: ${domainColors[domain] || '#ccc'};"></i> ${domain}
                        </button>
                    `)}
                </div>

                <div class="concept-bubbles-container" id="concept-bubbles-container">
                    ${concepts.map(concept => {
                        const conceptDomains = Array.isArray(concept.variations) ? concept.variations.map(v => v.domain).join(',') : '';
                        return html`
                            <button class="concept-bubble" 
                                    data-concept-id="${concept.id}" 
                                    data-domains="${conceptDomains}">
                                ${concept.name}
                            </button>
                        `;
                    })}
                </div>

                <div class="popover-overlay" id="concept-popover-overlay"></div>

                <div class="concept-popover" id="concept-popover-card">
                    <div class="popover-header" id="popover-header">
                        <div style="display:flex; align-items:center;">
                            <h2 id="popover-title">Concept Name</h2>
                            <span class="popover-domain-badge" id="popover-domain-badge">DOMAIN</span>
                        </div>
                        <button class="popover-close" id="popover-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="popover-body">
                        <div class="data-section" id="popover-definition-section">
                            <div class="data-label"><i class="fas fa-book-open"></i> Definition</div>
                            <div class="data-content" id="popover-definition"></div>
                        </div>
                        <div class="data-section">
                            <div class="data-label"><i class="fas fa-user-tie"></i> Expert Reference</div>
                            <div class="data-content" id="popover-expert"></div>
                        </div>
                        <div class="data-section">
                            <div class="data-label"><i class="fas fa-book"></i> Theory & Procedure</div>
                            <div class="data-content" id="popover-theory"></div>
                        </div>
                        <div class="data-section">
                            <div class="data-label"><i class="fas fa-file-alt"></i> Specific Deliverable</div>
                            <div class="data-content" id="popover-deliverable"></div>
                        </div>
                        <div class="data-section">
                            <div class="data-label"><i class="fas fa-ruler-combined"></i> Objective Measurement</div>
                            <div class="data-content" id="popover-rubric"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderToolFocus: function(tool, currentStance, currentPersona, frameworkData, onboardingData, viewId, activePerspective, conceptCloudFilterDomain, currentDomain) {
        const currentToolConcepts = frameworkData.framework_data.toolConcepts[tool.id] || [];
        const scaffoldData = frameworkData.scaffold_model_data.content || [];
        
        const relatedPathways = scaffoldData.filter(p => 
            p.tool_id === parseInt(tool.uid.replace('T', ''))
        );

        const domainMap = {
            "🎨 Arts & Design": { icon: "fa-palette", color: "var(--domain-arts)" },
            "🚀 Business & Agile": { icon: "fa-chart-line", color: "var(--domain-business)" },
            "🌏 Culture & Ethics": { icon: "fa-globe-americas", color: "var(--domain-culture)" },
            "🌐 General / Pluralist": { icon: "fa-globe", color: "var(--domain-general)" },
            "🧑‍🏫 Pedagogy & Facilitation": { icon: "fa-chalkboard-teacher", color: "var(--domain-pedagogy)" },
            "📚 Science & Engineering": { icon: "fa-flask", color: "var(--domain-science)" },
            "👥 Humanities & Social Sciences": { icon: "fa-landmark", color: "var(--domain-humanities)" }
        };

        const relatedPathwaysHTML = relatedPathways.length > 0 ? html`
            <div class="related-pathways-container">
                <details class="related-pathways-details">
                    <summary class="related-pathways-summary">
                        <span class="summary-label"><i class="fas fa-map-signs"></i> Related Pathways (${relatedPathways.length})</span>
                        <i class="fas fa-chevron-down indicator-icon"></i>
                    </summary>
                    <div class="related-pathways-list">
                        ${relatedPathways.map(p => {
                            let displayTitle = p.title;
                            let iconClass = "fa-external-link-alt";

                            if (displayTitle === "Practitioner View" || displayTitle === "Facilitator View") {
                                if (p.domain) {
                                    const shortDomain = p.domain.replace(/ & .*/, '');
                                    displayTitle = `${shortDomain}: ${displayTitle.replace(' View', '')}`;
                                    if (domainMap[p.domain]) {
                                        iconClass = domainMap[p.domain].icon;
                                    }
                                } else if (p.pathway_name) {
                                     displayTitle = `${p.pathway_name} (${displayTitle.replace(' View', '')})`;
                                }
                            }
                            
                            displayTitle = displayTitle.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '').trim();

                            return html`
                                <a href="?view=pathways&expand=${p.id}" class="pathway-tag" title="${p.summary || displayTitle}">
                                    <i class="fas ${iconClass}"></i> ${displayTitle}
                                </a>
                            `;
                        })}
                    </div>
                </details>
            </div>
        ` : '';

        const dynamicKeys = tool.perspectives ? Object.keys(tool.perspectives) : [];
        
        const availablePerspectives = [
            'jobToBeDone',
            tool.nasa_registry ? 'nasa_registry' : null,
            'strategicStreams',
            tool.frameworkImplications ? 'frameworkImplications' : null,
            'cognitiveModel',
            'cynefinAnalysis',
            currentToolConcepts.length > 0 ? 'domainConcepts' : null,
            ...dynamicKeys
        ].filter(Boolean);

        let validActivePerspective = activePerspective;
        if (!availablePerspectives.includes(activePerspective)) {
            validActivePerspective = 'jobToBeDone';
        }

        return html`<div>
            <div class="tool-header-block" style="border-left-color: ${tool.color};">
                ${currentStance === 'performance' ? html`
                <div class="key-deliverables">
                    <strong>Key Deliverable:</strong> ${tool.keyDeliverables}
                </div>` : ''}

                <h1>${tool.name}</h1>
                ${relatedPathwaysHTML}
                <p class="key-question">${tool.keyQuestion}</p>
            </div>
            
            <div class="summary-card" data-tool-id="${tool.id}">
                <div class="summary-grid">${UI.createSummaryCard(tool)}</div>
            </div>

            ${currentToolConcepts.length > 0 ? html`
                <div class="card full-width">
                    <h3><i class="fas fa-cloud"></i> Concept Cloud</h3>
                    <p style="color: var(--color-text-secondary); font-size: 0.9em; margin-bottom: 15px;">
                        Explore the core concepts driving this tool. Filter by domain to see how these principles translate across fields. Click a bubble for details.
                    </p>
                    ${UI.renderInteractiveConceptCloud(currentToolConcepts)}
                </div>
            ` : ''}

            <div class="card full-width perspectives-container">
                <h3>Perspectives on this Tool</h3>
                <div class="perspectives-nav" id="tool-perspectives-nav">
                    ${UI.createPerspectiveTabs(tool, validActivePerspective, currentToolConcepts.length > 0)}
                </div>
                <div class="perspectives-content" id="tool-perspectives-content">
                    ${UI.createPerspectiveContents(tool, validActivePerspective, currentPersona, currentToolConcepts, frameworkData.framework_data.frameworkNodes.themes, scaffoldData, currentDomain, frameworkData)}
                </div>
            </div>
            <div class="card full-width">
                <div class="playbook-header">
                    <h3>${currentPersona === 'practitioner' ? "Practitioner's Plan" : "Facilitator's Playbook"}</h3>
                    ${renderPersonaSwitch(currentPersona)}
                </div>
                <div id="tool-playbook-content">${UI.createPlaybook(tool, currentPersona, currentStance, validActivePerspective)}</div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },
    createPerspectiveTabs: function(tool, activePerspective, hasDomainConcepts) {
        let allPerspectiveKeys = [
            'jobToBeDone',
            'cynefinAnalysis',
            'psychologicalDynamics',
            'disciplinaryapplication',
            'domainConcepts',
            'integrativeStrategies',
            'frameworkImplications',
            'strategicStreams',
            'CultureTraditionsAndEthics',
            'cognitiveModel',
            'cognitiveNeuroscience',
            'comparativeAnalysis',
            'nasa_registry'
        ];
        
        allPerspectiveKeys = allPerspectiveKeys.filter(key => 
            key === 'jobToBeDone' || key === 'strategicStreams' ||
            (key === 'nasa_registry' && tool.nasa_registry) ||
            (key === 'frameworkImplications' && tool.frameworkImplications) ||
            key === 'cognitiveModel' || 
            key === 'cynefinAnalysis' ||
            (key === 'domainConcepts' && hasDomainConcepts) ||
            (tool.perspectives && tool.perspectives[key])
        );

        return allPerspectiveKeys.map((key) => {
            const isActive = key === activePerspective;
            let title = '';
            
            if (key === 'jobToBeDone') {
                title = 'Job to be Done';
            } else if (key === 'nasa_registry') {
                title = 'NASA Compliance';
            } else if (key === 'strategicStreams') {
                title = 'Strategic Streams';
            } else if (key === 'frameworkImplications' && tool.frameworkImplications) {
                title = tool.frameworkImplications.title;
            } else if (key === 'cognitiveModel') {
                title = 'Neurocognitive Model';
            } else if (key === 'cynefinAnalysis') {
                title = 'Navigational Context';
            } else if (key === 'domainConcepts') { 
                title = 'Domain Concepts';
            } else if (tool.perspectives && tool.perspectives[key]) {
                const p = tool.perspectives[key];
                title = p.title;
            }

            const cleanTitle = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '').trim();

            return html`<button class="perspective-tab ${isActive ? 'active' : ''}" data-perspective="${key}">
                <span data-jargon="${cleanTitle}" data-simple="${(tool.perspectives && tool.perspectives[key] && tool.perspectives[key].simpleTitle) || cleanTitle}">${cleanTitle}</span>
            </button>`;
        });
    },

    createPerspectiveContents: function(tool, activePerspective, currentPersona, currentToolConcepts, themes, scaffoldData, currentDomain, frameworkData) {
        const localParseMarkdownInline = (text) => (window.marked ? window.marked.parseInline(text || '') : text);
        
        const orderedKeys = [
            'jobToBeDone',
            'cynefinAnalysis',
            'psychologicalDynamics',
            'disciplinaryapplication',
            'domainConcepts',
            'integrativeStrategies',
            'frameworkImplications',
            'strategicStreams',
            'CultureTraditionsAndEthics',
            'cognitiveModel',
            'cognitiveNeuroscience',
            'comparativeAnalysis',
            'nasa_registry'
        ];

        const allPerspectiveKeys = orderedKeys.filter(key => 
            key === 'jobToBeDone' || key === 'strategicStreams' ||
            (key === 'nasa_registry' && tool.nasa_registry) ||
            (key === 'frameworkImplications' && tool.frameworkImplications) ||
            (key === 'cognitiveModel') || 
            (key === 'cynefinAnalysis') ||
            (key === 'domainConcepts' && currentToolConcepts.length > 0) ||
            (tool.perspectives && tool.perspectives[key])
        );

        return allPerspectiveKeys.map((key) => {
            const isActive = key === activePerspective;
            let contentHTML = '';

            if (key === 'jobToBeDone') {
                contentHTML = UI.renderJtbdPerspective(tool.jtbdAnalysis, currentPersona);
            } 
                                                                                    else if (key === 'nasa_registry' && tool.nasa_registry) {
                const nr = tool.nasa_registry;
                
                // --- DATA COLLECTION ---
                let allTerms = [];
                const add = (source) => { if (Array.isArray(source)) allTerms = allTerms.concat(source); };

                if (typeof frameworkData !== 'undefined') {
                    add(frameworkData.glossary_tool_data);
                    if (frameworkData.framework_data && frameworkData.framework_data.glossary) {
                        add(frameworkData.framework_data.glossary.terms);
                    }
                }
                if (allTerms.length === 0 && typeof window.cognitiveToolkitData !== 'undefined') {
                    const gd = window.cognitiveToolkitData;
                    add(gd.glossary_tool_data);
                    if (gd.framework_data && gd.framework_data.glossary) {
                        add(gd.framework_data.glossary.terms);
                    }
                }

                // --- LOOKUP LOGIC ---
                const getDef = (term) => {
                    if (!term) return "";
                    
                    // Special Case: PBS Codes (e.g., "1.1")
                    // We map these dynamically to the Tool Name
                    if (/^\d+(\.\d+)*$/.test(term)) {
                        // Try to find the tool with this ID number
                        // Assuming PBS 1.X maps to Tool X
                        const toolNum = term.split('.')[1]; // Get the '1' from '1.1'
                        if (toolNum) {
                            return `Hierarchical identifier for <strong>Tool ${toolNum}</strong>. Ensures this component is tracked in the master schedule.`;
                        }
                        return "Product Breakdown Structure (PBS) Identifier.";
                    }

                    if (allTerms.length === 0) return "Data loading...";
                    
                    const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                    const target = normalize(term);

                    // 1. Exact Match
                    let entry = allTerms.find(t => normalize(t.term) === target);
                    
                    // 2. Partial Match (Target inside Term) e.g. "TRL 1" inside "TRL 1: Basic..."
                    if (!entry) {
                        entry = allTerms.find(t => t.term && normalize(t.term).includes(target));
                    }
                    
                    // 3. Reverse Partial (Term inside Target) e.g. "TRL 1" inside "TRL 1: Basic..."
                    if (!entry) {
                        // Sort by length desc to match "TRL 1" before "TRL"
                        const candidates = allTerms.filter(t => t.term && target.includes(normalize(t.term)));
                        if (candidates.length > 0) {
                            entry = candidates.sort((a,b) => b.term.length - a.term.length)[0];
                        }
                    }

                    if (!entry) return "Definition not found in glossary.";
                    return entry.general_principle || entry.definition || "No definition available.";
                };

                // --- RENDER HELPER ---
                const linkTerm = (label, term, isValue = false) => {
                    const def = getDef(term);
                    const safeDef = def.replace(/"/g, '&quot;');
                    const classList = isValue ? "nasa-term value-term" : "nasa-term label-term";
                    
                    // If it's a value, we might want to strip extra text for the lookup but display full text
                    // For now, we pass the full text to getDef which handles partial matching
                    
                    return `<span class="${classList}" tabindex="0">
                                ${label}
                                <span class="tooltip-text">
                                    <strong style="display:block; margin-bottom:4px; text-transform:uppercase; opacity:0.8; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:4px;">${term}</strong>
                                    ${safeDef}
                                </span>
                            </span>`;
                };

                contentHTML = html`
                    <div class="nasa-registry-view">
                        <div class="nasa-header">
                            <i class="fas fa-rocket"></i>
                            <h4>Systems Engineering Technical Envelope</h4>
                        </div>
                        <div class="nasa-grid">
                            <div>
                                ${unsafeHTML(linkTerm('PBS Code:', 'Product Breakdown Structure'))} 
                                <span class="nasa-code-tag">${unsafeHTML(linkTerm(nr.pbs_id, nr.pbs_id, true))}</span>
                            </div>
                            <div>
                                ${unsafeHTML(linkTerm('KDP Gate:', 'Key Decision Point'))} 
                                <span>${unsafeHTML(linkTerm(nr.kdp_gate, nr.kdp_gate, true))}</span>
                            </div>
                            <div>
                                ${unsafeHTML(linkTerm('Readiness Target:', 'Technology Readiness Level'))} 
                                <span>${unsafeHTML(linkTerm(nr.readiness_target, nr.readiness_target, true))}</span>
                            </div>
                            <div>
                                ${unsafeHTML(linkTerm('Verification Artifact:', 'Verification Artifact'))} 
                                <u>${unsafeHTML(linkTerm(nr.verification_artifact, nr.verification_artifact, true))}</u>
                            </div>
                        </div>
                        <div class="nasa-quote-box">
                            <p class="nasa-quote-label">NASA Technical Requirement (Appendix C Compliant)</p>
                            <p class="nasa-quote-text">"${nr.requirement || nr.entry_criteria}"</p>
                        </div>
                    </div>`;
            }
            else if (key === 'strategicStreams') {
                contentHTML = UI.renderStrategicStreams(tool.id, frameworkData);
            }
            else if (key === 'frameworkImplications' && tool.frameworkImplications) {
                const { summary, points } = tool.frameworkImplications;
                contentHTML = html`<p><em>${summary}</em></p><ul>${points.map(p => html`<li>${unsafeHTML(localParseMarkdownInline(p))}</li>`)}</ul>`;
            } 
            else if (key === 'cognitiveModel') {
                contentHTML = UI.renderCognitiveModel(tool, scaffoldData);
            } 
            else if (key === 'cynefinAnalysis') {
                contentHTML = UI.renderCynefinAnalysis(tool);
            } 
            else if (key === 'domainConcepts') { 
                contentHTML = UI.renderDomainConcepts(currentToolConcepts, themes);
            } 
            else if (key === 'comparativeAnalysis') {
                const p = tool.perspectives[key];
                const modelsHTML = p.models.map(m => html`
                    <div class="accordion-item">
                        <button class="accordion-header comparison-model-header">
                            <span class="accordion-title-group"><strong>Vs. ${m.model}</strong> <span class="comparison-tag">${m.vector}</span></span>
                            <i class="fas fa-chevron-down accordion-icon"></i>
                        </button>
                        <div class="accordion-content">
                            <div class="accordion-content-inner comparison-content-grid">
                                <div class="comparison-field">
                                    <span class="comparison-label">Comparison</span>
                                    <div class="comparison-value">${m.comparison}</div>
                                </div>
                                <div class="comparison-field">
                                    <span class="comparison-label">Value Add</span>
                                    <div class="comparison-value">${m.value_add}</div>
                                </div>
                                <div class="comparison-field">
                                    <span class="comparison-label">Derivation</span>
                                    <div class="comparison-value" style="font-style: italic; color: var(--color-text-secondary);">${m.derivation}</div>
                                </div>
                                ${m.real_world_example ? html`
                                <div class="comparison-field">
                                    <span class="comparison-label">Real World Example</span>
                                    <div class="comparison-value">${m.real_world_example}</div>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                `);
                
                contentHTML = html`
                    <div class="comparative-analysis-container">
                        <p class="perspective-summary"><em>${p.summary}</em></p>
                        <div class="selection-logic-note">
                            <strong>Selection Logic</strong>
                            ${p.selection_logic}
                        </div>
                        <div class="accordion-group">
                            ${modelsHTML}
                        </div>
                    </div>
                `;
            } 
            else if (key === 'disciplinaryapplication') {
                const da = tool.perspectives?.disciplinaryapplication;
                const apps = da?.applications || []; 
                
                const appsHTML = apps.map(app => html`
                    <div class="application-card">
                        <div class="app-header">
                            <i class="fas ${app.icon}"></i>
                            <h4>${app.domainName}</h4>
                        </div>
                        <div class="app-body">
                            <p><strong>Phenotype:</strong> ${app.phenotypeName}</p>
                            <p><strong>Output:</strong> ${app.practitioner_output}</p>
                            <p><strong>Method:</strong> ${unsafeHTML(localParseMarkdownInline(app.practitioner_method))}</p>
                            <p><strong>Facilitator:</strong> ${unsafeHTML(localParseMarkdownInline(app.facilitator_method))}</p>
                        </div>
                    </div>
                `);

                contentHTML = html`
                    <div class="disciplinary-application-container">
                        <p><em>${da?.summary || ''}</em></p>
                        <p>${da?.content || ''}</p>
                        <div class="applications-grid">
                            ${appsHTML}
                        </div>
                    </div>
                `;
            }
            else if (tool.perspectives && tool.perspectives[key]) {
                const p = tool.perspectives[key];
                let integrativeStrategiesHTML = '';
                
                if (p.integrativeStrategies) {
                    const strategies = Array.isArray(p.integrativeStrategies) ? p.integrativeStrategies : [p.integrativeStrategies];
                    integrativeStrategiesHTML = html`<div class="accordion-group">${strategies.map(item => html`
                        <div class="accordion-item">
                            <button class="accordion-header"><span class="accordion-title-group">${item.title}</span><i class="fas fa-chevron-down accordion-icon"></i></button>
                            <div class="accordion-content"><div class="accordion-content-inner">${unsafeHTML(parseMarkdown(item.content))}</div></div>
                        </div>`)}</div>`;
                }
                
                contentHTML = html`<p><em>${p.summary || ''}</em></p>${unsafeHTML(parseMarkdown(p.content))}${integrativeStrategiesHTML}`;
            }
            
            return html`<div class="perspective-content ${isActive ? 'active' : ''}" data-perspective-content="${key}">${contentHTML}</div>`;
        });
    },
    renderStrategicStreams: function(toolId, frameworkData) {
        const matrixFile = frameworkData.framework_data['matrix_clusters.json'];
        if (!matrixFile || !matrixFile.tools) return html`<div class='empty-state'>No stream data found.</div>`;
        
        const toolData = matrixFile.tools.find(t => t.toolId === toolId);
        if (!toolData || !toolData.streams) return html`<div class='empty-state'>No streams defined.</div>`;

        const getIcon = (id) => {
            if (id.includes('S1')) return 'fa-child';
            if (id.includes('S2')) return 'fa-microscope';
            if (id.includes('S3')) return 'fa-project-diagram';
            if (id.includes('S4')) return 'fa-users';
            if (id.includes('S5')) return 'fa-bolt';
            return 'fa-stream';
        };

        const streamsHTML = toolData.streams.map(stream => html`
            <div class='stream-card'>
                <div class='stream-header'>
                    <i class='fas ${getIcon(stream.id)} stream-icon'></i>
                    <h4>${stream.name}</h4>
                </div>
                <div class='stream-body'>
                    <p class='stream-principle'><strong>Principle:</strong> ${stream.principle}</p>
                    <div class='stream-prompt'>
                        <i class='fas fa-comment-dots'></i>
                        <em>${stream.application_prompt}</em>
                    </div>
                </div>
            </div>
        `);

        return html`
            <style>
                .streams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
                .stream-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 8px; padding: 1.5rem; box-shadow: var(--shadow-sm); transition: transform 0.2s; }
                .stream-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
                .stream-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; border-bottom: 2px solid var(--color-highlight); padding-bottom: 0.5rem; }
                .stream-icon { font-size: 1.2em; color: var(--color-highlight); }
                .stream-header h4 { margin: 0; color: var(--color-text-primary); }
                .stream-principle { color: var(--color-text-secondary); margin-bottom: 1rem; font-size: 0.95em; }
                .stream-prompt { background: var(--color-background); padding: 10px; border-radius: 6px; font-style: italic; color: var(--color-text-primary); border-left: 3px solid var(--color-accent); }
            </style>
            <div class='streams-container'>
                <p>These are the active cognitive channels for this tool. Use these prompts to unblock your thinking.</p>
                <div class='streams-grid'>${streamsHTML}</div>
            </div>
        `;
    },

    renderDomainConcepts: function(concepts, themes) {
        if (!concepts || concepts.length === 0) {
            return html`<p>No specific domain concepts defined for this tool yet.</p>`;
        }

        const domainIcons = {
            // Standardized Domains
            "Science & Engineering": "fa-flask",
            "Business & Agile": "fa-rocket",
            "Humanities & Social Sciences": "fa-landmark",
            "Arts & Design": "fa-palette",
            "Culture & Ethics": "fa-hand-holding-heart",
            "Pedagogy & Facilitation": "fa-chalkboard-teacher",
            "General / Pluralist": "fa-globe",
            
            // Legacy/Fallback Support
            "Science": "fa-flask", 
            "Business": "fa-chart-line", 
            "Humanities": "fa-book",
            "Arts": "fa-palette", 
            "Culture": "fa-globe-americas", 
            "Pedagogy": "fa-chalkboard-teacher",
            "Agile": "fa-rocket"
        };
        const domainColors = {
            // Standardized Domains
            "Science & Engineering": "#2980b9",       // Strong Blue
            "Business & Agile": "#27ae60",            // Agile Green
            "Humanities & Social Sciences": "#8e44ad", // Academic Purple
            "Arts & Design": "#e67e22",               // Creative Orange
            "Culture & Ethics": "#c0392b",            // Ethical Red
            "Pedagogy & Facilitation": "#16a085",     // Growth Teal
            "General / Pluralist": "#7f8c8d",         // Neutral Grey

            // Legacy/Fallback Support
            "Science": "#2980b9", 
            "Business": "#27ae60", 
            "Humanities": "#8e44ad",
            "Arts": "#e67e22", 
            "Culture": "#c0392b", 
            "Pedagogy": "#16a085",
            "Agile": "#27ae60"
        };

        const allDomains = new Set();
        concepts.forEach(concept => {
            if (Array.isArray(concept.variations)) {
                concept.variations.forEach(v => allDomains.add(v.domain));
            }
        });
        const uniqueDomains = Array.from(allDomains).sort();

        return html`
            <div class="domain-concepts-container">
                <p>These are the specific concepts and their applications across different domains that embody the purpose of this tool. Each concept acts as a detailed node within the broader tool.</p>
                
                <div class="concept-cloud-controls" id="concept-cloud-controls">
                    <button class="concept-cloud-toggle-btn active" data-domain-filter="all">
                        <i class="fas fa-globe" style="color: var(--domain-general);"></i> All Domains
                    </button>
                    ${uniqueDomains.map(domain => html`
                        <button class="concept-cloud-toggle-btn" data-domain-filter="${domain}">
                            <i class="fas ${domainIcons[domain] || 'fa-question-circle'}" style="color: ${domainColors[domain] || '#ccc'};"></i> ${domain}
                        </button>
                    `)}
                </div>

                <div class="concept-cloud-items-wrapper" id="concept-cloud-accordion-group">
                    ${concepts.map(concept => html`
                        <div class="accordion-item concept-cloud-item" data-concept-id="${concept.id}" data-domains="${Array.isArray(concept.variations) ? concept.variations.map(v => v.domain).join(',') : ''}" tabindex="0">
                            <button class="accordion-header">
                                <span class="accordion-title-group">
                                    <code class="uid-tag">${concept.id}</code> <strong>${concept.name}</strong>
                                </span>
                                <i class="fas fa-chevron-down accordion-icon"></i>
                            </button>
                            <div class="accordion-content">
                                <div class="accordion-content-inner">
                                    <h4>Integrated Deliverable: <em>${concept.integrated_deliverable}</em></h4>
                                    <p><strong>Shared Project Scenario:</strong> ${concept.scenario}</p>
                                    <p>${unsafeHTML(parseMarkdown(concept.theory_application))}</p>
                                    
                                    <h4>Domain Variations:</h4>
                                    <div class="variations-grid">
                                        ${(concept.variations || []).map(variation => html`
                                            <div class="variation-card" data-domain="${variation.domain}" style="border-left: 3px solid ${domainColors[variation.domain] || '#ccc'};">
                                                <h5 style="color: ${domainColors[variation.domain] || '#ccc'};">
                                                    <i class="fas ${domainIcons[variation.domain] || 'fa-question-circle'}"></i> 
                                                    ${variation.domain}
                                                </h5>
                                                <p><strong>Expert:</strong> ${variation.expert}</p>
                                                <p><strong>Theory & Procedure:</strong> ${unsafeHTML(parseMarkdown(variation.theory))}</p>
                                                <p><strong>Specific Deliverable:</strong> ${variation.specific_deliverable}</p>
                                                <p><strong>Objective Measurement:</strong> ${variation.rubric}</p>
                                            </div>
                                        `)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    },

    renderCognitiveModel: function(tool, globalPathways = []) {
        const toolIdNum = parseInt(tool.uid.replace('T', ''));
        const pathwaysData = globalPathways.filter(p => 
            p.tool_id === toolIdNum && 
            (p.type === 'pathway' || p.category === 'Core Tool Definitions')
        );
        
        if (!pathwaysData || pathwaysData.length === 0) {
             return html`
                <div class="empty-state-container" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
                    <i class="fas fa-brain" style="font-size: 2em; margin-bottom: 10px;"></i>
                    <p>No neurocognitive pathways found for this tool in the master list.</p>
                </div>`;
        }

        const pathwaysHTML = pathwaysData.map(pathway => {
            const sequence = pathway.neurocognitive_sequence || pathway.sequence || 
                           (pathway.facilitator_model && pathway.facilitator_model.sequence) || 
                           (pathway.learner_model && pathway.learner_model.sequence) || 
                           [];
            
            if (!sequence || sequence.length === 0) return html``;

            const stepsHTML = sequence.map(step => {
                const state = step.neurocognitive_state || {};
                const analysis = state.cognitive_mode_analysis || {};
                const validation = step.validation_and_credibility || {};
                
                const stepTitle = step.pfic_word || step.step || 'Unnamed Step';
                const stepDescription = validation.key_neuroscientific_principle || '';
                const networks = step.networks || state.dominant_networks; 

                let networksHTML;
                if (Array.isArray(networks)) {
                    networksHTML = networks.map(n => html`<code>${n}</code>`);
                } else if (typeof networks === 'string') {
                    networksHTML = html`<code>${networks}</code>`;
                } else {
                    networksHTML = html`<span style="color: var(--color-text-secondary); font-style: italic;">Not specified</span>`;
                }

                return html`
                    <div class="neuro-step-card">
                        <h4>${stepTitle}</h4>
                        <p>${unsafeHTML(parseMarkdown(stepDescription))}</p>
                        
                        <div class="neuro-details-grid">
                            <div>
                                <strong>Dominant Networks:</strong><br>
                                <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;">${networksHTML}</div>
                            </div>
                            <div>
                                <strong>Processing Style:</strong><br>
                                ${analysis.processing_style || 'N/A'}
                            </div>
                            <div>
                                <strong>System 1/2 Balance:</strong><br>
                                ${analysis.s1_s2_balance || 'N/A'}
                            </div>
                            <div>
                                <strong>Confidence:</strong><br>
                                <span class="confidence-tag confidence-${(validation.confidence_score || 'tier-3').toLowerCase().replace(' ', '-')}">
                                    ${validation.confidence_score || 'Unrated'}
                                </span>
                            </div>
                        </div>
                    </div>`;
            });

            return html`
                <div class="accordion-item">
                    <button class="accordion-header">
                        <span class="accordion-title-group">
                            <i class="fas fa-project-diagram" style="color: var(--color-highlight); opacity: 0.7;"></i>
                            ${pathway.title || pathway.pathway_name || 'Neurocognitive Pathway'}
                        </span>
                        <i class="fas fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-content-inner">
                            ${stepsHTML}
                        </div>
                    </div>
                </div>`;
        });

        return html`<div class="accordion-group">${pathwaysHTML}</div>`;
    },
            
    renderCynefinAnalysis: function(tool) {
        if (!tool || !tool.cynefinAnalysis) {
            return html`
                <div class="empty-state-container">
                    <i class="fas fa-compass" style="font-size: 2em; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>Navigational Context (Cynefin) data is not available for this tool.</p>
                </div>`;
        }
        
        const { genotype, phenotypes } = tool.cynefinAnalysis;
        
        if (!genotype) {
             return html`<p>Genotype data missing.</p>`;
        }

        const phenotypesArray = Array.isArray(phenotypes) ? phenotypes : (phenotypes ? [phenotypes] : []);
        
        const phenotypesHTML = phenotypesArray.length > 0 ? phenotypesArray.map(p => html`
            <tr>
                <td data-col-name="Domain / Phenotype"><strong>${p.domainName}</strong><br><em>${p.phenotypeName}</em></td>
                <td data-col-name="Classification & Reasoning">${unsafeHTML(parseMarkdown(p.classificationAndReasoning))}</td>
                <td data-col-name="Implications & Risks">${unsafeHTML(parseMarkdown(p.implicationsAndRisk))}</td>
            </tr>`) : html`<tr><td colspan="3">No phenotype data available.</td></tr>`;

        return html`
            <div class="cynefin-summary-box">
                <h4>Genotype: ${genotype.primaryDomain} Domain</h4>
                ${unsafeHTML(parseMarkdown(genotype.reasoning))}
                <p><strong>Implications:</strong> ${unsafeHTML(parseMarkdown(genotype.implications))}</p>
            </div>
            <h4>Phenotype Analysis</h4>
            <div class="table-wrapper">
                <table class="cynefin-phenotypes-table">
                    <thead><tr><th>Domain / Phenotype</th><th>Classification & Reasoning</th><th>Implications & Risks</th></tr></thead>
                    <tbody>${phenotypesHTML}</tbody>
                </table>
            </div>`;
    },
createPlaybook: function(tool, currentPersona, currentStance, activePerspective = 'jobToBeDone') {
        let planData = [];
        let source = "Job to be Done (Default)";

        if (activePerspective === 'jobToBeDone') {
            if (tool.jtbdAnalysis && tool.jtbdAnalysis[currentPersona] && tool.jtbdAnalysis[currentPersona].plan) {
                planData = tool.jtbdAnalysis[currentPersona].plan;
                source = 'Job to be Done';
            }
        } 
        else if (tool.perspectives && tool.perspectives[activePerspective] && tool.perspectives[activePerspective].dynamic_playbook && tool.perspectives[activePerspective].dynamic_playbook[currentPersona]) {
            planData = tool.perspectives[activePerspective].dynamic_playbook[currentPersona];
            source = tool.perspectives[activePerspective].title || activePerspective;
        }

        if (!planData || planData.length === 0) {
            return html`
                <div class="empty-state-container" style="text-align: center; padding: 40px; color: var(--color-text-secondary);">
                    <i class="fas fa-book-open" style="font-size: 2em; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No specific playbook actions for this perspective.</p>
                    <p style="font-size: 0.9em;">Switch to the <strong>Job to be Done</strong> tab for the core action plan.</p>
                </div>`;
        }

        return html`
            <div class="playbook-context-indicator" style="margin-bottom: 15px; padding: 8px; background-color: var(--color-background); border-radius: 4px; border-left: 3px solid var(--color-highlight);">
                <small>Context: <strong>${source}</strong></small>
            </div>
            <ol class="practitioner-plan">
                ${planData.map(step => html`<li>${unsafeHTML(window.marked ? window.marked.parse(step) : step)}</li>`)}
            </ol>
            
            ${activePerspective === 'jobToBeDone' && tool.pedagogicalPlaybook ? html`
                <div class="accordion-group" style="margin-top: 20px; border-top: 1px solid var(--color-border); padding-top: 20px;">
                    <h4>Additional Resources</h4>
                    ${tool.pedagogicalPlaybook.map(item => {
                        const title = item.stanceTitle ? item.stanceTitle[currentStance] : item.title;
                        const defaultState = item.stance ? item.stance[currentStance].defaultState : 'collapsed';
                        const isActive = defaultState === 'expanded';

                        return html`
                        <div class="accordion-item ${isActive ? 'active' : ''}" data-uid="${item.uid}">
                            <button class="accordion-header" data-uid="${item.uid}">
                                <span class="accordion-title-group"><i class="fas ${item.icon}"></i> ${title}</span>
                                <i class="fas fa-chevron-down accordion-icon"></i>
                            </button>
                            <div class="accordion-content" style="max-height: ${isActive ? '1000px' : '0'}"><div class="accordion-content-inner">${unsafeHTML(parseMarkdown(item.content))}</div></div>
                        </div>`;
                    })}
                </div>
            ` : ''}
        `;
    },
    renderHub: function() {
        const hubCards = [
            { href: '#', view: '', icon: 'fas fa-file-alt', title: 'Lesson Plan Shell', description: 'A customizable lesson plan template structured around the framework tools.' },
            { href: '#', view: '', icon: 'fas fa-tasks', title: 'Rubric Template', description: 'A blank, editable version of the Holistic Inquiry Process Rubric.' },
            { href: '#', view: '', icon: 'fas fa-users', title: 'Stakeholder Map Template', description: 'A visual template for mapping stakeholder needs and influence.' },
            { href: '#', view: '', icon: 'fas fa-bomb', title: 'Pre-Mortem Facilitator\'s Guide', description: 'A step-by-step guide to running a pre-mortem risk analysis session.' }
        ];
        const cardsHTML = hubCards.map(card => renderActionCard(card));
        return html`<div>
            <h1>Actionability Hub</h1>
            <p>Downloadable templates and resources to bridge the gap between theory and practice.</p>
            <div class="resource-grid">${cardsHTML}</div>
        </div>`;
    },

    renderLog: function(logData) {
        const logEntriesHTML = logData.map(entry => html`
            <div class="log-entry">
                <h3>${entry.toolName}</h3>
                <blockquote>${unsafeHTML(entry.prompt)}</blockquote>
                <div class="log-entry-answer">${unsafeHTML(entry.answer.replace(/\n/g, '<br>'))}</div>
            </div>
        `);

        return html`<div>
            <h1>Your Positionality Log</h1>
            <p>This is a living document of your reflections throughout the inquiry process. Your answers are saved in your browser and are not sent anywhere.</p>
            <button id="export-log-btn">Export Log as Text File</button>
            <hr style="margin: var(--space-5) 0;">
            ${logEntriesHTML}
        </div>`;
    },

    renderPlaybooksReports: function(data) {
        if (!data || !data.documents) return html`<h1>Error: Playbooks & Reports data is missing or malformed.</h1>`;
        const documentsHTML = data.documents.map(doc => html`
            <div class="accordion-item">
                <button class="accordion-header">
                    <span class="accordion-title-group"><i class="${doc.icon}"></i> ${doc.title}</span>
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </button>
                <div class="accordion-content"><div class="accordion-content-inner">${unsafeHTML(parseMarkdown(doc.content))}</div></div>
            </div>`);

        return html`<div>
            <h1>${data.title}</h1>
            <p>${data.introduction}</p>
            <div class="accordion-group">${documentsHTML}</div>
        </div>`;
    },

    renderCommunity: function() {
        const contributionCards = [
            { href: '#', view: '', icon: 'fab fa-github', title: 'Report an Issue or Bug', description: "Found something that's not working? Let us know on our project's GitHub Issues page." },
            { href: '#', view: '', icon: 'fas fa-lightbulb', title: 'Suggest a Feature', description: "Have an idea for a new feature or a change to the framework's logic? Start a discussion." },
            { href: '#', view: '', icon: 'fas fa-book-open', title: 'Contribute Content', description: "Help us build out the Actionability Hub with new templates or write a case study." }
        ];
        const cardsHTML = contributionCards.map(card => renderActionCard(card));
        return html`<div>
            <h1>Community & Contribution</h1>
            <p>This is a living system, co-created and refined by its community of users. Its stewardship is guided by the principle of evolution.</p>
            <h3>The Evolving Systems Group</h3>
            <p>"An Integrated Language for Inquiry and Creation Evolving Systems Group" is not a fixed committee but a name for the collective of educators, researchers, and practitioners who actively contribute to the framework's development.</p>
            <h3>Version History</h3>
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Version</th><th>Key Changes</th></tr></thead>
                    <tbody>
                        <tr><td><strong>29.0 (Current)</strong></td><td>Dynamic Playbooks: Implemented context-aware advice for every tool and perspective.</td></tr>
                        <tr><td><strong>28.0</strong></td><td>Project "Genesis": Implemented a comprehensive, interactive case study of the framework's self-application.</td></tr>
                        <tr><td><strong>23.0</strong></td><td>Project "Compass": Implemented new Navigation Hub and dynamic Methodology Overlays to address linear bias.</td></tr>
                        <tr><td><strong>22.0</strong></td><td>Consolidation Cycle: Refactored data loading, styling, and component architecture. Centralized bibliography.</td></tr>
                    </tbody>
                </table>
            </div>
            <h3 style="margin-top: var(--space-6);">How to Contribute</h3>
            <div class="resource-grid">${cardsHTML}</div>
        </div>`;
    },

    renderPlannerView: function(plannerData, onboardingData, viewId) {
        if (!plannerData) return html`<h1>Error: Planner data is missing.</h1>`;
        const localParseMarkdown = (text) => (window.marked ? window.marked.parse(text || '', { breaks: true }) : text);

        const renderField = (field) => html`
            <div class="planner-field">
                <label for="${field.id}">${field.label}</label>
                <textarea id="${field.id}" class="planner-textarea" rows="5" placeholder="${field.placeholder}"></textarea>
                ${field.example ? html`<p class="planner-example"><em>e.g., ${field.example}</em></p>` : ''}
            </div>
        `;

        const renderDomainContent = (tool) => {
            let domainsArray = [];
            if (Array.isArray(tool.domains)) {
                domainsArray = tool.domains;
            } else if (tool.domains && tool.domains.domainId) {
                domainsArray = [tool.domains];
            } else if (tool.domains && typeof tool.domains === 'object') {
                 domainsArray = Object.values(tool.domains);
            }

            return domainsArray.map(domain => {
                const fieldsToRender = Array.isArray(domain.fields) 
                    ? domain.fields 
                    : (domain.fields ? [domain.fields] : []);

                return html`
                    <div class="domain-content" data-domain="${domain.domainId}">
                        ${fieldsToRender.map(field => renderField(field))}
                    </div>
                `;
            });
        };

        const allTools = (plannerData.parts.tools || []).map(tool => html`
            <div class="accordion-item">
                <button class="accordion-header">
                    <span class="accordion-title-group">${tool.title}</span>
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="accordion-content-inner">
                        <p class="planner-challenge"><strong>Core Challenge:</strong> <em>"${tool.coreChallenge}"</em></p>
                        <div class="planner-note">${unsafeHTML(localParseMarkdown(tool.facilitatorNote))}</div>
                        ${renderDomainContent(tool)}
                    </div>
                </div>
            </div>
        `);

        return html`
            <div class="planner-sticky-header">
                <div class="planner-header-controls">
                    <h1>Integrated Planner</h1>
                    <div id="domain-switcher-container"></div>
                </div>
                <div class="planner-actions">
                    <span id="persistence-status"></span>
                    <button id="generate-prompt-btn" class="planner-button">Generate Project Prompt</button>
                </div>
            </div>

            <div id="planner-view-main" class="planner-main-content">
                <div class="planner-body">
                    <p>A lightweight, native tool for structuring your inquiry. Your work is saved automatically in your browser.</p>
                    <div class="accordion-group">
                        ${allTools}
                    </div>
                    <div id="prompt-synthesizer-container" class="card full-width">
                         <h3>Prompt Synthesizer</h3>
                         <p>After filling out the sections above, a comprehensive prompt for collaboration or AI assistance will appear here.</p>
                         <textarea id="generated-prompt" class="planner-textarea" rows="20" readonly placeholder="Click 'Generate Project Prompt' to synthesize your plan..."></textarea>
                    </div>
                </div>
                <div id="planner-minimap-container"></div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        `;
    },

    renderOverviewView: function(tools, methodologies) {
        const usageMap = {};
        tools.forEach(tool => {
            usageMap[tool.id] = [];
        });

        methodologies.forEach(methodology => {
            if (!methodology.path) return;
            methodology.path.forEach(segment => {
                if (usageMap[segment.from]) {
                    usageMap[segment.from].push({
                        methodologyName: methodology.name,
                        color: methodology.color || '#ccc',
                        rationale: segment.rationale,
                        type: segment.type 
                    });
                }
            });
        });

        const stagesHTML = tools.map(tool => {
            const usages = usageMap[tool.id];
            let usageContent;

            if (usages && usages.length > 0) {
                usageContent = html`
                    <ul class="methodology-usage-list">
                        ${usages.map(u => html`
                            <li class="methodology-usage-item">
                                <div class="methodology-dot" style="background-color: ${u.color};" title="${u.type}"></div>
                                <div>
                                    <div class="methodology-name" style="color: ${u.color}">${u.methodologyName}</div>
                                    <div class="methodology-action">${u.rationale}</div>
                                </div>
                            </li>
                        `)}
                    </ul>
                `;
            } else {
                usageContent = html`<div class="no-usage">Not a primary starting point for standard methodologies.</div>`;
            }

            const pedagogicalMap = {
                "tool1": { gagne: "1. Gain Attention", fiveE: "Engage" },
                "tool2": { gagne: "2. Inform Objectives", fiveE: "(Implicit)" },
                "tool3": { gagne: "3. Stimulate Recall", fiveE: "Explore" },
                "tool4": { gagne: "(Implicit)", fiveE: "(Implicit)" },
                "tool5": { gagne: "4. Present Content", fiveE: "Explain" },
                "tool6": { gagne: "5. Provide Guidance", fiveE: "Elaborate" },
                "tool7": { gagne: "6. Elicit Performance", fiveE: "(Implicit)" },
                "tool8": { gagne: "8. Assess Performance", fiveE: "Evaluate" },
                "tool9": { gagne: "9. Enhance Transfer", fiveE: "(Implicit)" },
                "tool10": { gagne: "(Meta-Layer)", fiveE: "(Meta-Layer)" }
            };
            const pedData = pedagogicalMap[tool.id] || { gagne: "-", fiveE: "-" };

            return html`
                <div class="workflow-stage" style="border-top-color: ${tool.color};" data-view="tool" data-id="${tool.id}">
                    <div class="stage-header">
                        <h3 class="workflow-stage__title" data-jargon="${tool.name}" data-simple="${tool.simpleName}">${tool.name}</h3>
                        <p class="workflow-stage__deliverable">${tool.keyDeliverables}
                        </p>
                    </div>
                    
                    <div class="stage-body">
                        <p class="workflow-stage__principle">${tool.principle}</p>
                        ${usageContent}
                    </div>

                    <div class="pedagogical-alignment">
                        <h4>Pedagogical Alignment</h4>
                        <div class="alignment-grid">
                            <div class="alignment-item"><strong>Gagne:</strong> <span>${pedData.gagne}</span></div>
                            <div class="alignment-item"><strong>5E:</strong> <span>${pedData.fiveE}</span></div>
                        </div>
                    </div>
                </div>`;
        });

        return html`<div>
            <h1>Comparative Methodology Map</h1>
            <p>This view visualizes how different methodologies utilize the framework. Each card lists the methodologies that trigger a specific action at that stage, along with the expert rationale.</p>
            
            <div class="scroll-wrapper-relative" id="overview-scroll-container">
                <button class="scroll-paddle left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
                
                <div class="workflow-container-wrapper">
                    <div class="workflow-container">
                        ${stagesHTML}
                    </div>
                </div>

                <button class="scroll-paddle right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>`;
    },
 
    renderGlossaryView: function(glossary) {
        if (!glossary) return html`<h1>Error: Glossary data is missing.</h1>`;
        const { title, terms } = glossary;
        const sortedTerms = [...terms].sort((a, b) => a.term.localeCompare(b.term));
        const termsHTML = sortedTerms.map(term => html`
            <dt><strong>${term.term}</strong></dt>
            <dd>${unsafeHTML(parseMarkdown(term.definition))}</dd>
        `);
        return html`<div><h1>${title}</h1><dl class="glossary-list">${termsHTML}</dl></div>`;
    },

    renderNodeExplorer: function(frameworkNodes, tools, onboardingData, viewId) {
        if (!frameworkNodes) return html`<h1>Error: Node data is missing.</h1>`;
        const { themes, nodes, pathways } = frameworkNodes;
        const themeFiltersHTML = html`
            <div class="segmented-control" role="radiogroup" aria-label="Filter by theme">
                <button class="theme-filter-btn active" data-theme="all" role="radio" aria-checked="true">All</button>
                ${Object.entries(themes).map(([key, theme]) => html`
                    <button class="theme-filter-btn" data-theme="${key}" role="radio" aria-checked="false" title="${theme.name}">
                        <i class="fas ${theme.icon} theme-icon" style="color: ${theme.color};"></i>
                        <span>${theme.name}</span>
                    </button>
                `)}
            </div>`;
        const pathwayOptions = Object.entries(pathways).map(([key, pathway]) => html`<option value="${key}">${pathway.name}</option>`);
        const columnsHTML = tools.map(tool => html`
            <div class="tool-column">
                <div class="tool-column-header" style="border-color: ${tool.color};">${tool.simpleName}</div>
                ${nodes.filter(n => n.parentTool === tool.id).map(node => html`
                    <button class="node-card" data-node-id="${node.id}" data-node-theme="${node.theme}" style="border-left-color: ${themes[node.theme].color};">
                        <i class="fas ${themes[node.theme].icon} theme-icon" style="color: ${themes[node.theme].color};"></i>
                        <span>${node.name}</span>
                        <code class="uid-tag">${node.uid}</code>
                    </button>`)}
            </div>`);
        return html`<div class="node-explorer-container">
                <div class="node-map-area">
                    <div class="node-explorer-controls">
                        <input type="search" id="node-search" placeholder="Search nodes...">
                        <select id="pathway-select" aria-label="Select a Pathway"><option value="">Highlight a Pathway...</option>${pathwayOptions}</select>
                    </div>
                    <div class="node-theme-filters">${themeFiltersHTML}</div>
                    
                    <div class="scroll-wrapper-relative" id="node-scroll-container">
                        <button class="scroll-paddle left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
                        <div class="node-map-wrapper">
                            <div class="node-map"><svg id="pathway-lines-svg"></svg>${columnsHTML}</div>
                        </div>
                        <button class="scroll-paddle right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
                    </div>

                </div>
                <div class="node-details" id="node-details-pane"><div class="node-details-placeholder">Select a node to view its details.</div></div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}`;
    },

    renderNetworkMapView: function(frameworkNodes, tools, onboardingData, viewId) {
        if (!frameworkNodes) return html`<h1>Error: Node data is missing.</h1>`;
        const methodsData = frameworkNodes.nodes
            .filter(node => node.isProcessPattern)
            .map(node => ({
                id: node.uid,
                name: node.name,
                primary: node.parentTool || node.primaryParentTool,
                secondary: node.secondaryApplications ? [node.secondaryApplications.toolId] : []
            }));

        const toolsData = tools.map(tool => ({
            id: tool.id,
            name: tool.simpleName,
            uid: tool.uid,
            nodes: frameworkNodes.nodes.filter(n => n.parentTool === tool.id && !n.isProcessPattern)
        }));

        const renderToolCard = (tool) => {
            const nodesHTML = tool.nodes.map(node => html`
                <li class="network-node-link" data-node-id="${node.id}" title="${node.uid}: ${node.name}">
                    <span class="uid-mono">${node.uid}</span> ${node.name}
                </li>`
            );
            return html`
                <div class="tool-card" id="${tool.id}">
                    <h3>${tool.name} <span class="uid">${tool.uid}</span></h3>
                    <ul>${nodesHTML}</ul>
                </div>`;
        };

        const renderMethodCard = (method) => {
            const cleanName = method.name.replace(/^N\d+:\s*/, '');
            return html`
                <div class="method-card" id="${method.id}">
                    <h4>${cleanName}</h4>
                    <button class="method-info-btn" data-node-uid="${method.id}" aria-label="View Details">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>`;
        };

        const methodUids = ["N03", "N11", "N34", "N44", "N65", "N74", "N81", "N95", "N98", "N100"];
        const filteredMethods = methodsData.filter(m => methodUids.includes(m.id));

        const methodRow1HTML = filteredMethods.slice(0, 5).map(renderMethodCard);
        const methodRow2HTML = filteredMethods.slice(5, 10).map(renderMethodCard);
        
        const toolRow1HTML = toolsData.slice(0, 5).map(renderToolCard);
        const toolRow2HTML = toolsData.slice(5).map(renderToolCard);

        return html`
            <style>
                .network-node-link {
                    cursor: pointer;
                    padding: 2px 6px;
                    margin: 0 -6px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    display: block;
                }
                .network-node-link:hover {
                    background-color: var(--color-background);
                    color: var(--color-highlight);
                    transform: translateX(2px);
                }
                .network-node-link:hover .uid-mono {
                    color: var(--color-highlight);
                    font-weight: bold;
                }
            </style>
            <div>
            <div class="header">
                <h1>The Framework as a Network</h1>
            </div>
            <div class="network-horizon-container" id="network-grid">
                <svg id="connection-svg"></svg>
                
                <div class="method-row-container" id="row-top">
                    ${methodRow1HTML}
                </div>
                <div class="method-row-container" id="row-top-2">
                    ${methodRow2HTML}
                </div>

                <div class="tool-row" id="row-middle">
                    ${toolRow1HTML}
                </div>
                
                <div class="tool-row" id="row-bottom">
                    ${toolRow2HTML}
                </div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },

    renderVisualMap: function(frameworkNodes, tools, onboardingData, viewId) {
        if (!frameworkNodes) return html`<h1>Error: Node data is missing.</h1>`;
        const { nodes, themes, pathways } = frameworkNodes;
        const pathwayOptions = Object.entries(pathways).map(([key, pathway]) => html`<option value="${key}">${pathway.name}</option>`);
        const toolCardsHTML = tools.map(tool => html`
            <div class="map-tool-card" style="border-left-color: ${tool.color};">
                <h3>${tool.name}</h3>
                <div class="node-list-container">
                    <ul>${nodes.filter(n => n.parentTool === tool.id).map(node => html`
                        <li class="node-item" data-node-id="${node.id}">
                            <i class="fas ${themes[node.theme].icon} theme-icon" style="color: ${themes[node.theme].color};"></i>
                            <span>${node.name}</span>
                        </li>`)}</ul>
                </div>
            </div>`);
        return html`
            <style>
                .node-item {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                .node-item:hover {
                    background-color: var(--color-background);
                    color: var(--color-highlight);
                    transform: translateX(4px);
                }
                .node-item:hover span {
                    text-decoration: underline;
                }
            </style>
            <div><h1>Visual Map</h1>
            <div class="map-controls"><select id="map-pathway-select"><option value="">Select a Pathway to Visualize...</option>${pathwayOptions}</select></div>
            
            <div class="scroll-wrapper-relative" id="map-scroll-container">
                <button class="scroll-paddle left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
                <div class="map-grid-wrapper">
                    <div class="map-grid"><svg id="map-pathway-svg"></svg>${toolCardsHTML}</div>
                </div>
                <button class="scroll-paddle right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
            </div>

            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },

    renderModalityExplorer: function(data, onboardingData, viewId) {
        if (!data) return html`<h1>Error: Modality data is missing.</h1>`;
        const { title, introduction, modalities } = data;

        const groupIconMap = {
            'Sensory': 'fa-eye',
            'Embodied': 'fa-running',
            'Symbolic': 'fa-font',
            'Cognitive': 'fa-brain',
            'Meta': 'fa-cogs'
        };

        const groups = modalities.reduce((acc, mod) => {
            (acc[mod.group] = acc[mod.group] || []).push(mod);
            return acc;
        }, {});

        const groupsHTML = Object.entries(groups).map(([groupName, mods]) => {
            const groupIcon = groupIconMap[groupName] || 'fa-circle';
            const groupClass = `group-${groupName}`; 

            return html`
                <div class="modality-group-card ${groupClass}">
                    <h3>
                        <i class="fas ${groupIcon}"></i> ${groupName}
                    </h3>
                    <div class="modality-grid">
                        ${mods.map(mod => {
                            const iconData = modalityIconMap[mod.id] || { icon: 'fa-question-circle', groupClass: 'default-icon' };
                            return html`
                                <button class="modality-card" data-modality-id="${mod.id}">
                                    <i class="fas ${iconData.icon} modality-icon"></i>
                                    ${mod.name}
                                </button>
                            `;
                        })}
                    </div>
                </div>
            `;
        });

        return html`
            <style>
                .modality-explorer-container {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    align-items: start;
                }
                .modality-map-area {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .modality-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .modality-card {
                    background-color: var(--color-card); 
                    color: var(--color-text-primary);
                }
                .modality-card:hover {
                    background-color: var(--color-background);
                }
                .modality-details {
                    position: sticky;
                    top: 20px;
                    min-height: 400px;
                    background: var(--color-card);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: var(--shadow-md);
                }
                @media (max-width: 900px) {
                    .modality-explorer-container {
                        grid-template-columns: 1fr;
                    }
                    .modality-details {
                        position: static;
                    }
                }
            </style>
            <div>
                <h1>${title}</h1><p>${introduction}</p>
                <div class="modality-explorer-container">
                    <div class="modality-map-area">${groupsHTML}</div>
                    <div class="modality-details" id="modality-details-pane">
                        <div class="node-details-placeholder" style="text-align: center; color: var(--color-text-secondary); padding-top: 40px;">
                            <i class="fas fa-hand-pointer" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                            Select a modality to view its details.
                        </div>
                    </div>
                </div>
                ${UI.renderOnboarding(onboardingData, viewId)}
            </div>
        `;
    },

    renderGrandSynthesisTable: function(tableData, onboardingData, viewId) {
        if (!tableData) return html`<h1>Error: Synthesis Table data is missing.</h1>`;
        const { title, subtitle, headers, rows } = tableData;

        const keyMap = {
            "tool": "tool",
            "core function": "genotype",
            "domain-specific applications": "phenotypes",
            "dynamics": "dynamics",
            "explanation": "explanation"
        };

        const headerHTML = headers.map(h => html`<th data-col="${h.key}">${h.name}</th>`);
        
        const rowsHTML = rows.map(row => html`
            <tr>
                ${headers.map(h => {
                    const dataKey = keyMap[h.key] || h.key;
                    const content = row[dataKey] || ""; 
                    return html`<td data-col-name="${h.name}" data-col="${h.key}">${unsafeHTML(parseMarkdown(content))}</td>`;
                })}
            </tr>
        `);

        return html`<div><h1>${title}</h1><p>${subtitle}</p>
            <div class="table-wrapper"><table id="synthesis-table"><thead><tr>${headerHTML}</tr></thead><tbody>${rowsHTML}</tbody></table></div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        </div>`;
    },
    
    renderRubricsView: function(rubricsData) {
        if (!rubricsData) return html`<h1>Error: Rubrics data is missing.</h1>`;
        const { title, introduction, families } = rubricsData;
        const familiesHTML = families.map(family => {
            const headersHTML = family.table.headers.map(h => html`<th>${h}</th>`);
            const rowsHTML = family.table.rows.map(row => html`<tr>${row.map((cell, i) => i === 0 ? html`<td><strong>${cell}</strong></td>` : html`<td>${unsafeHTML(parseMarkdown(cell))}</td>`)}</tr>`);
            return html`<div class="rubric-family"><h3>${family.name}</h3><p>${family.description}</p>
                <div class="table-wrapper"><table><thead><tr>${headersHTML}</tr></thead><tbody>${rowsHTML}</tbody></table></div></div>`;
        });
        return html`<div><h1>${title}</h1>${unsafeHTML(parseMarkdown(introduction))}${familiesHTML}</div>`;
    },

    renderGlossaryToolView: function() {
        return html`<div><h1>Dynamic Translation Glossary</h1>
            <p>This tool acts as a "tool for translation" for cross-disciplinary teams. Search for a term from any domain to see its underlying principle and its direct expression in other domains.</p>
            <div class="glossary-tool-container">
                <div class="glossary-search"><input type="search" id="glossary-search-input" placeholder="Search for a term (e.g., 'Peer Review', 'Moodboard')..."></div>
                <div id="glossary-results" class="glossary-results"></div>
            </div>
        </div>`;
    },

    renderBibliographyView: function(bibliographyData) {
        if (!bibliographyData) return html`<h1>Error: Bibliography data is missing.</h1>`;
        const { title, entries } = bibliographyData;
        const sortedEntries = [...entries].sort((a, b) => a.citation.localeCompare(b.citation));
        const entriesHTML = sortedEntries.map(entry => html`<li><p>${unsafeHTML(parseMarkdown(entry.citation))}</p><div class="bibliography-rationale">${unsafeHTML(parseMarkdown(entry.rationale))}</div></li>`);
        return html`<div><h1>${title}</h1><ul>${entriesHTML}</ul></div>`;
    },

    renderAdvancedToolkits: function(data) {
        if (!data) return html`<h1>Advanced Toolkits</h1><p>Data not found.</p>`;
        return html`<div><h1>${data.title}</h1><p>${data.introduction}</p>
            <div class="accordion-item">
                <button class="accordion-header"><span class="accordion-title-group">Pathway Optimization Algorithm</span><i class="fas fa-chevron-down accordion-icon"></i></button>
                <div class="accordion-content"><div class="accordion-content-inner">
                    <p>${data.pathway_optimization_algorithm.title}</p>
                    <ol>${data.pathway_optimization_algorithm.steps.map(s => html`<li><strong>${s.title}:</strong> ${s.action}</li>`)}</ol>
                </div></div>
            </div>
            <div class="accordion-item">
                <button class="accordion-header"><span class="accordion-title-group">Node Generation Algorithm</span><i class="fas fa-chevron-down accordion-icon"></i></button>
                <div class="accordion-content"><div class="accordion-content-inner">
                    <p>${data.generative_algorithm.title}</p>
                    <ol>${data.generative_algorithm.steps.map(s => html`<li><strong>${s.title}:</strong> ${s.action}</li>`)}</ol>
                </div></div>
            </div>
        </div>`;
    },

    renderStrategyView: function(strategyData) {
        if (!strategyData) return html`<h1>Error: Strategy data is missing.</h1>`;
        const { title, introduction, sections } = strategyData;
        const sectionsHTML = sections.map(section => html`
            <div class="accordion-item">
                <button class="accordion-header"><span class="accordion-title-group">${section.title}</span><i class="fas fa-chevron-down accordion-icon"></i></button>
                <div class="accordion-content"><div class="accordion-content-inner">${unsafeHTML(parseMarkdown(section.content))}</div></div>
            </div>`);
        return html`<div><h1>${title}</h1><p>${introduction}</p><div class="accordion-group">${sectionsHTML}</div></div>`;
    },

    renderProtocolView: function(protocolData) {
        if (!protocolData) return html`<h1>Error: Protocol data is missing.</h1>`;
        const directivesHTML = protocolData.core_directives.map(d => html`<li><strong>${d.title}:</strong> ${d.description}</li>`);
        return html`<div><h1>${protocolData.metadata.purpose}</h1><p>${protocolData.preamble}</p>
            <h3>Core Directives</h3><ul>${directivesHTML}</ul>
        </div>`;
    },

    renderSystemsLensAnalysis: function(analysisData) {
        if (!Array.isArray(analysisData) || analysisData.length === 0) {
            return '';
        }

        const componentGroups = {
            'Structural Components': ['Stock', 'Cloud', 'System Boundary'],
            'Control Components': ['Inflow', 'Outflow', 'Auxiliary Variable', 'Information Connector', 'Valve', 'Parameter', 'Goal'],
            'Behavioral Dynamics': ['Feedback Loop', 'Delay']
        };

        const renderComponent = (comp) => {
            const translationsHTML = comp.domainSpecificTranslations && comp.domainSpecificTranslations.length > 0
                ? html`<a href="#" class="domain-translations-toggle" data-action="toggle-translations">Show Domain Translations ?</a>
                   <div class="domain-translations-content">
                       <ul>
                           ${comp.domainSpecificTranslations.map(t => html`<li><strong>${t.domain}:</strong> ${t.expression}</li>`)}
                       </ul>
                   </div>`
                : '';

            return html`
                <div class="systems-component-item">
                    <h5>${comp.componentName}</h5>
                    <p>${unsafeHTML(parseMarkdown(comp.domainAgnosticDescription))}</p>
                    ${translationsHTML}
                </div>
            `;
        };

        const tabsHTML = Object.keys(componentGroups).map((groupName, index) => html`
            <button class="systems-lens-tab ${index === 0 ? 'active' : ''}" data-tab-target="${groupName.replace(/\W/g, '')}">${groupName}</button>
        `);

        const tabContentsHTML = Object.entries(componentGroups).map(([groupName, components], index) => {
            const content = components.map(compName => {
                const compData = analysisData.find(c => c.componentName === compName);
                return compData ? renderComponent(compData) : '';
            });
            return html`<div class="systems-lens-tab-content ${index === 0 ? 'active' : ''}" data-tab-content="${groupName.replace(/\W/g, '')}">${content}</div>`;
        });

        return html`
            <div class="systems-lens-section">
                <button class="systems-lens-toggle" data-action="toggle-systems-lens">
                    <i class="fas fa-sitemap"></i>
                    <span>Systems Thinking Lens</span>
                    <i class="fas fa-chevron-down accordion-icon" style="margin-left: auto;"></i>
                </button>
                <div class="systems-lens-content">
                    <div class="systems-lens-tabs">${tabsHTML}</div>
                    <div class="systems-lens-tab-container">${tabContentsHTML}</div>
                </div>
            </div>
        `;
    },
    renderPathwayExplorer: function(allPathways, tools, bibliography, onboardingData, viewId) {
        if (!allPathways || !Array.isArray(allPathways)) {
            return html`<h1>Error: Pathway data is missing or malformed.</h1>`;
        }
    
        const localParseMarkdown = (text) => (window.marked ? window.marked.parse(text || '', { breaks: true }) : text);
        const localParseMarkdownInline = (text) => (window.marked ? window.marked.parseInline(text || '') : text);
    
        const pathwaysByTool = {};
        tools.forEach(tool => { pathwaysByTool[tool.id] = []; });
    
        allPathways.forEach(pathway => {
            const toolKey = `tool${pathway.tool_id}`;
            if (pathway.tool_id && pathwaysByTool[toolKey]) {
                pathwaysByTool[toolKey].push(pathway);
            }
        });
    
        const uniqueDomains = [...new Set(allPathways.map(p => p.domain).filter(Boolean))].sort();
        const uniqueTypes = [...new Set(allPathways.map(p => p.type).filter(Boolean))].sort();
        const uniqueCategories = [...new Set(allPathways.map(p => p.category).filter(Boolean))].sort();
    
        const domainMap = {
            "Arts & Design": { icon: "fa-palette", color: "var(--domain-arts)" },
            "Business & Agile": { icon: "fa-chart-line", color: "var(--domain-business)" },
            "Culture & Ethics": { icon: "fa-globe-americas", color: "var(--domain-culture)" },
            "General / Pluralist": { icon: "fa-globe", color: "var(--domain-general)" },
            "Pedagogy & Facilitation": { icon: "fa-chalkboard-teacher", color: "var(--domain-pedagogy)" },
            "Science & Engineering": { icon: "fa-flask", color: "var(--domain-science)" },
            "Humanities & Social Sciences": { icon: "fa-landmark", color: "var(--domain-humanities)" },
            "Speculative": { icon: "fa-sparkles", color: "#9b59b6" }     
        };
    
        const renderCitation = (citationData) => {
            if (!citationData || !citationData.citation_text) return '';
            return html`
                <span class="citation-link" tabindex="0" role="button" aria-label="Show citation">
                    <i class="fas fa-book-open"></i>
                    <span class="citation-tooltip">${escapeAttr(citationData.citation_text)}<br><br><strong>Rationale:</strong> ${escapeAttr(citationData.rationale || '')}</span>
                </span>`;
        };
    
        const renderPathwayCard = (pathway, parentToolId) => { 
            const domainInfo = domainMap[pathway.domain] || { icon: 'fa-project-diagram', color: '#ccc' };
            const speculativeTag = pathway.isSpeculative ? html`<span class="speculative-tag">Speculative</span>` : '';
            const categoryTag = pathway.category ? html`<span class="category-tag">${pathway.category}</span>` : '';
            
            const activitySequenceHTML = (pathway.activity_sequence || []).map(s => html`<li>${unsafeHTML(localParseMarkdownInline(s))}</li>`);
            
            const cognitiveSequenceHTML = (pathway.neurocognitive_sequence || []).map(s => {
                if (!s || !s.step) return '';
                const deepLink = `?view=tool&id=${parentToolId}&activePerspective=cognitiveModel`;
                const networksHTML = (Array.isArray(s.networks) ? s.networks : [s.networks]).map(n => html`<code>${n}</code>`);
                return html`
                    <li class="neuro-sequence-item">
                        <a href="${deepLink}" class="step-link" title="View Cognitive Model"><i class="fas fa-external-link-alt"></i> ${s.step}</a>
                        <span class="step-networks">${networksHTML}</span>
                        <span class="step-desc">${s.pfic_word || ''}</span>
                    </li>`;
            });
    
            return html`
                <div class="accordion-item" id="pathway-${pathway.id}" data-id="${pathway.id}" data-domain="${pathway.domain}" data-type="${pathway.type}" data-category="${pathway.category || ''}">
                    <button class="accordion-header">
                        <span class="accordion-title-group">
                            <i class="fas ${domainInfo.icon} domain-icon" style="color: ${domainInfo.color};"></i>
                            ${pathway.title}
                            ${speculativeTag}
                            ${categoryTag}
                        </span>
                        <i class="fas fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-content">
                        <div class="accordion-content-inner">
                            <p class="pathway-summary"><em>${pathway.summary || ''}</em></p>
                            <div class="pathway-details-grid">
                                <div><strong>Rationale:</strong> ${unsafeHTML(localParseMarkdown(pathway.rationale || 'N/A'))}</div>
                            </div>
                            <h4>Activity Sequence ${renderCitation(pathway.activity_citation)}</h4>
                            <ol>${activitySequenceHTML}</ol>
                            <h4>Cognitive Sequence ${renderCitation(pathway.neurocognitive_citation)}</h4>
                            <ol>${cognitiveSequenceHTML}</ol>
                        </div>
                    </div>
                </div>
            `;
        };
    
        const matrixHTML = tools.map(tool => {
            const pathways = pathwaysByTool[tool.id] || [];
            return html`
                <div class="tool-column" id="tool-${tool.id}">
                    <div class="tool-column-header">T${tool.uid.replace('T','')}: ${tool.name}</div>
                    ${pathways.map(p => renderPathwayCard(p, tool.id))}
                </div>
            `;
        });
    
        const categoryFiltersHTML = html`
            <option value="all">All Categories</option>
            ${uniqueCategories.map(cat => html`<option value="${cat}">${cat}</option>`)}
        `;
    
        return html`
            <div class="explorer-container">
                <header class="explorer-header">
                    <h1>Pathway Explorer</h1>
                    <p>Explore all high-probability pathways, which are effective, pre-defined workflows for specific tasks. Use the filters to narrow your search.</p>
                </header>
                <div class="explorer-controls">
                    <div class="control-group search-group">
                        <label for="pathway-search">Search</label>
                        <input type="search" id="pathway-search" placeholder="Search pathways...">
                    </div>
                    <div class="control-group" id="domain-filter-group">
                        <h4 id="selected-domain-name">All Domains</h4>
                        <div class="segmented-control">
                            <button class="filter-btn active" data-domain="all">All</button>
                            ${uniqueDomains.map(domain => {
                                const domainInfo = domainMap[domain] || { icon: 'fa-circle' };
                                return html`<button class="filter-btn" data-domain="${domain}" title="${domain}"><i class="fas ${domainInfo.icon}"></i></button>`;
                            })}
                        </div>
                    </div>
                    <div class="control-group">
                        <label for="category-filter">Category</label>
                        <select id="category-filter">${categoryFiltersHTML}</select>
                    </div>
                    <div class="control-group">
                        <label for="tool-filter">Tool</label>
                        <select id="tool-filter">
                            <option value="all">All Tools</option>
                            ${tools.map(tool => html`<option value="tool-${tool.id}">T${tool.uid.replace('T','')}: ${tool.name}</option>`)}
                        </select>
                    </div>
                </div>
                <div class="scroll-wrapper-relative" id="pathway-scroll-container">
                    <button class="scroll-paddle left" data-direction="left"><i class="fas fa-chevron-left"></i></button>
                    <div class="pathway-matrix-wrapper">
                        <div class="pathway-matrix" id="pathway-matrix">${matrixHTML}</div>
                    </div>
                    <button class="scroll-paddle right" data-direction="right"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            ${UI.renderOnboarding(onboardingData, viewId)}
        `;
    }
};

// --- AUTO-JUMP NAVIGATION LOGIC ---
// This ensures that links like ?view=pathways&expand=123 actually scroll and open
window.addEventListener('hashchange', handlePathwayJump);
window.addEventListener('popstate', handlePathwayJump);

function handlePathwayJump() {
    const params = new URLSearchParams(window.location.search);
    const expandId = params.get('expand');
    if (!expandId) return;

    // Wait for the DOM to finish rendering
    setTimeout(() => {
        const targetCard = document.getElementById('pathway-' + expandId);
        if (targetCard) {
            // 1. Open the accordion
            targetCard.classList.add('active');
            const content = targetCard.querySelector('.accordion-content');
            if (content) {
                content.style.maxHeight = content.scrollHeight + "px";
            }

            // 2. Scroll into view
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 3. Highlight effect
            targetCard.style.outline = "2px solid var(--color-highlight)";
            setTimeout(() => { targetCard.style.outline = "none"; }, 2000);
        }
    }, 300); // Short delay to allow lit-html to finish
}

// Run on initial load in case we landed directly on the URL
handlePathwayJump();