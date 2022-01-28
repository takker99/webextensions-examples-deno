/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

import { browser } from "./deps.ts";
import { BeastName, ensureBeastName, ensureTabId } from "./types.ts";

declare const CONTENT_SCRIPT_PATH: string;

/**
 * ページのすべてを隠す CSS、ただし
 * "beastify-image" クラスを持つ要素は除く
 */
const hidePage = `body > :not(.beastify-image) {
                    display: none;
                  }`;

/**
 * ポップアップを読み込んだ時、コンテンツスクリプトをアクティブなタブに挿入し、
 * クリックハンドラーを追加する。
 * スクリプトの挿入ができない場合、エラー処理をする。
 */
try {
  console.log(`Read ${CONTENT_SCRIPT_PATH}`);
  await browser.tabs.executeScript({ file: CONTENT_SCRIPT_PATH });
  listenForClicks();
} catch (e: unknown) {
  if (!(e instanceof Error)) throw e;
  reportExecuteScriptError(e);
}

/**
 * スクリプトにエラーがあった。
 * ポップアップのエラーメッセージを表示し、通常の UI を隠す。
 */
function reportExecuteScriptError(error: Error) {
  document.getElementById("popup-content")?.classList?.add?.("hidden");
  document.getElementById("error-content")?.classList?.remove?.("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * ボタンクリックをリッスンし、ページ内のコンテンツスクリプトに
 * 適切なメッセージを送る
 */
function listenForClicks() {
  document.addEventListener("click", async (e) => {
    // div以外で発生したeventsを無視する
    if (!(e.target instanceof HTMLDivElement)) return;

    /**
     * アクティブなタブを取得し、
     * "beastify()" か "reset()" を適切に呼び出す
     */
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (e.target.classList.contains("beast")) {
        ensureBeastName(e.target.textContent);
        await beastify(tab, e.target.textContent);
      } else if (e.target.classList.contains("reset")) {
        await reset(tab);
      }
    } catch (e: unknown) {
      if (!(e instanceof Error)) throw e;
      reportError(e);
    }
  });
}

/**
 * アクティブなタブにページを隠す CSS を挿入して
 * 動物の URL を取得し、
 * アクティブなタブのコンテンツスクリプトに "beastify" メッセージを送る
 */
async function beastify(tab: browser.Tabs.Tab, beastName: BeastName) {
  console.log("insert CSS");
  await browser.tabs.insertCSS({ code: hidePage });
  const url = beastNameToURL(beastName);
  ensureTabId(tab);
  console.log("Order to insert an image");
  browser.tabs.sendMessage(tab.id, {
    command: "beastify",
    beastURL: url,
  });
}

/**
 * アクティブなタブからページを隠す CSS を削除し、
 * アクティブなタブのコンテンツスクリプトに "reset" メッセージを送る
 */
async function reset(tab: browser.Tabs.Tab) {
  console.log("remove CSS");
  await browser.tabs.removeCSS({ code: hidePage });
  ensureTabId(tab);
  console.log("Order to remove the image");
  browser.tabs.sendMessage(tab.id, {
    command: "reset",
  });
}

/**
 * 動物の名前を受け取って、対応する画像の URL を取得する
 */
function beastNameToURL(beastName: BeastName) {
  switch (beastName) {
    case "Frog":
      return browser.runtime.getURL("./beasts/frog.jpg");
    case "Snake":
      return browser.runtime.getURL("./beasts/snake.jpg");
    case "Turtle":
      return browser.runtime.getURL("./beasts/turtle.jpg");
  }
}

/**
 * ただコンソールにエラーをログ出力する
 */
function reportError(error: Error) {
  console.error(`Could not beastify: ${error}`);
}
