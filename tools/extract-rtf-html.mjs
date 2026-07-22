import fs from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node extract-rtf-html.mjs INPUT OUTPUT");
}

let raw = fs.readFileSync(inputPath, "latin1");

// TextEdit converted every URL and data URI into an RTF hyperlink field.
// Replace the complete field with the original URL before decoding cells.
const fieldMarker = '{\\field{\\*\\fldinst{HYPERLINK "';
let cursor = 0;
while ((cursor = raw.indexOf(fieldMarker, cursor)) !== -1) {
  const urlStart = cursor + fieldMarker.length;
  const urlEnd = raw.indexOf('"}}', urlStart);
  if (urlEnd === -1) throw new Error("Unterminated RTF hyperlink field");

  let depth = 0;
  let escaped = false;
  let fieldEnd = -1;
  for (let i = cursor; i < raw.length; i += 1) {
    const char = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        fieldEnd = i + 1;
        break;
      }
    }
  }
  if (fieldEnd === -1) throw new Error("Unbalanced RTF hyperlink field");

  const url = raw.slice(urlStart, urlEnd);
  raw = raw.slice(0, cursor) + url + raw.slice(fieldEnd);
  cursor += url.length;
}

const cp1252 = new TextDecoder("windows-1252");

function decodeRtfText(value) {
  let result = "";
  let ucSkip = 1;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "{" || char === "}") continue;
    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = value[i + 1];
    if (next === "\\" || next === "{" || next === "}") {
      result += next;
      i += 1;
      continue;
    }
    if (next === "'") {
      const hex = value.slice(i + 2, i + 4);
      result += cp1252.decode(Uint8Array.of(Number.parseInt(hex, 16)));
      i += 3;
      continue;
    }

    const match = value.slice(i).match(/^\\([a-zA-Z]+)(-?\d+)? ?/);
    if (!match) continue;
    const [, word, numberText] = match;
    i += match[0].length - 1;

    if (word === "uc" && numberText !== undefined) {
      ucSkip = Number.parseInt(numberText, 10);
      continue;
    }
    if (word === "u" && numberText !== undefined) {
      let codePoint = Number.parseInt(numberText, 10);
      if (codePoint < 0) codePoint += 65536;
      result += String.fromCharCode(codePoint);
      i += ucSkip;
    }
  }

  return result;
}

const rows = raw.split(/\\cell \\(?:lastrow\\)?row/);
const htmlLines = [];
let inHtml = false;

for (const row of rows) {
  const marker = row.lastIndexOf("\\cf0 ");
  if (marker === -1) continue;
  const text = decodeRtfText(row.slice(marker + 5)).trimEnd();
  if (!inHtml && text.includes("<!DOCTYPE html>")) inHtml = true;
  if (!inHtml) continue;
  htmlLines.push(text);
  if (text.includes("</html>")) break;
}

const html = htmlLines.join("\n").replace(/^\s+(?=<!DOCTYPE html>)/, "");
if (!html.startsWith("<!DOCTYPE html>") || !html.includes("</html>")) {
  throw new Error("Could not recover a complete HTML document");
}

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Recovered ${htmlLines.length} HTML lines (${html.length} chars)`);
