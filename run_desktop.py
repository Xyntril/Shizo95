#!/usr/bin/env python3
"""
Быстрый запуск Desktop-версии «Шизо 95»
Использование:
  python run_desktop.py
  SHIZO_FRAMELESS=1 python run_desktop.py
"""
import sys
from pathlib import Path

# Добавляем linux/ в пути импорта
linux_dir = Path(__file__).resolve().parent / "linux"
sys.path.insert(0, str(linux_dir))

from desktop_app import main

if __name__ == "__main__":
    main()
