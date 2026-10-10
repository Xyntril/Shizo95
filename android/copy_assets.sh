#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ASSETS_DIR="${SCRIPT_DIR}/native-webview/app/src/main/assets"
RES_DIR="${SCRIPT_DIR}/native-webview/app/src/main/res"

echo "Копирование веб-ассетов из web/ в ${ASSETS_DIR}..."
mkdir -p "${ASSETS_DIR}"
rm -rf "${ASSETS_DIR}"/*
cp -r "${ROOT_DIR}/web/"* "${ASSETS_DIR}/"

# Генерация/синхронизация ретро-иконок Android
if command -v python3 &> /dev/null; then
    python3 -c "
import os
from PIL import Image, ImageDraw

res_dir = '${RES_DIR}'
sizes = {'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192}

def draw_retro_icon(size, is_round=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if is_round:
        draw.ellipse([0, 0, size-1, size-1], fill=(192, 192, 192, 255), outline=(0, 0, 0, 255), width=max(1, size//32))
    else:
        b = max(1, size // 24)
        draw.rectangle([0, 0, size-1, size-1], fill=(192, 192, 192, 255))
        draw.line([0, 0, size-1, 0], fill=(255, 255, 255, 255), width=b)
        draw.line([0, 0, 0, size-1], fill=(255, 255, 255, 255), width=b)
        draw.line([0, size-1, size-1, size-1], fill=(0, 0, 0, 255), width=b)
        draw.line([size-1, 0, size-1, size-1], fill=(0, 0, 0, 255), width=b)
    margin = size // 5
    fw = size - 2 * margin
    fh = fw
    half_w = fw // 2
    half_h = fh // 2
    x0, y0 = margin, margin
    gap = max(1, size // 32)
    border = max(1, size // 48)
    draw.rectangle([x0, y0, x0 + half_w - gap, y0 + half_h - gap], fill=(238, 44, 44, 255), outline=(0, 0, 0, 255), width=border)
    draw.rectangle([x0 + half_w + gap, y0, x0 + fw, y0 + half_h - gap], fill=(0, 168, 0, 255), outline=(0, 0, 0, 255), width=border)
    draw.rectangle([x0, y0 + half_h + gap, x0 + half_w - gap, y0 + fh], fill=(0, 102, 204, 255), outline=(0, 0, 0, 255), width=border)
    draw.rectangle([x0 + half_w + gap, y0 + half_h + gap, x0 + fw, y0 + fh], fill=(255, 187, 0, 255), outline=(0, 0, 0, 255), width=border)
    return img

try:
    for folder, s in sizes.items():
        dp = os.path.join(res_dir, folder)
        os.makedirs(dp, exist_ok=True)
        draw_retro_icon(s, False).save(os.path.join(dp, 'ic_launcher.png'), 'PNG')
        draw_retro_icon(s, True).save(os.path.join(dp, 'ic_launcher_round.png'), 'PNG')
except Exception as e:
    pass
" || true
fi

echo "Готово! Ассеты и иконки синхронизированы."
