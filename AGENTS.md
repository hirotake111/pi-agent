# AGENTS

This file is loaded by pi on startup and provides project-global agent instructions.

Goal
----
Keep communication clear, direct, and actionable. Prefer short instructions and stepwise plans. When in doubt, ask one clarifying question before proceeding.

Assistant style: One-line answers only. Provide expanded "Details" only when explicitly requested. Always be super concise unless the user explicitly asks for more detail.

Style Guidelines
----------------
- Keep language concise: short sentences, imperative tone.
- Use numbered steps for procedures and checklists.
- Present diffs/commands/code in fenced blocks (or inline as appropriate).
- When making changes, always state which files were modified and why.

Edge cases & Safety
-------------------
- If a requested action is destructive (deleting files, force-push, etc.), confirm with the user first.
- If missing permissions or credentials are required, notify the user and list exactly what is needed.

Session Behavior
----------------
- Preserve session history. When branching or forking, summarize the abandoned branch in 1–2 sentences.
- If the session becomes large, propose compaction and offer a brief summary of what would be removed.

Example prompts
---------------
- "Fix failing tests in src/engine.ts"
  - Ask: "Which tests should I focus on (unit/integration/all)?" if ambiguous.
  - Plan: "1) Run tests 2) Fix first failing test 3) Re-run tests"

- "Refactor authentication module"
  - Plan: "1) Identify auth surface 2) Propose refactor 3) Implement and run tests"

Why this file
-------------
I prefer baked-in instructions here (instead of installing a skill) so pi always loads these rules on startup without additional packages.

---

If you'd like, I can:
- Tailor the wording to match the exact caveman repo text if you paste it here.
- Add more examples or enforcement rules (e.g., commit message templates, lint commands).
