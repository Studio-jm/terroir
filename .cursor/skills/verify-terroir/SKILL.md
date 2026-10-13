---
name: verify-terroir
description: "Install, lint, build, start, and HTTP-check the Terroir Next.js site. Use when proving Terroir from a clean checkout, or when an agent must show that /, /e/ferme-du-serre, and /?q=miel return 200 and /e/inconnu returns 404."
---

# Verify Terroir

Terroir is a Next.js site. Follow this file from the repository root to install dependencies, lint, build, start the production server, and record HTTP status codes.

The repository root contains `package.json` and `.cursor/skills/verify-terroir/SKILL.md`.

Do not edit application code, `package.json`, or `package-lock.json` during this run. Do not run `npm audit fix`. Do not install another Node.js when `node -v` is 20.9.0 or newer.

## Acceptance run

Copy the script below into `/tmp/verify-terroir.sh` unchanged. From the repository root, run `bash /tmp/verify-terroir.sh`.

The run passes only when that command exits 0 and the summary contains all of these lines.

- `npm ci exit 0`
- `npm run lint exit 0`
- `npm run build exit 0`
- `GET / 200`
- `GET /e/ferme-du-serre 200`
- `GET /?q=miel 200`
- `GET /e/inconnu 404`

`npm ci` can print an ESLint deprecation warning and a vulnerability audit and still exit 0. `npm run build` can print a Next.js telemetry notice and still exit 0. Those notices are not failures.

A `Terminated` line while the script stops the server is the server exiting. The script exit code decides the result.

`/e/inconnu` can print `NoFallbackError` in the server log. The pass condition for that path is HTTP 404.

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ ! -f package.json ] || [ ! -f .cursor/skills/verify-terroir/SKILL.md ]; then
  echo "Run this script from the repository root." >&2
  exit 1
fi

node -e 'const [maj, min] = process.versions.node.split(".").map(Number); if (maj < 20 || (maj === 20 && min < 9)) { console.error("Node " + process.version + " is below 20.9.0"); process.exit(1); }'

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is not on PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not on PATH." >&2
  exit 1
fi

RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)-$$
EVID="/tmp/terroir-verify/${RUN_ID}"
mkdir -p "$EVID"
printf '%s\n' "$EVID" > /tmp/terroir-verify-latest

say() {
  printf '%s\n' "$1" | tee -a "$EVID/summary.txt"
}

PORT=$(node -e 'const net = require("net"); const s = net.createServer(); s.listen(0, "0.0.0.0", () => { console.log(s.address().port); s.close(); });')

cleanup() {
  if [ -f "$EVID/server.pgid" ]; then
    pgid=$(tr -d '[:space:]' < "$EVID/server.pgid")
    if [ -n "$pgid" ]; then
      kill -- -"$pgid" 2>/dev/null || true
      sleep 0.5
      kill -9 -- -"$pgid" 2>/dev/null || true
    fi
  fi
  if [ -f "$EVID/listener.pid" ]; then
    listener=$(tr -d '[:space:]' < "$EVID/listener.pid")
    if [ -n "$listener" ]; then
      kill "$listener" 2>/dev/null || true
      sleep 0.2
      kill -9 "$listener" 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT

say "node $(node -v)"
say "port ${PORT}"

set +e
npm ci >"$EVID/ci.log" 2>&1
ci_code=$?
set -e
say "npm ci exit ${ci_code}"
{
  echo "----- npm ci log -----"
  cat "$EVID/ci.log"
} | tee -a "$EVID/summary.txt"
if [ "$ci_code" -ne 0 ]; then
  exit "$ci_code"
fi

set +e
npm run lint >"$EVID/lint.log" 2>&1
lint_code=$?
set -e
say "npm run lint exit ${lint_code}"
{
  echo "----- npm run lint log -----"
  cat "$EVID/lint.log"
} | tee -a "$EVID/summary.txt"
if [ "$lint_code" -ne 0 ]; then
  exit "$lint_code"
fi

set +e
npm run build >"$EVID/build.log" 2>&1
build_code=$?
set -e
say "npm run build exit ${build_code}"
{
  echo "----- npm run build log -----"
  cat "$EVID/build.log"
} | tee -a "$EVID/summary.txt"
if [ "$build_code" -ne 0 ]; then
  exit "$build_code"
fi

set -m
npm run start -- -p "$PORT" >"$EVID/start.log" 2>&1 &
server_pid=$!
pgid=$(ps -o pgid= -p "$server_pid" | tr -d '[:space:]')
printf '%s\n' "$server_pid" > "$EVID/server.pid"
printf '%s\n' "$pgid" > "$EVID/server.pgid"
set +m

ready=0
for _ in $(seq 1 30); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" 2>/dev/null || true)
  if [ "$code" = "200" ]; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  say "server did not return 200 on /"
  cat "$EVID/start.log" >&2 || true
  exit 1
fi

listener=""
if command -v netstat >/dev/null 2>&1; then
  listener=$(netstat -ltnp 2>/dev/null | awk -v p="$PORT" '$4 ~ (":" p "$") && $6 == "LISTEN" { split($7, a, "/"); print a[1]; exit }' || true)
fi
printf '%s\n' "$listener" > "$EVID/listener.pid"

fail=0
check() {
  path="$1"
  expect="$2"
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}${path}" || true)
  say "GET ${path} ${code}"
  if [ "$code" != "$expect" ]; then
    fail=1
  fi
}

check / 200
check /e/ferme-du-serre 200
check '/?q=miel' 200
check /e/inconnu 404

say "evidence ${EVID}"

if [ "$fail" -ne 0 ]; then
  exit 1
fi
```

## Launch

The acceptance script is the launch. It installs with `npm ci`, lints with `npm run lint`, builds with `npm run build`, then starts the production server with `npm run start -- -p "$PORT"`.

`$PORT` is a free TCP port. The script chooses it before start. Next.js listens on `0.0.0.0`. The checks call `http://127.0.0.1:$PORT`.

Do not pass `-H 127.0.0.1`. An unknown slug is rewritten through `localhost`. On this machine `localhost` is `::1`. A server bound only to `127.0.0.1` then returns 500 for `/e/inconnu`. The default listen address accepts that rewrite, and the status is 404.

Ready means `GET /` returns 200. The server log also prints a line containing `Ready` and `Local: http://localhost:<port>`. Wait for HTTP 200 before the other requests. A process that has only opened the port is not enough.

There is no database and no seed step. The three public exploitation pages are compiled into the build.

`npm run dev` is not this run. This run uses the production server after `npm run build`.

## Doctor

Run the acceptance script. If it fails, read these files under the evidence directory printed as `evidence <path>`, or in `/tmp/terroir-verify-latest`.

- `ci.log`, `lint.log`, and `build.log` for the failing command.
- `start.log` if the server never returned 200.
- `server.pid` and `listener.pid` for the processes this run started.

Confirm `node -v` is 20.9.0 or newer and that `curl` and `npm` are on `PATH`. Confirm the listener port matches `summary.txt` and that `GET /` on `127.0.0.1` returns 200. Drive only a server this run started.

## Drive

Use `curl` without `-L` and without `-I`. The acceptance script sends `GET` and records the status code.

- `GET /` returns 200.
- `GET /e/ferme-du-serre` returns 200.
- `GET /?q=miel` returns 200.
- `GET /e/inconnu` returns 404.

The home page search field filters in the browser. `/?q=miel` does not change the server HTML. The acceptance check for that URL is the status code 200.

## Evidence

The script writes `/tmp/terroir-verify/<run-id>/`.

- `summary.txt` has the exit codes, the command logs, and the four `GET` lines.
- `ci.log`, `lint.log`, `build.log`, and `start.log` keep the raw output.
- `server.pid`, `server.pgid`, and `listener.pid` identify the processes this run started.

`/tmp/terroir-verify-latest` contains the path of the newest evidence directory. Leave that directory in place after cleanup.

## Cleanup

The script traps `EXIT` and stops the process group recorded in `server.pgid`, then the listener pid recorded in `listener.pid`. Both values belong to the server this run started.

Do not kill processes by name. Do not delete `/tmp/terroir-verify` or `/tmp/terroir-verify-latest`.

## Helpers

This skill ships no second file. The helper is the script in Acceptance run. Save it as `/tmp/verify-terroir.sh` and run `bash /tmp/verify-terroir.sh` from the repository root.

# Home

The home page lists the public exploitations.

## Sub-features

- `home-list` shows the three demo exploitations.

## How to get to it (user POV)

Open `/`.

## Driving it with curl

Preconditions. The acceptance script has started the server and `GET /` returned 200.

- Action. Request the home page. Command. `curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/"`. Result. `200`. The HTML title is `Terroir` and the document links to `/e/ferme-du-serre`, `/e/ferme-des-nuages`, and `/e/rucher-de-nulle-part`.

## Gotchas

The acceptance run requires the status code. A missing link is a failed home check only when you are proving page content beyond that run.

# Search

The home page filters exploitations by name, commune, or product after you type in the search field. The field starts empty.

## Sub-features

- `search-type` narrows the list in the browser.
- `search-query` records that `/?q=miel` still returns the home document.

## How to get to it (user POV)

Open `/`. Type in the field labeled `Rechercher par nom, commune ou produit`. The field name is `q`.

## Driving it with curl

Preconditions. The acceptance script has started the server.

- Action. Request the home page with the query string used by the acceptance run. Command. `curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/?q=miel"`. Result. `200`. The server HTML still lists all three exploitations. Filtering happens after the page loads, in the browser.

## Gotchas

Do not fail the acceptance run because `/?q=miel` lists every exploitation. The status code is the check. Do not treat this URL as a server-side search.

# Exploitation page

A known slug renders one exploitation.

## Sub-features

- `fiche-ferme-du-serre` renders the demo page used by the acceptance run.
- `fiche-autres` renders `/e/ferme-des-nuages` and `/e/rucher-de-nulle-part`.

## How to get to it (user POV)

Open `/e/ferme-du-serre` from the home list or from the address bar. The same pattern works for `/e/ferme-des-nuages` and `/e/rucher-de-nulle-part`.

## Driving it with curl

Preconditions. `npm run build` has finished and the acceptance server is up.

- Action. Request the demo fiche. Command. `curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/e/ferme-du-serre"`. Result. `200`. The HTML heading contains `Ferme du Serre`.
- Action. Request another known fiche only when you are proving the map beyond the acceptance run. Command. `curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/e/ferme-des-nuages"`. Result. `200`.

## Gotchas

Unknown slugs are not exploitation pages. Use the unknown-page checks for those.

# Unknown page

An unknown exploitation slug returns the not-found page.

## Sub-features

- `fiche-inconnue` answers 404 for `/e/inconnu`.

## How to get to it (user POV)

Open `/e/inconnu`.

## Driving it with curl

Preconditions. The acceptance server is up.

- Action. Request the unknown slug. Command. `curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/e/inconnu"`. Result. `404`. The HTML heading is `Fiche introuvable`.

## Gotchas

The server log can contain `NoFallbackError` for this request. HTTP 404 is still a pass. Do not change application code because that line appeared.

Two runs can use two ports. Do not send these requests to a server this run did not start.

After the app changes, run `/maintain-verification-skill` and correct this file from a live run.
