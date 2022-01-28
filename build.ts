/// <reference lib="deno.unstable" />
import { JSZip } from "./deps_build.ts";

async function makeContentScript() {
  const contentScriptURL = new URL("./src/beastify.ts", import.meta.url);
  const { files } = await Deno.emit(contentScriptURL, { bundle: "classic" });
  return files["deno:///bundle.js"];
}

async function makePopupScript(contentScriptPath: string) {
  const contentScriptURL = new URL("./src/popup.ts", import.meta.url);
  const { files } = await Deno.emit(contentScriptURL, { bundle: "module" });
  // CONTENT_SCRIPT_PATHを置換しておく
  return files["deno:///bundle.js"].replaceAll(
    "CONTENT_SCRIPT_PATH",
    `"${contentScriptPath}"`,
  );
}

const manifest = {
  manifest_version: 2,
  name: "Beastify",
  version: "1.0",

  description:
    "Adds a browser action icon to the toolbar. Click the button to choose a beast. The active tab's body content is then replaced with a picture of the chosen beast. See https://developer.mozilla.org/ja/Add-ons/WebExtensions/Examples#beastify",
  homepage_url:
    "https://github.com/mdn/webextensions-examples/tree/master/beastify",
  icons: {
    32: "./icons/beasts-32.png",
    48: "./icons/beasts-48.png",
  },

  permissions: [
    "activeTab",
  ],

  browser_action: {
    default_icon: "./icons/beasts-32.png",
    theme_icons: [{
      light: "./icons/beasts-32-light.png",
      dark: "./icons/beasts-32.png",
      size: 32,
    }],
    default_title: "Beastify",
    default_popup: "./popup/popup.html",
  },

  web_accessible_resources: [
    "/beasts/frog.jpg",
    "/beasts/turtle.jpg",
    "/beasts/snake.jpg",
  ],
};

if (import.meta.main) {
  const zip = new JSZip();

  // create icons/
  {
    console.log("Creating icons/...");
    const icons = zip.folder("icons");
    const names = ["beasts-32.png", "beasts-48.png", "beasts-32-light.png"];
    for (const name of names) {
      icons.addFile(
        name,
        await Deno.readFile(
          new URL(`./assets/icons/${name}`, import.meta.url),
        ),
      );
      console.log(name);
    }
  }

  // create beasts/
  {
    console.log("Creating beasts/...");
    const icons = zip.folder("beasts");
    const names = ["frog.jpg", "snake.jpg", "turtle.jpg"];
    for (const name of names) {
      icons.addFile(
        name,
        await Deno.readFile(
          new URL(`./assets/beasts/${name}`, import.meta.url),
        ),
      );
      console.log(name);
    }
  }

  // create popup/
  {
    console.log("Creating popup/...");
    const popup = zip.folder("popup");
    popup.addFile(
      "popup.html",
      await Deno.readTextFile(new URL("./src/popup.html", import.meta.url)),
    );
    console.log("popup.html");
    popup.addFile(
      "popup.css",
      await Deno.readTextFile(new URL("./src/popup.css", import.meta.url)),
    );
    console.log("popup.css");
    popup.addFile(
      "popup.js",
      await makePopupScript("/beastify.js"),
    );
    console.log("popup.js");
  }

  zip.addFile("beastify.js", await makeContentScript());
  console.log("Add beastify.js");
  zip.addFile("manifest.json", JSON.stringify(manifest));
  console.log("Add manifiest.json");

  await Deno.writeFile(
    "beastify.zip",
    await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    }),
  );
  console.log("Created bestify.zip");
}
