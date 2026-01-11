#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

INFO_PREFIX="[first-install]"

info() { echo "${INFO_PREFIX} $*"; }
warn() { echo "${INFO_PREFIX} WARNING: $*"; }
fail() { echo "${INFO_PREFIX} ERROR: $*"; exit 1; }

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/first-install.sh [--skip-install] [--force-install]

Options:
  --skip-install    Ne lance pas pnpm install
  --force-install   Force pnpm install meme si node_modules existe
USAGE
}

SKIP_INSTALL=0
FORCE_INSTALL=0

for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=1 ;;
    --force-install) FORCE_INSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Option inconnue: $arg" ;;
  esac
done

detect_os() {
  case "$(uname -s | tr '[:upper:]' '[:lower:]')" in
    linux*) echo "linux" ;;
    darwin*) echo "macos" ;;
    msys*|mingw*|cygwin*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    fail "Node manquant. Installer Node 20 LTS (min 18.17)."
  fi
  local version major minor
  version="$(node -p "process.versions.node")"
  major="$(echo "$version" | cut -d. -f1)"
  minor="$(echo "$version" | cut -d. -f2)"
  if [[ "$major" -lt 18 ]] || ([[ "$major" -eq 18 ]] && [[ "$minor" -lt 17 ]]); then
    warn "Node $version detecte. Installer Node 20 LTS (min 18.17)."
  else
    info "Node $version OK"
  fi
}

read_package_manager() {
  local pm
  pm="$(grep -oE '"packageManager"[[:space:]]*:[[:space:]]*"[^"]+"' package.json | head -n1 | sed -E 's/.*"([^"]+)"/\1/')"
  echo "$pm"
}

check_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then
    local pm
    pm="$(read_package_manager)"
    warn "pnpm manquant."
    warn "corepack enable"
    warn "corepack prepare ${pm:-pnpm@latest} --activate"
    return 0
  fi
  local version expected pm
  version="$(pnpm -v)"
  pm="$(read_package_manager)"
  expected="${pm#pnpm@}"
  if [[ -n "$expected" && "$version" != "$expected" ]]; then
    warn "pnpm $version. Attendu: $expected"
  else
    info "pnpm $version OK"
  fi
}

check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    fail "Docker manquant. Installer Docker."
  fi
  if ! docker compose version >/dev/null 2>&1; then
    fail "docker compose manquant. Mettre a jour Docker."
  fi
  if ! docker info >/dev/null 2>&1; then
    warn "Docker detecte, daemon arrete. Lancer Docker."
  else
    info "Docker OK"
  fi
}

check_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    warn "tmux manquant."
    warn "macOS: brew install tmux"
    warn "Linux: sudo apt install tmux"
    warn "Windows (WSL): sudo apt install tmux"
  else
    info "tmux OK"
  fi
}

maybe_install_deps() {
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    info "Installation des dependances ignoree (--skip-install)."
    return 0
  fi

  if [[ "$FORCE_INSTALL" -eq 1 ]] || [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    info "Installation des dependances (pnpm install)..."
    pnpm install
  else
    info "node_modules present. Utilise --force-install pour reinstaller."
  fi
}

main() {
  local os
  os="$(detect_os)"
  info "OS detecte: $os"

  check_node
  check_pnpm
  check_docker
  check_tmux
  maybe_install_deps

  info "Pret"
  info "./scripts/dev up nest postgres"
  info "./scripts/dev up nest mariadb"
  info "./scripts/dev down"
}

main
