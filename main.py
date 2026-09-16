#!/usr/bin/env python3
"""
Шизо 95: Клинический синтезатор v4.2
Корневая точка входа для автономного запуска Desktop-приложения (Linux / pywebview).
"""

import sys
from pathlib import Path

# Подключаем модуль desktop_app из каталога linux/
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "linux"))

from desktop_app import main

if __name__ == "__main__":
    main()
