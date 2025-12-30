# CONTRIBUTING.md: Contributing to The Inquiry and Creation Framework

Thank you for your interest in contributing to The Inquiry and Creation Framework. This project is a **synthesis** of established methodologies (Systems Thinking, Agile, CBT, etc.) and relies on clear intellectual property boundaries.

By contributing, you help ensure the framework remains a high-quality, open-source resource for metacognitive problem-solving.

---

## 1. Legal & Intellectual Property Agreement

By submitting a Pull Request (PR), you agree to the following terms:

### A. License Affirmation

You agree that your contributions will be licensed under the project's **MIT License**.

### B. Contributor Warranties

You represent and warrant that:
1.  Your contribution is **original work** created by you.
2.  You have the **full right and authority** to submit the contribution under the MIT License.
3.  Your contribution does **not infringe** upon any third party's intellectual property rights (patents, copyrights, trademarks, etc.).

### C. Acknowledgment of Referenced Frameworks (IP Mitigation)

This framework explicitly references and synthesizes concepts from established methodologies (e.g., Scrum, Lean, Cynefin, Toulmin Model, etc.).

*   **We do not claim ownership** over the original source material, trademarks, or core principles of these external frameworks.
*   **Your contribution must similarly be an original synthesis or application.** If you introduce a new node based on an external framework (e.g., a new TRIZ principle), your contribution must focus on the **unique application, integration, or analysis** of that principle within the context of this framework's existing structure.

---

## 2. How to Contribute

We welcome contributions in the form of new **Nodes**, **Pathways**, or **Systems Thinking Analysis** entries.

### A. Submitting a New Node

A new Node must meet the following criteria to be considered:

1.  **Clarity of Action:** It must be a single, discrete, and actionable step (e.g., "Run a Pre-Mortem Exercise," not "Plan the Project").
2.  **Cross-Disciplinary Relevance:** It should be relevant to at least two of the core domains (Science, Business, Humanities, Arts, Culture, Pedagogy).
3.  **Systems Thinking Analysis (Mandatory):** You must provide a complete `systemsThinkingAnalysis` entry, defining how the node affects the system's **Stock, Inflow, Outflow, and Feedback Loop**. This is the core value-add of the contribution.

### B. Contribution Workflow

1.  **Fork** the repository.
2.  **Create a new branch** for your feature (e.g., `git checkout -b feature/new-node-name`).
3.  **Add your new entry** to the appropriate JSON file (`nodes.json` or a new `concepts_tool_X.json`).
4.  **Run a self-review** to ensure all required fields are complete and your contribution adheres to the licensing terms.
5.  **Submit a Pull Request (PR)** to the `main` branch. In the PR description, clearly state the **Problem** your new node solves and the **Leverage Point** it targets.

---

## 3. Style Guide

*   **Tone:** Professional, clear, and concise.
*   **Naming:** Use `kebab-case` for all `id` and `uid` fields (e.g., `new-node-name`).
*   **Language:** All descriptions must be written in the third person, present tense.