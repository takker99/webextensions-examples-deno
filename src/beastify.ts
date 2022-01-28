/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

import { browser } from "./deps.ts";
import type { Message } from "./types.ts";

declare global {
  interface Window {
    /** content scriptが既に挿入されているかどうか */
    hasRun: boolean;
  }
}

if (!window.hasRun) {
  /**
   * グローバルなガード変数をチェック、設定する。
   * コンテンツスクリプトが再び同じページに挿入された場合、
   * 次は何もしない。
   */
  window.hasRun = true;

  /**
   * バックグラウンドスクリプトからのメッセージをリッスンし、
   * "beastify()" か "reset()" を呼び出す。
   */
  browser.runtime.onMessage.addListener((message: Message) => {
    switch (message.command) {
      case "beastify":
        insertBeast(message.beastURL);
        return;
      case "reset":
        removeExistingBeasts();
        return;
    }
  });
}

/**
 * 動物の画像の URL を受け取り、既存の動物をすべて削除し、次に
 * 画像を指す IMG 要素の作成・スタイル適用を行い、
 * 作成したノードをドキュメント内に挿入する
 */
function insertBeast(beastURL: string) {
  removeExistingBeasts();
  const beastImage = document.createElement("img");
  beastImage.src = beastURL;
  beastImage.style.height = "100vh";
  beastImage.className = "beastify-image";
  document.body.appendChild(beastImage);
}

/**
 * ページからすべての動物を削除する
 */
function removeExistingBeasts() {
  const existingBeasts = document.getElementsByClassName("beastify-image");
  for (const beast of Array.from(existingBeasts)) {
    beast.remove();
  }
}
