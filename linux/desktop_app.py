#!/usr/bin/env python3
"""
Шизо 95: Клинический синтезатор v4.2
Нативное Desktop-приложение (Linux AppImage)
Основано на pywebview (WebKitGTK) с поддержкой Canvas, Web Audio API и ретро-интерфейса.
"""

import os
import sys

# На сессиях Wayland (KDE Plasma, GNOME, Sway) движок WebKitGTK вызывает Error 71 при прямой отрисовке subsurfaces.
# Переключение на XWayland (x11) обеспечивает полную стабильность без падений.
if "GDK_BACKEND" not in os.environ and os.environ.get("WAYLAND_DISPLAY") and os.environ.get("DISPLAY"):
    os.environ["GDK_BACKEND"] = "x11"

# Предотвращение сбоев аппаратного DMA-BUF рендеринга WebKit на свежих драйверах Mesa
os.environ.setdefault("WEBKIT_DISABLE_DMABUF_RENDERER", "1")

import webview


class Win95Api:
    """Python API, доступный из JavaScript через window.pywebview.api"""

    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def close(self):
        """Закрытие окна приложения"""
        if self._window:
            self._window.destroy()

    def minimize(self):
        """Сворачивание окна приложения"""
        if self._window:
            self._window.minimize()

    def toggle_maximize(self):
        """Переключение полноэкранного режима хост-окна"""
        if self._window:
            self._window.toggle_fullscreen()


def get_html_path() -> str:
    """Определяет абсолютный путь к index.html как при обычном запуске, так и в PyInstaller AppDir"""
    search_roots = []

    if getattr(sys, "frozen", False):
        if hasattr(sys, "_MEIPASS"):
            search_roots.append(sys._MEIPASS)
        search_roots.append(os.path.dirname(sys.executable))
    else:
        search_roots.append(os.path.dirname(os.path.abspath(__file__)))
        search_roots.append(os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")))

    candidate_subpaths = [
        os.path.join("web", "index.html"),
        os.path.join("_internal", "web", "index.html"),
        "index.html",
    ]

    for root in search_roots:
        for sub in candidate_subpaths:
            path = os.path.abspath(os.path.join(root, sub))
            if os.path.exists(path):
                return path

    raise FileNotFoundError(
        f"Файл index.html не найден. Поиск выполнялся по путям: {search_roots}"
    )


def main():
    api = Win95Api()
    html_file = get_html_path()

    use_frameless = os.getenv("SHIZO_FRAMELESS", "0").lower() in ("1", "true", "yes")

    # Хост-окно открывается с комфортными размерами 960x640, позволяя наслаждаться
    # полноэкранным волновым холстом EarthBound и перемещать окно Win95 внутри него
    window = webview.create_window(
        title="Шизо 95: Клинический синтезатор",
        url=f"file://{html_file}",
        width=960,
        height=640,
        min_size=(640, 480),
        resizable=True,
        frameless=use_frameless,
        easy_drag=False,
        js_api=api,
        background_color="#060612",
    )
    api.set_window(window)

    webview.start(gui="gtk", debug=False)


if __name__ == "__main__":
    main()
