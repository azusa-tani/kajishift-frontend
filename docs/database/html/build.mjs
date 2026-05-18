/**
 * Markdown（親ディレクトリ）→ 同階層の HTML を生成する。
 * 実行: node build.mjs（カレントは docs/database/html）
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, "..");

function markedHtml(md) {
  const r = spawnSync("npx", ["-y", "marked@12.0.0", "--gfm"], {
    input: md,
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
    shell: true,
    windowsHide: true,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`marked exited ${r.status}`);
  }
  return r.stdout.trim();
}

function escapeHtmlText(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapTables(html) {
  return html.replace(
    /<table>[\s\S]*?<\/table>/g,
    (m) => `<div class="table-scroll">${m}</div>`
  );
}

function fixLinks(html) {
  return html
    .replace(
      /href="\.\/([^"]+)\.md(#[^"]*)?"/g,
      (_, name, hash) => `href="./${name}.html${hash || ""}"`
    )
    .replace(/href="\.\/([^"]+\.csv)"/g, 'href="../$1"');
}

function mdToHtmlBody(md, { mermaid } = { mermaid: false }) {
  if (!mermaid) {
    return fixLinks(wrapTables(markedHtml(md)));
  }
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(md)) !== null) {
    if (m.index > last) {
      out += wrapTables(markedHtml(md.slice(last, m.index)));
    }
    out += `<div class="mermaid-wrap"><pre class="mermaid">${escapeHtmlText(
      m[1].trim()
    )}</pre></div>\n`;
    last = re.lastIndex;
  }
  out += wrapTables(markedHtml(md.slice(last)));
  return fixLinks(out);
}

const NAV = `
<nav class="doc-nav">
  <a href="index.html">一覧</a>
  <a href="table_definition.html">テーブル定義書</a>
  <a href="er_diagram.html">ER図</a>
  <a href="relations.html">リレーション一覧</a>
  <a href="questions.html">不明点・確認事項</a>
</nav>`;

function pageShell(title, bodyHtml, { mermaid } = {}) {
  const mermaidScripts = mermaid
    ? `
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: "neutral",
    securityLevel: "loose",
    flowchart: { useMaxWidth: true },
    er: { useMaxWidth: true }
  });
</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtmlText(title)} — DB設計書</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="doc-header">
  <div class="doc-header-inner">
    <h1 class="doc-title"><a href="index.html">${escapeHtmlText(title)}</a></h1>
    ${NAV}
  </div>
</header>
<main class="content">
${bodyHtml}
</main>
<footer class="doc-footer">KAJISHIFT データベース設計書（HTML版） / ソースは親ディレクトリの Markdown</footer>
${mermaidScripts}
</body>
</html>`;
}

const pages = [
  {
    file: "table_definition.md",
    out: "table_definition.html",
    title: "テーブル定義書",
    mermaid: false,
  },
  {
    file: "er_diagram.md",
    out: "er_diagram.html",
    title: "ER図",
    mermaid: true,
  },
  {
    file: "relations.md",
    out: "relations.html",
    title: "テーブル間リレーション一覧",
    mermaid: false,
  },
  {
    file: "questions.md",
    out: "questions.html",
    title: "不明点・確認事項一覧",
    mermaid: false,
  },
];

for (const p of pages) {
  const mdPath = path.join(dbDir, p.file);
  const md = fs.readFileSync(mdPath, "utf8");
  const body = mdToHtmlBody(md, { mermaid: p.mermaid });
  const html = pageShell(p.title, body, { mermaid: p.mermaid });
  fs.writeFileSync(path.join(__dirname, p.out), html, "utf8");
  console.log("Wrote", p.out);
}

const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DB設計書一覧 — KAJISHIFT</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="doc-header">
  <div class="doc-header-inner">
    <h1 class="doc-title"><a href="index.html">DB設計書一覧</a></h1>
    ${NAV}
  </div>
</header>
<main class="content">
  <p class="index-intro">
    以下は <code>docs/database</code> 配下の Markdown を HTML に整形したものです。
    ER図ページでは Mermaid.js（CDN）で図を描画します。オフライン閲覧時は図が出ない場合があります。
  </p>
  <div class="card-grid">
    <a class="card" href="table_definition.html">
      <h2>テーブル定義書</h2>
      <p>全テーブルのカラム・インデックス・制約・ENUM 付録</p>
    </a>
    <a class="card" href="er_diagram.html">
      <h2>ER図</h2>
      <p>全テーブル属性付き Mermaid ER 図と論理関連の説明</p>
    </a>
    <a class="card" href="relations.html">
      <h2>テーブル間リレーション一覧</h2>
      <p>DB FK・Prisma・サービス層 include・論理参照の整理</p>
    </a>
    <a class="card" href="questions.html">
      <h2>不明点・確認事項一覧</h2>
      <p>スキーマ乖離・未FK・運用上の確認ポイント</p>
    </a>
  </div>
</main>
<footer class="doc-footer">Markdown を更新したあと再生成する場合: <code>docs/database/html</code> で <code>node build.mjs</code></footer>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "index.html"), indexHtml, "utf8");
console.log("Wrote index.html");
console.log("Done.");
