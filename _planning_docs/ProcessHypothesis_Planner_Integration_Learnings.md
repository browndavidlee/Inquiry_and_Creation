# Playbook: The Prototype Graduation Process

**Derived from:** The Project "Integration" (Planner v2.0) Retrospective

### 1. Core Principle: Socio-Technical Symmetry

**Synthesis:** A project's success is maximized when its social structure (team roles, communication), technical architecture (code), and content architecture (data) are all designed to reflect the same underlying logic. This project succeeded because we first aligned our technical architecture (v22.0) and then built a feature whose data schema, component API, and team workflow were all in symmetrical alignment.

### 2. Key Plays & Learnings

**Play 1: "The Schema-First Contract"**

*   **When to Use:** At the start of any project with a complex data-UI interface.
*   **The Play:**
    1.  **Co-design the Schema:** Before any content or UI work begins, the Content, Engineering, and Design guilds must collaborate to create and lock a formal data schema.
    2.  **Make it the Contract:** This schema becomes the official "API Contract."
    3.  **Validate, Don't Assume:** Provide a validation script. The content is not "done" until it passes the script.
*   **Learning:** This was the single most effective play for preventing cross-guild friction and rework. It front-loaded all ambiguity into a single workshop, providing clarity for the entire project.

**Play 2: "The Philosophical Guardrail"**

*   **When to Use:** For any project that has a core philosophical or ethical dimension.
*   **The Play:**
    1.  **Identify the Principle:** In Tool 1, identify the core philosophical principle at stake (e.g., "Pluralistic Parity").
    2.  **Make it an OKR:** In Tool 2, translate this abstract principle into a concrete, measurable Key Result with a named owner (e.g., "The Framework Theorist must give a formal 'pass'").
    3.  **Validate in T8:** Treat this KR with the same seriousness as a technical or business metric in the final Go/No-Go review.
*   **Learning:** This transformed our values from a vague statement of intent into a non-negotiable success criterion, ensuring our "why" was not lost in the "how."

**Play 3: "The Paired Integration"**

*   **When to Use:** When a project involves a critical handoff between specialist guilds (e.g., Design Systems to Engineering).
*   **The Play:**
    1.  **Identify the Interface:** In T2, identify the specific point of integration (e.g., using the new component).
    2.  **Mandate the Pair:** Make a "pair programming" or "pair design" session a formal task in the sprint backlog for the receiving engineer.
    3.  **Execute:** The specialist who built the component must sit with the engineer who is implementing it to guide the initial integration.
*   **Learning:** This was far more effective than documentation alone. It transferred tacit knowledge, built relationships, and resolved ambiguities in minutes instead of days.

### 3. New Questions for the Next Cycle (v3.0)

The success of this project has validated our foundation and surfaced the key strategic questions for our v3.0 "Tutor UX" vision:

*   **The Micro-Frontend Question:** What is the smallest, lowest-risk *real* Micro-Frontend we can build first to prove out the technology and our workflow? (Candidate: The Node Explorer).
*   **The Content Architecture Question:** How do we plan a phased, non-disruptive migration from our flat-file JSON system to the Graph Database architecture prototyped in the "Headless Planner" spike?
*   **The "Tutor UX" Question:** What is the first, highest-leverage "slice" of the "Tutor-like UX" vision we can build on our new, stable foundation?