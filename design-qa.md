# Desktop hero two-column layout — design QA

- Source visual truth: `/var/folders/q_/sn0glqyj0zb8fnvz7dxlsm280000gn/T/TemporaryItems/NSIRD_screencaptureui_xosF7D/Снимок экрана — 2026-07-23 в 08.47.00.png`
- Implementation screenshot: `/private/tmp/css-webinar-desktop-two-column-hero-wide.jpg`
- Side-by-side comparison: `/private/tmp/css-webinar-desktop-hero-comparison.jpg`
- Browser-rendered route: `http://localhost:4173/webinar/`
- Desktop viewport: 1900 × 1050 CSS px, device scale factor 1
- Mobile verification viewport: 390 × 844 CSS px, device scale factor 1
- Source pixels: 2940 × 1912; browser chrome removed and page area normalized to 950 × 527
- Implementation pixels: 1900 × 1050; normalized to 950 × 525
- State: landing page initial view, registration modal closed

## Full-view comparison evidence

The source shows the desktop hero text centred in a wide blue field and the first production image in a separate full-width block underneath. The requested implementation intentionally changes that structure: the hero now uses two equal desktop columns with all text on the left and the same production image on the right. The separate image block is hidden on desktop.

The header, blue background, content, CTA hierarchy and existing brand styling are preserved. The page has no horizontal overflow.

## Focused region comparison evidence

The hero is the only changed region, and its text and image remain fully legible in the normalized side-by-side comparison. The image uses the supplied `image-01.jpg` asset with a consistent monochrome treatment and fills the right column without distortion.

## Required fidelity surfaces

- Fonts and typography: Existing type families, weights, uppercase treatment, line heights and hierarchy are unchanged. The responsive heading scale prevents overflow in the narrower text column.
- Spacing and layout rhythm: Desktop uses two equal 514 px columns inside the existing 1140 px wrapper with a 64 px gap. Text and image align at the top and share a 731 px content height.
- Colors and visual tokens: The existing navy, cream, white and muted heading accent remain unchanged.
- Image quality and asset fidelity: The original 1400 × 787 production photograph is reused directly, rendered in grayscale and cropped with `object-fit: cover`; no placeholder or generated replacement is used.
- Copy and content: Hero copy, webinar metadata, CTA and registration bonus copy are unchanged.

## Responsive verification

- At 1900 px and 1440 px, the text occupies the left half and the photograph occupies the right half.
- At 390 px, the desktop image is hidden and the same photograph appears immediately after the hero as the next mobile block.
- At 390 px, the page scroll width equals the viewport width.
- The new optional `Your position` form field is present with its intended placeholder.

## Findings

No actionable P0, P1 or P2 issues remain.

## Comparison history

- Source state: centred desktop copy with a separate full-width image below.
- Implemented change: two-column desktop hero and preserved mobile image order.
- Post-fix evidence: desktop and mobile DOM geometry verified, normalized comparison reviewed, and no console errors detected.

## Interaction checks

- Header and hero registration buttons remain present.
- Registration modal markup and fields remain intact.
- Browser console errors checked: none.

## Follow-up polish

No P3 changes are required for this scoped update.

final result: passed
