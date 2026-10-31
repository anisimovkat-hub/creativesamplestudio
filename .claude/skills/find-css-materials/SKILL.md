---
name: find-css-materials
description: Find the correct Creative Sample Studio source files, page references, copy, and approved visual materials without exposing internal data.
---

# Find CSS materials

Use this skill before asking for new images, copying an old page, or searching the web for brand materials.

## Source order

Use sources in this order:

1. The current task brief and files explicitly approved by Katya.
2. Existing files in the target landing folder.
3. Approved reusable files already in this repository.
4. The private “CSS — бренд и создание лендингов в Claude” material map shared with the SMM.
5. A direct question to Katya if the required item is still missing.

Do not replace a missing approved asset with a random stock image, generated logo, invented testimonial, or old campaign copy.

## Repository map

### Live page references

- `public/webinar/index.html` — full event landing reference.
- `public/discovery-call/index.html` — compact service landing reference.
- `public/market-analysis/` — internal analysis page, not a design template and not public campaign copy.

### Reusable visual files already in GitHub

- `public/webinar/assets/image-01.jpg`
- `public/webinar/assets/image-02.jpg`
- `public/webinar/assets/image-03.jpg`
- `public/webinar/assets/image-04.jpg`
- `public/webinar/assets/image-05.jpg`
- `public/webinar/assets/image-06.jpg`
- `public/webinar/assets/image-07.jpg`

Inspect the actual image before reuse. Do not infer its subject from the filename.

### Brand and workflow references

- `CLAUDE.md`
- `.claude/skills/css-brand/SKILL.md`
- `docs/SMM_CLAUDE_ONBOARDING.md`
- `docs/CLAUDE_WEB_SETUP.md`

## Logo rule

There is no approved standalone logo file in the current repository. Existing pages use a typographic CSS wordmark.

Do not generate, redraw, or invent a logo. Use the existing wordmark treatment or request an approved SVG/PNG from Katya.

## Private Drive materials

The private material map shared with the SMM contains links to approved team photography, working-process videos, meeting visuals, and SMM context documents.

- Never copy the private Drive links into this public repository.
- Open only the item needed for the current page.
- Download a working copy and place the final optimized asset inside the new landing folder.
- Do not hotlink a Google Drive file in production HTML.
- Do not upload the whole Drive folder to Claude.

## Never use without explicit approval

- webinar leads or attendance tables;
- contact forms or consultation responses;
- advertising reports, media plans, or billing files;
- personal phone numbers or email addresses;
- client lists;
- credentials, scripts, tokens, or integration settings;
- internal research as public copy;
- files whose licensing or approval is unclear.

## Missing-material response

When something is missing, return a short list with:

- exact item needed;
- where it will appear;
- preferred format and dimensions;
- whether a temporary neutral placeholder is safe.

Do not silently improvise a brand-critical asset.
