#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ASSETS_DIR="${SCRIPT_DIR}/native-webview/app/src/main/assets"

echo "Копирование веб-ассетов из web/ в ${ASSETS_DIR}..."
mkdir -p "${ASSETS_DIR}"
rm -rf "${ASSETS_DIR}"/*
cp -r "${ROOT_DIR}/web/"* "${ASSETS_DIR}/"

echo "Готово! Ассеты синхронизированы."
