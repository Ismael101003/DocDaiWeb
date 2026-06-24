# Project Guidelines: DocDaiWeb

Use this workspace as a medical-document processing monorepo. Keep changes aligned with the architecture and the project documentation in `Readme.md`.

## 🌍 Global Working Rules
- **Boundaries:** Respect the backend layer boundaries under `apps/backend/src/`: `domain/`, `application/`, `adapters/`, and `infrastructure/`. Keep business rules out of adapters and infrastructure. Move outward only through explicit interfaces.
- **Scope & Style:** Prefer the smallest change that fits the local code style. Backend work should usually start from the owning use case or domain object, not from infrastructure. 
- **Data & Privacy:** Treat patient and clinical data as highly sensitive. Prefer privacy-preserving changes and avoid weakening compliance-related behavior.
- **Human-in-the-Loop:** Preserve the human validation step for OCR and document review flows. Do not auto-approve uncertain extractions.

## 🎯 Skills Registry
**ALWAYS** identify the impacted area and **silently read** the corresponding skill file before proposing solutions or writing code:

- **Frontend Visual Design (UX/UI):** 👉 Read `.agents/skills/frontend-design/SKILL.md`

*(Agent note: Use additional skills only when the task explicitly matches their scope. Keep documentation links short and avoid duplicating content that already lives in the README or skill files).*

## 🔍 Repo Discovery & Execution
1. **Explore first:** Check the relevant app directory before making changes (`apps/backend/` or `apps/frontend/`).
2. **Verify tools:** Do not assume build or test commands exist until you verify the checked-in manifests or docs. This repo currently has no top-level package, Python, or compose manifest to rely on.
3. **Link, don't copy:** If the repo gains more concrete setup docs later, link to them here instead of copying their content.

## ✅ Quality and Validation Checklist
Ensure to autonomously verify the following points before concluding the task or requesting a review:
- [ ] The change is strictly limited to the requested scope.
- [ ] Backend boundaries (Domain/Application/Adapters/Infrastructure) have been strictly respected.
- [ ] Patient and clinical data privacy has not been compromised.
- [ ] Human-in-the-loop validation for OCR remains intact (no auto-approvals).
- [ ] The appropriate frontend design skill was consulted for UI work, preserving the existing design language.
¿Por qué esta versión es superior?