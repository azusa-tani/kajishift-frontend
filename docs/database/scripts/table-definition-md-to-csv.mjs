/**
 * table_definition.md → table_definition_for_excel.csv（UTF-8 BOM）
 * 実行: node docs/database/scripts/table-definition-md-to-csv.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const mdPath = path.join(root, "table_definition.md");
const outPath = path.join(root, "table_definition_for_excel.csv");

function esc(field) {
  if (field == null || field === undefined) return "";
  const s = String(field);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function line(cols) {
  return cols.map(esc).join(",") + "\r\n";
}

function parseTableRow(line) {
  const t = line.trim();
  if (!t.startsWith("|") || !t.endsWith("|")) return null;
  const cells = t
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
  if (cells.length && /^:?-+:?$/.test(cells[0])) return null;
  return cells;
}

const raw = fs.readFileSync(mdPath, "utf8");
const lines = raw.split(/\r?\n/);

const out = [];
out.push(
  line([
    "区分",
    "テーブル名",
    "補助",
    "No",
    "カラム名",
    "論理名",
    "データ型",
    "桁数",
    "NULL許可",
    "主キー",
    "外部キー",
    "デフォルト値",
    "説明",
  ])
);

let i = 0;
while (i < lines.length && !lines[i].startsWith("## テーブル名：")) {
  const L = lines[i].trim();
  if (L && L !== "---" && !L.startsWith("# ")) {
    out.push(line(["ドキュメント", "", "", L, "", "", "", "", "", "", "", "", ""]));
  }
  i++;
}

while (i < lines.length) {
  if (lines[i].startsWith("## 付録")) break;
  const m = lines[i].match(/^## テーブル名：(.+)$/);
  if (!m) {
    i++;
    continue;
  }
  const tableName = m[1].trim();
  i++;

  let overview = "";
  const columns = [];
  const indexes = [];
  const constraints = [];
  const notes = [];
  const extras = [];

  while (i < lines.length && !lines[i].startsWith("## テーブル名：")) {
    const L = lines[i];
    if (L.startsWith("### 概要")) {
      i++;
      const buf = [];
      while (
        i < lines.length &&
        !lines[i].startsWith("### ") &&
        !lines[i].startsWith("## ")
      ) {
        if (lines[i].trim()) buf.push(lines[i].trim());
        i++;
      }
      overview = buf.join(" ");
      continue;
    }
    if (L.startsWith("### カラム定義")) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRow(lines[i]);
        i++;
        if (!cells || cells[0] === "No") continue;
        if (cells.length >= 10) {
          columns.push(cells.slice(0, 10));
        }
      }
      continue;
    }
    if (L.startsWith("### インデックス")) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRow(lines[i]);
        i++;
        if (!cells || cells[0] === "インデックス名") continue;
        if (cells.length >= 4) indexes.push(cells.slice(0, 4));
      }
      continue;
    }
    if (L.startsWith("### 制約")) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = parseTableRow(lines[i]);
        i++;
        if (!cells || cells[0] === "制約名") continue;
        if (cells.length >= 3) constraints.push(cells.slice(0, 3));
      }
      continue;
    }
    if (L.startsWith("### 備考")) {
      i++;
      while (
        i < lines.length &&
        !lines[i].startsWith("### ") &&
        !lines[i].startsWith("## ") &&
        !lines[i].startsWith("---")
      ) {
        const t = lines[i].trim();
        if (t.startsWith("- ")) notes.push(t.slice(2).trim());
        else if (t && !t.startsWith("|")) notes.push(t);
        i++;
      }
      continue;
    }
    if (L.startsWith("## 付録")) {
      break;
    }
    /* セクション見出し以外の本文（例: notifications の ENUM 値の直書き） */
    if (
      L.trim() &&
      !L.startsWith("---") &&
      !L.trim().startsWith("|")
    ) {
      extras.push(L.trim());
    }
    i++;
  }

  out.push(line(["概要", tableName, "", overview, "", "", "", "", "", "", "", "", ""]));
  columns.forEach((c, idx) => {
    out.push(
      line([
        "カラム",
        tableName,
        String(idx + 1),
        c[0] ?? "",
        c[1] ?? "",
        c[2] ?? "",
        c[3] ?? "",
        c[4] ?? "",
        c[5] ?? "",
        c[6] ?? "",
        c[7] ?? "",
        c[8] ?? "",
        c[9] ?? "",
      ])
    );
  });
  indexes.forEach((c, idx) => {
    out.push(
      line([
        "インデックス",
        tableName,
        String(idx + 1),
        "",
        c[0] ?? "",
        c[1] ?? "",
        c[2] ?? "",
        c[3] ?? "",
        "",
        "",
        "",
        "",
        "",
      ])
    );
  });
  constraints.forEach((c, idx) => {
    out.push(
      line([
        "制約",
        tableName,
        String(idx + 1),
        "",
        c[0] ?? "",
        c[1] ?? "",
        c[2] ?? "",
        "",
        "",
        "",
        "",
        "",
        "",
      ])
    );
  });
  notes.forEach((n, idx) => {
    out.push(line(["備考", tableName, String(idx + 1), n, "", "", "", "", "", "", "", "", ""]));
  });
  extras.forEach((text, idx) => {
    out.push(line(["補足", tableName, String(idx + 1), text, "", "", "", "", "", "", "", "", ""]));
  });
  out.push(line(["", "", "", "", "", "", "", "", "", "", "", "", ""]));
}

/* 付録 ENUM */
if (i < lines.length && lines[i].startsWith("## 付録")) {
  out.push(line(["付録", "ENUM一覧", "", "型名", "値", "", "", "", "", "", "", "", ""]));
  i++;
  while (i < lines.length && !lines[i].trim().startsWith("|")) i++;
  while (i < lines.length) {
    const cells = parseTableRow(lines[i]);
    i++;
    if (!cells || cells[0] === "型名") continue;
    if (cells.length >= 2) {
      out.push(
        line(["ENUM", "", "", "", cells[0], cells[1], "", "", "", "", "", "", ""])
      );
    }
  }
}

const bom = "\uFEFF";
fs.writeFileSync(outPath, bom + out.join(""), "utf8");
console.log("Wrote", outPath);
