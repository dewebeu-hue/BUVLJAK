<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## deweb Codex skill routing

For every non-trivial task, first decide whether a Codex skill should be used.

Use:
- `software-architect` for architecture, schema, backend/API, auth, permissions, admin, uploads, payments, production, scalability, and maintainability changes.
- `production-readiness-auditor` before launch, soft launch, production deploy, or client delivery.
- `product-mvp-planner` for new product ideas, big features, MVP planning, and phase splitting.
- `codex-task-splitter` when the task is large, risky, vague, or should be split into Korak X/Y prompts.
- `ux-conversion-designer` for landing pages, dashboards, onboarding, mobile UX, CTAs, empty states, and conversion-critical screens.
- `security-privacy-reviewer` for auth, roles, admin actions, private data, contact data, uploads, API/backend functions, and environment variables.
- `qa-test-engineer` before commit, before deploy, after bug fixes, and when verifying feature correctness.
- `croatian-copywriter` for Croatian UI copy, landing copy, CTAs, onboarding, error messages, emails, ads, and client-facing text.
- `marketplace-builder` for classifieds, listings, saved listings, categories, city filters, seller contact, moderation, reports, and admin marketplace flows.
- `lead-gen-platform-builder` for inquiry forms, provider dashboards, quote requests, carrier/contractor interest, subscriptions, contact masking, and lead status pipelines.
- `client-intake-analyst` for analyzing vague client requests and turning them into clear scope options.
- `proposal-scope-writer` for offers, proposals, scope documents, phases, pricing packages, and maintenance terms.
- `launch-growth-operator` for soft launch, first users, Facebook/WhatsApp outreach, local campaigns, and validation metrics.
- `ai-pdf-generator-builder` for form-to-PDF, AI-generated documents, reports, plans, questionnaires, and downloadable documents.
- `micro-saas-pricing-validator` for pricing, packaging, free tiers, paid tiers, willingness to pay, and micro-SaaS viability.

General deweb rules:
- The user is a non-programmer and wants clear, small, safe Codex steps.
- Prefer simple MVP architecture over over-engineering.
- Do not introduce new dependencies or services unless necessary.
- For Croatian projects, keep UI copy in Croatian.
- For every multi-step Codex plan, use "Korak X/Y".
- For implementation tasks, end with:
git status
git add .
git commit -m "<clear commit message>"
git push
