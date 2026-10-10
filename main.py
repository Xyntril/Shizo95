#!/usr/bin/env python3
"""
Шизо 95: Клинический синтезатор
Локальный автономный раннер на pywebview (WebKitGTK).
Открывает web/index.html напрямую без сторонних веб-серверов.
"""

import os
import sys
import webview


class Win95Api:
    """JS API для взаимодействия с pywebview"""
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def close(self):
        if self._window:
            self._window.destroy()

    def minimize(self):
        if self._window:
            self._window.minimize()

    def toggle_fullscreen(self):
        if self._window:
            self._window.toggle_fullscreen()


def main():
    # На сессиях Wayland (KDE / GNOME) используем XWayland (GDK_BACKEND=x11)
    # для предотвращения крашей WebKitGTK subsurfaces.
    if sys.platform.startswith("linux"):
        if "GDK_BACKEND" not in os.environ and os.environ.get("WAYLAND_DISPLAY") and os.environ.get("DISPLAY"):
            os.environ["GDK_BACKEND"] = "x11"
        os.environ.setdefault("WEBKIT_DISABLE_DMABUF_RENDERER", "1")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(base_dir, "web", "index.html")

    if not os.path.exists(html_path):
        raise FileNotFoundError(f"Файл интерфейса не найден по пути: {html_path}")

    api = Win95Api()
    window = webview.create_window(
        "Шизо 95 — Клинический синтезатор",
        html_path,
        width=1024,
        height=768,
        min_size=(640, 480),
        background_color="#060612",
        js_api=api
    )
    api.set_window(window)
    webview.start()


if __name__ == "__main__":
    main()
