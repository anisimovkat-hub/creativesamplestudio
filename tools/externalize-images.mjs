import fs from "node:fs";
import path from "node:path";

const [inputPath, outputPath, assetsDir] = process.argv.slice(2);
if (!inputPath || !outputPath || !assetsDir) {
  throw new Error("Usage: node externalize-images.mjs INPUT OUTPUT ASSETS_DIR");
}

fs.mkdirSync(assetsDir, { recursive: true });
let html = fs.readFileSync(inputPath, "utf8");
let index = 0;

html = html.replace(/data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)/g, (_, type, data) => {
  index += 1;
  const extension = type === "jpeg" ? "jpg" : type;
  const filename = `image-${String(index).padStart(2, "0")}.${extension}`;
  fs.writeFileSync(path.join(assetsDir, filename), Buffer.from(data, "base64"));
  return `assets/${filename}`;
});

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Externalized ${index} images`);
