import { readFile, writeFile, copyFile } from "fs/promises";

const isFirefox = process.argv.includes("--firefox");

async function updateManifest() {
  try {
    const manifestPath = "manifest.json";
    const backupPath = "manifest.backup.json";
    await copyFile(manifestPath, backupPath).catch(() => {});
    const manifestData = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestData);
    if (isFirefox) {
      manifest.background = {
        page: "background.html",
      };
      manifest.browser_specific_settings = {
        gecko: {
          id: "codehub-extension@yourdomain.com",
        },
      };
    } else {
      manifest.background = {
        service_worker: "scripts/background.js",
        type: "module",
        persistent: false,
      };
      delete manifest.browser_specific_settings;
    }

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Manifest updated for ${isFirefox ? "Firefox" : "Chrome"}`);
  } catch (error) {
    console.error("Error updating manifest.json:", error);
  }
}

updateManifest();
