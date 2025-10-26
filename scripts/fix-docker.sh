#!/usr/bin/env bash
set -euo pipefail

unset DOCKER_HOST || true
docker context use default >/dev/null 2>&1 || true

if ! docker ps >/dev/null 2>&1; then
  echo "[fix-docker] Starting docker… (sudo peut être requis)"
  sudo systemctl start docker
fi

echo "[fix-docker] Context:"
docker context ls || true
echo "[fix-docker] ps:"
docker ps || true
