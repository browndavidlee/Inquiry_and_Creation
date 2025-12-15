# Strategic Roadmap & Decisions for v22.0 (Project "Consolidation")

**TO:** All Hands
**FROM:** Head of Product & Strategy
**DATE:** [Simulation End Date]
**SUBJECT:** Final Report on "Scaffold Self-Audit" & The v22.0 Roadmap

## 1. Executive Summary

The "Scaffold Self-Audit v21.0" project is complete and has been an unqualified success. It has validated our core organizational model and provided a clear, unified direction. The audit confirmed that while our intellectual and product foundations are strong, we have accumulated significant technical and structural debt.

Therefore, as decided in the T9 Review and with the full backing of the Chief Architect, the **v22.0 project cycle will be a dedicated "Consolidation Cycle."** Our primary objective is to invest in our core platform to increase velocity, improve stability, and prepare for our ambitious v3.0 vision. This document outlines the decisions made in response to the audit's findings and defines the actionable roadmap for v22.0.

## 2. Answers to Open Questions & Resulting Decisions

All open questions raised during the audit have been reviewed by leadership. The following are the official answers and the decisions that stem from them:

*   **On Philosophical Integration:** The self-critique in `playbooks_and_reports.json` will remain separate to serve as "advanced content," preventing cognitive overload for new users. We will, however, explore contextually linking to it (Decision 1.C). We will also formalize the content strategy to produce one new critical analysis annually.
*   **On Architectural Strategy:** The `planning.html` anomaly will be formally integrated as a micro-frontend in the v3.0 vision. The long-term product vision for v3.0 is centered on **Semantic Search** and a personalized **"Tutor-like" UX**, which validates the need for the v3.0 research spikes into a new data architecture.
*   **On Technical Implementation:** For v22.0, we will use **CSS Modules** for styling (lower risk, zero runtime overhead) and a **build-step hydration process** for the centralized bibliography (maintaining client-side performance).
*   **On Workflow & Governance:** Changes to the `Conway's Law Applied.html` blueprint will now require a formal proposal and sign-off from the Chief Architect and all Guild Leads. A formal "Citation Request" workflow will be implemented, with the Research Lead as the approver.

## 3. Compiled Suggestions & The v22.0 Roadmap

The following initiatives constitute the complete roadmap for the v22.0 Consolidation Cycle.

---

### Initiative 1: Content Platform & Data Integrity
#### Goal:
Establish a single source of truth for all framework content, eliminating inconsistencies and making the content platform robust and scalable.
#### Compiled Suggestions & Actions:
1.  **Define Canonical Schemas:** (From Framework Eng.) A formal JSON Schema will be created for all content types (`Tool`, `Node`, `Pathway`, etc.).
2.  **Centralize Bibliography:** (From Research Lead) The `reference.json` file will become the sole source of truth for citations. All `source` fields in other files will be replaced with a `citation_id`.
3.  **Improve Content Discoverability:** (From Managing Editor) The squad will implement one "Content API" proof-of-concept, pulling a quote from a report into a relevant tool's description.
4.  **Automate Data Loading:** (From Framework Eng.) The `dataLoader.js` file will be refactored to use a dynamic `manifest.json` file, decoupling the Content and Platform guilds.

---

### Initiative 2: Design System & UX Cohesion
#### Goal:
Formalize our design system to improve visual consistency, developer velocity, and the overall quality of the user experience.
#### Compiled Suggestions & Actions:
1.  **Implement Scoped Styling:** (From Design Systems Eng.) All global CSS in `index.html` will be migrated to **CSS Modules**.
2.  **Implement Design Tokens:** (From Design Systems Eng.) All hardcoded style values will be replaced with CSS custom properties (design tokens) to standardize theming.
3.  **Create Core Component Library:** (From Design Systems Eng.) A Storybook will be created to document a new, unified `<ActionCard>` component, replacing all inconsistent card-like elements.
4.  **Enhance Visualizations:** (From Data Viz Specialist) The `visuals.js` file will be updated to add **directionality (arrowheads)** to all pathway lines, as the primary "job" for v22.0 is orientation.

---

### Initiative 3: Codebase Health & Modularity
#### Goal:
Refactor the monolithic front-end to improve maintainability and reduce cognitive load for the engineering team.
#### Compiled Suggestions & Actions:
1.  **Modularize `app.js`:** (From Software Eng.) The `app.js` file will be broken into smaller, feature-specific modules as prioritized by the Engineering Manager.
2.  **Introduce Lightweight State Management:** (From Software Eng.) A minimal global state manager (Zustand) will be implemented to manage UI state like `currentStance` and `simpleMode`.
3.  **Adopt a Templating Engine:** (From Software Eng.) Manual HTML string generation in `uiComponents.js` will be refactored to use `lit-html` for more efficient and secure DOM updates.

---

## 4. Long-Term Vision (v3.0) & Parallel Research

The following research spikes will be conducted during v22.0 to prepare for our next major architectural evolution.

*   **Research Spike A: Micro-Frontends Architecture:** (Owner: Senior Staff Engineer)
*   **Research Spike B: Headless Content Architecture (CMS/Graph DB):** (Owner: Data Engineer)
*   **Research Spike C: The "Tutor" UX Vision:** (Owner: Head of Design)

## 5. Workflow Management & Next Steps

*   **Blueprint Update:** The Chief Architect will issue `Conway's Law Applied.html v2.1` incorporating the decided amendments.
*   **Squad Formation:** The Guild Leads will now form the Initiative Squads for the three primary v22.0 initiatives.
*   **Backlog Creation:** These squads will proceed to T5 (Structure) to create detailed sprint backlogs based on the deliverables outlined in this document.

This Consolidation Cycle is a critical investment in our future. By strengthening our foundation, we empower ourselves to build a more dynamic, intelligent, and truly helpful framework. The work begins now.