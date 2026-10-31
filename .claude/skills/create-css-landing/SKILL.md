---
name: create-css-landing
description: Create a new Creative Sample Studio landing page safely, from brief to pull request.
---

# Create a CSS landing page

Use this skill when the task is to add a new public landing page.

## 1. Confirm the brief

Before coding, identify:

- page goal and target audience;
- desired slug;
- approved language and final copy;
- CTA and destination;
- form fields, data destination, and consent requirements;
- approved images and logos;
- event date, price, speaker, proof, and legal copy, if applicable.

If a material fact is missing, leave a clearly worded content placeholder or ask Katya. Never invent it.

## 2. Start safely

- Update from `main`.
- Create a branch named `smm/<slug>`.
- Create `public/<slug>/index.html`.
- Do not change an existing route unless the brief explicitly requires it.
- Do not edit backend, integrations, redirects, headers, or deployment configuration without approval.

## 3. Build in the CSS system

- Apply `/css-brand`.
- Reuse local assets and existing patterns where appropriate.
- Keep the page self-contained, responsive, fast, and easy to review.
- Use semantic HTML and accessible form controls.
- Keep JavaScript minimal and avoid unnecessary dependencies.

## 4. Handle forms and consent correctly

A new form is not automatically connected to the existing registration system.

- Do not copy a live endpoint blindly.
- Describe what each field is used for.
- Marketing email consent and WhatsApp consent are different permissions.
- Do not imply WhatsApp contact from a phone-number field alone.
- Do not collect more data than the brief requires.
- Do not put test leads or real personal data in the repository.

If the page needs a working backend, flag it in the pull request for Katya.

## 5. Review and deliver

Run `/review-css-landing`, then open a pull request to `main`.

The pull request must include:

- final page URL after merge;
- what the landing is for;
- changed files;
- desktop and mobile screenshots when possible;
- whether the page has a form and where data goes;
- any unresolved copy, legal, tracking, or backend questions.

Do not merge your own pull request unless Katya explicitly asks.
