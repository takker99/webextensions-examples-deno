import type { browser } from "./deps.ts";

/** 動物の名前 */
export type BeastName = "Frog" | "Snake" | "Turtle";

export function ensureBeastName(name: unknown): asserts name is BeastName {
  if (typeof name === "string") {
    if (["Frog", "Snake", "Turtle"].includes(name)) return;
  }

  throw TypeError("The value must be Frog, Snake or Turtle.");
}

type PickRequired<T, K extends keyof T> =
  & T
  & {
    [P in K]-?: T[P];
  };
export function ensureTabId(
  tab: browser.Tabs.Tab,
): asserts tab is PickRequired<browser.Tabs.Tab, "id"> {
  if (tab.id !== undefined) return;
  throw TypeError("The value must has id.");
}

/** background scriptからcontent scriptに送るデータ */
export type Message = {
  command: "beastify";
  beastURL: string;
} | {
  command: "reset";
};
