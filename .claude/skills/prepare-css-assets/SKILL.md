---
name: prepare-css-assets
description: Prepare approved Creative Sample Studio images, video, PDFs, and other files for a new landing page and Claude workflow.
---

# Prepare CSS assets

Use this skill after `/find-css-materials` and before final page QA.

## Select only what the page needs

For each asset, confirm:

- it is approved for this campaign;
- its subject matches the section;
- the license or ownership is clear;
- it contains no private or confidential information;
- a smaller existing file would not serve equally well.

Do not upload an entire photo or video library to Claude. Give Claude the brief plus the selected files only.

## Landing folder structure

Store page-specific files beside the page:

```
public/<slug>/
  index.html
  assets/
    hero.webp
    team-01.webp
    process-01.webp
    guide.pdf
```

Use descriptive lowercase filenames with hyphens. Do not keep names such as `final-final-2.jpg`, camera filenames, or spaces.

## Images

- Keep the original crop outside the repository if it is large; commit only the production version.
- Prefer WebP or an appropriately compressed JPEG for photography.
- Use PNG or SVG only when transparency or vector detail is required.
- Set explicit width and height where practical.
- Use responsive sizing and meaningful alt text.
- Do not upscale a visibly small image.
- Preserve natural skin tones unless the design intentionally uses the approved grayscale treatment.

## Video

- Use video only when it adds meaning.
- Avoid committing large raw MOV files.
- Ask Katya before adding a heavy background video or external video host.
- Provide a poster image and respect reduced-motion preferences.
- Do not autoplay with sound.

## PDFs and downloads

- Use the approved final file only.
- Give it a clear public filename.
- Verify the link and download behavior.
- Do not expose internal drafts, comments, version history, or editable source files.

## Moving a selected Drive file into the page

1. Download the approved file from the private material map.
2. Inspect it before use.
3. Rename and optimize the working copy.
4. Put it in `public/<slug>/assets/`.
5. Reference it with a relative path such as `assets/hero.webp`.
6. Confirm the asset loads locally.
7. Include it in the pull request.

Never use a temporary local path, a Drive preview URL, or a private signed link in production code.

## What to give Claude

For Claude Code:

- keep the selected files inside the working branch;
- tell Claude the intended role of each asset;
- ask it not to substitute or generate alternatives.

For a Claude.ai Project:

- upload the project instruction files first;
- attach only the selected page assets;
- state the intended final repository paths;
- manually move Claude’s output into the GitHub branch and review the diff.

## Final asset check

- no unused files;
- no duplicates;
- no raw camera/video dumps;
- no secrets or personal data;
- filenames and alt text are clear;
- the page still loads without Drive access;
- mobile image weight and crop are acceptable.
