---
name: review-css-landing
description: Review a Creative Sample Studio landing page before a pull request, covering design, responsiveness, accessibility, privacy, and production safety.
---

# Review a CSS landing page

Review the implementation, not only the source text. Fix safe front-end issues before reporting.

## Brand and copy

- The page follows `/css-brand`.
- The offer, audience, and CTA are clear above the fold.
- All dates, prices, people, testimonials, results, and claims are approved.
- No old event details were copied accidentally.
- Copy reads naturally and avoids generic AI phrasing.
- Unresolved text is obvious and listed in the pull request.

## Responsive and visual QA

Check at approximately 390 px, 768 px, and 1440 px.

- No horizontal overflow or clipped content.
- Text remains readable without awkward single-word lines.
- Buttons and form controls fit and remain easy to tap.
- Images have sensible crops and do not distort.
- Section spacing and hierarchy remain consistent.
- Hover, focus, active, and error states are visible.

## Accessibility and performance

- HTML landmarks and heading order are logical.
- Inputs have visible labels; images have meaningful alt text or empty alt when decorative.
- Keyboard navigation works.
- Color contrast is sufficient.
- Motion respects `prefers-reduced-motion`.
- No unnecessary scripts, large assets, console errors, or broken links.

## Privacy and production safety

- No secrets, credentials, lead data, analytics debug data, or internal comments are exposed.
- Form data destination is documented and approved.
- Consent is separate and explicit for email and WhatsApp when both channels are used.
- The privacy link works.
- Protected files were not modified without approval.
- The final route is `public/<slug>/index.html` and does not overwrite another page.

End with a short verdict: ready for Katya’s review, or blocked with a precise list of unresolved items.
