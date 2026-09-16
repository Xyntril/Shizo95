#!/usr/bin/env bash
set -e

# ==============================================================================
# Скрипт сборки Shizo95 в формат AppImage для Linux (x86_64)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build_tmp"
APPDIR="${BUILD_DIR}/AppDir"
OUTPUT_APPIMAGE="${ROOT_DIR}/Shizo95-x86_64.AppImage"

echo "===================================================="
echo " [1/5] Подготовка сборочного окружения"
echo "===================================================="

cd "${SCRIPT_DIR}"

if ! command -v python3 &> /dev/null; then
    echo "Ошибка: python3 не найден в системе."
    exit 1
fi

VENV_DIR="${BUILD_DIR}/venv"
if [ ! -d "${VENV_DIR}" ]; then
    echo "Создание venv с поддержкой системных библиотек (--system-site-packages)..."
    python3 -m venv --system-site-packages "${VENV_DIR}"
fi

source "${VENV_DIR}/bin/activate"

echo "Проверка зависимостей pywebview и pyinstaller..."
pip install --upgrade pip
pip install pywebview pyinstaller

echo "===================================================="
echo " [2/5] Сборка исполняемого файла через PyInstaller"
echo "===================================================="

rm -rf "${BUILD_DIR}/dist" "${BUILD_DIR}/build" "${APPDIR}"

pyinstaller --noconfirm \
    --onedir \
    --windowed \
    --name "shizo95" \
    --distpath "${BUILD_DIR}/dist" \
    --workpath "${BUILD_DIR}/build" \
    --add-data "${ROOT_DIR}/web:web" \
    --collect-all "gi" \
    --collect-all "webview" \
    --hidden-import "gi" \
    --hidden-import "gi.repository.Gtk" \
    --hidden-import "gi.repository.WebKit2" \
    --hidden-import "gi.repository.GLib" \
    --hidden-import "gi.repository.GObject" \
    "${SCRIPT_DIR}/desktop_app.py"

echo "===================================================="
echo " [3/5] Формирование структуры AppDir"
echo "===================================================="

mkdir -p "${APPDIR}/usr/bin"
mkdir -p "${APPDIR}/usr/share/applications"
mkdir -p "${APPDIR}/usr/share/icons/hicolor/64x64/apps"

# Копируем скомпилированное приложение
cp -r "${BUILD_DIR}/dist/shizo95/"* "${APPDIR}/usr/bin/"

# Копируем .desktop и иконки
cp "${SCRIPT_DIR}/shizo95.desktop" "${APPDIR}/"
cp "${SCRIPT_DIR}/shizo95.desktop" "${APPDIR}/usr/share/applications/"
cp "${SCRIPT_DIR}/shizo95.png" "${APPDIR}/"
cp "${SCRIPT_DIR}/shizo95.png" "${APPDIR}/usr/share/icons/hicolor/64x64/apps/"
cp "${SCRIPT_DIR}/shizo95.png" "${APPDIR}/.DirIcon"

# Создаём стандартный исполняемый скрипт AppRun
cat << 'EOF' > "${APPDIR}/AppRun"
#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/bin/_internal:${HERE}/usr/lib:${LD_LIBRARY_PATH}"
if [ -d "${HERE}/usr/bin/_internal/gi_typelibs" ]; then
    export GI_TYPELIB_PATH="${HERE}/usr/bin/_internal/gi_typelibs:${GI_TYPELIB_PATH}"
fi

# На сессиях Wayland (KDE / GNOME) движок WebKitGTK падает при прямой отрисовке (Error 71).
# Используем стабильный бэкенд XWayland (GDK_BACKEND=x11)
if [ -n "${WAYLAND_DISPLAY}" ] && [ -n "${DISPLAY}" ] && [ -z "${GDK_BACKEND}" ]; then
    export GDK_BACKEND=x11
fi

export WEBKIT_DISABLE_DMABUF_RENDERER=1

exec "${HERE}/usr/bin/shizo95" "$@"
EOF
chmod +x "${APPDIR}/AppRun"

echo "===================================================="
echo " [4/5] Подготовка утилиты appimagetool"
echo "===================================================="

APPIMAGETOOL_BIN=""

if command -v appimagetool &> /dev/null; then
    APPIMAGETOOL_BIN="appimagetool"
    echo "Используется системный appimagetool"
else
    APPIMAGETOOL_LOCAL="${BUILD_DIR}/appimagetool-x86_64.AppImage"
    if [ ! -f "${APPIMAGETOOL_LOCAL}" ]; then
        echo "Скачивание appimagetool..."
        curl -Lo "${APPIMAGETOOL_LOCAL}" \
            "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" || {
            curl -Lo "${APPIMAGETOOL_LOCAL}" \
                "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
        }
        chmod +x "${APPIMAGETOOL_LOCAL}"
    fi
    APPIMAGETOOL_BIN="${APPIMAGETOOL_LOCAL}"
fi

echo "===================================================="
echo " [5/5] Упаковка в ${OUTPUT_APPIMAGE}"
echo "===================================================="

export ARCH=x86_64

# Упаковываем AppDir в AppImage
if "${APPIMAGETOOL_BIN}" --version &> /dev/null; then
    "${APPIMAGETOOL_BIN}" "${APPDIR}" "${OUTPUT_APPIMAGE}"
else
    echo "Запуск appimagetool с флагом --appimage-extract-and-run..."
    "${APPIMAGETOOL_BIN}" --appimage-extract-and-run "${APPDIR}" "${OUTPUT_APPIMAGE}"
fi

chmod +x "${OUTPUT_APPIMAGE}"

echo "===================================================="
echo " Готово! Файл успешно собран:"
echo " ${OUTPUT_APPIMAGE}"
echo "===================================================="
