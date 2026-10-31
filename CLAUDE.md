# Creative Sample Studio — Claude project instructions

## Source of truth

This GitHub repository is the source of truth for CSS landing pages. Do not create a separate long-lived copy in Drive, Downloads, or another repository.

## Safe workflow

- Never commit directly to `main`.
- Create a branch named `smm/<short-page-slug>`.
- Put every public landing page in `public/<slug>/index.html`.
- Open a pull request and wait for Katya to review and merge it.
- Treat every pull request as production-ready: a merge to `main` may publish through Cloudflare Pages.
- A merged folder `public/<slug>/` is expected at `https://creativesamplestudio.pages.dev/<slug>/`.

## Protected areas

Unless Katya explicitly asks for a backend change, do not edit:

- `functions/`
- `integrations/`
- `wrangler.toml`
- `public/_headers`
- `public/_redirects`
- existing registration or lead-handling code

Never add API keys, passwords, Cloudflare tokens, Google credentials, lead lists, phone numbers, email exports, or other personal data to GitHub or Claude prompts.

## Project skills

Use these project skills for landing work:

1. `/find-css-materials` — locate the correct references and approved source files.
2. `/css-brand` — apply visual identity, typography, voice, and brand constraints.
3. `/prepare-css-assets` — prepare selected images, video, and downloads for production.
4. `/create-css-landing` — implement a new page safely.
5. `/review-css-landing` — run pre-PR design, privacy, and production QA.

Project skills live in `.claude/skills/` and travel with the repository. Private Drive links do not belong in this public repository; use the separate material map shared with the SMM.

## Content and design rules

- Default public language is English unless the brief says otherwise.
- Keep the CSS voice clear, expert, calm, and specific. Avoid hype, inflated claims, and generic AI copy.
- Reuse approved assets already stored in the repository when possible.
- Do not hotlink Drive files or random images.
- Do not add licensed fonts/assets without approval.
- There is no approved standalone logo file in the repository. Use the existing typographic wordmark or request an approved file.
- Never invent dates, prices, guarantees, speakers, testimonials, results, or legal consent.
- If event timing is not approved, write “Date to be confirmed” rather than guessing.
- A phone field does not imply consent to WhatsApp. Add a separate, explicit consent if WhatsApp contact is required.

## Technical baseline

- Keep landing pages static and lightweight unless the brief requires otherwise.
- Prefer semantic HTML, local CSS, and minimal JavaScript.
- Preserve existing live pages unless the task explicitly names them.
- Do not introduce a framework for a single landing page.
- Keep mobile performance and accessibility in scope from the first draft.

## Required QA before opening a pull request

- Test at approximately 390 px and 1440 px widths.
- Confirm there is no horizontal overflow.
- Check navigation, buttons, anchors, forms, and error/success states.
- Check keyboard focus, labels, alt text, color contrast, and reduced-motion behavior.
- Confirm the final URL slug and page title.
- Confirm no secrets, personal data, debug output, or internal notes are present.
- Confirm the consent copy matches the channels actually used.
- Confirm production assets load without private Drive access.
- Summarize changed files and include desktop/mobile screenshots in the pull request when possible.
