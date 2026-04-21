"use client";

export type HistoryItemType = "cr" | "annonce" | "cv" | "convention";

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  date: string;       // ISO string
  title: string;      // display name
  subtitle: string;   // secondary info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;          // CompteRendu | AnnonceGeneree | CVAnonymise
}

const KEY = "cabrh_history";
const MAX_ITEMS = 100;

function load(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

function save(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToHistory(item: Omit<HistoryItem, "id" | "date">): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  const items = load();
  const updated = [newItem, ...items].slice(0, MAX_ITEMS);
  save(updated);
  return newItem;
}

export function getHistory(type?: HistoryItemType): HistoryItem[] {
  const items = load();
  if (!type) return items;
  return items.filter((i) => i.type === type);
}

export function deleteFromHistory(id: string) {
  const items = load().filter((i) => i.id !== id);
  save(items);
}

export function clearHistory(type?: HistoryItemType) {
  if (!type) { save([]); return; }
  const items = load().filter((i) => i.type !== type);
  save(items);
}
