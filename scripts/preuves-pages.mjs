import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const pages = [
  { id: "fiche", path: "/e/ferme-du-serre" },
  { id: "inscription", path: "/inscription" },
  { id: "connexion", path: "/connexion" },
  { id: "espace", path: "/espace" },
  { id: "introuvable", path: "/fiche-introuvable" },
  { id: "accueil", path: "/" },
];

const widths = [375, 1280];

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1];
}

const base = arg("--base", "http://127.0.0.1:3000").replace(/\/$/, "");
const outDir = arg("--out", "docs/preuves/pages/apres");
const port = Number(arg("--cdp", "9222"));
const only = new Set(
  (arg("--only", "") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);
const selected = only.size
  ? pages.filter((item) => only.has(item.id))
  : pages.filter((item) => item.id !== "accueil");

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });
  return (method, params = {}) => {
    const messageId = ++id;
    ws.send(JSON.stringify({ id: messageId, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(messageId, { resolve, reject });
    });
  };
}

async function chromeReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch {
      await delay(250);
    }
  }
  throw new Error("Chrome n'a pas ouvert le port de débogage.");
}

const overflowSource = `(() => {
  const width = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest(".piege")) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 && box.height < 1) continue;
    const left = Math.round(box.left);
    const right = Math.round(box.right);
    if (left < -1 || right > width + 1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        className: String(el.className || "").slice(0, 120),
        left,
        right,
        width,
      });
    }
  }
  return {
    clientWidth: width,
    scrollWidth: document.documentElement.scrollWidth,
    count: offenders.length,
    offenders: offenders.slice(0, 12),
  };
})()`;

const chrome = spawn(
  "/usr/bin/google-chrome-stable",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--no-first-run",
    `--user-data-dir=/tmp/terroir-chrome-${port}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let failed = 0;

try {
  await chromeReady();
  const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) =>
    r.json(),
  );
  const page = list.find((entry) => entry.type === "page");
  if (!page) throw new Error("Aucun onglet Chrome.");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  const send = cdp(ws);
  await send("Page.enable");
  await send("Runtime.enable");
  await mkdir(outDir, { recursive: true });

  const report = [];
  for (const item of selected) {
    for (const width of widths) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      await send("Page.navigate", { url: `${base}${item.path}` });
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const ready = await send("Runtime.evaluate", {
          expression:
            "document.readyState === 'complete' && document.body && document.body.innerText.length > 0",
          returnByValue: true,
        });
        if (ready.result?.value) break;
        await delay(200);
      }
      await send("Runtime.evaluate", {
        expression:
          "Promise.all([document.fonts.ready, ...[...document.images].map((img) => img.complete ? 1 : img.decode().catch(() => 0))])",
        awaitPromise: true,
      });
      const measured = await send("Runtime.evaluate", {
        expression: overflowSource,
        returnByValue: true,
      });
      const overflow = measured.result.value;
      const height = await send("Runtime.evaluate", {
        expression: `(() => {
          const nodes = [...document.body.children];
          const bottom = nodes.reduce((max, el) => {
            const box = el.getBoundingClientRect();
            return Math.max(max, box.bottom + window.scrollY);
          }, 0);
          return Math.min(Math.max(Math.ceil(bottom), 200), 8000);
        })()`,
        returnByValue: true,
      });
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: height.result.value,
        deviceScaleFactor: 1,
        mobile: width < 700,
      });
      await delay(150);
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      });
      const file = `${outDir}/${item.id}-${width}.png`;
      await writeFile(file, Buffer.from(shot.data, "base64"));
      const row = {
        id: item.id,
        path: item.path,
        width,
        file,
        scrollWidth: overflow.scrollWidth,
        clientWidth: overflow.clientWidth,
        count: overflow.count,
        offenders: overflow.offenders,
      };
      report.push(row);
      if (overflow.count > 0 || overflow.scrollWidth > overflow.clientWidth + 1) {
        failed += 1;
      }
      process.stdout.write(
        `${item.id} ${width} scroll ${overflow.scrollWidth}/${overflow.clientWidth} offenders ${overflow.count}\n`,
      );
    }
  }
  await writeFile(
    `${outDir}/debordement.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}

if (failed > 0) {
  process.stderr.write(`${failed} largeur(s) débordent.\n`);
  process.exit(1);
}
