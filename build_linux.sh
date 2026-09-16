#!/usr/bin/env bash
set -e

# ==============================================================================
# Шизо 95: Клинический синтезатор v4.2
# Автоматический скрипт сборки Shizo95-x86_64.AppImage для Linux
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${ROOT_DIR}/linux/build_tmp"
APPDIR="${BUILD_DIR}/AppDir"
OUTPUT_APPIMAGE="${ROOT_DIR}/Shizo95-x86_64.AppImage"
TMP_APPIMAGE="${BUILD_DIR}/Shizo95-x86_64.AppImage.tmp"

echo "===================================================================="
echo " [1/5] Инициализация окружения сборки Shizo 95 (.AppImage)"
echo "===================================================================="

if ! command -v python3 &> /dev/null; then
    echo "Ошибка: python3 не установлен в системе."
    exit 1
fi

mkdir -p "${BUILD_DIR}"

VENV_DIR="${BUILD_DIR}/venv"
if [ ! -d "${VENV_DIR}" ]; then
    echo "Создание изолированного venv с доступом к WebKitGTK (--system-site-packages)..."
    python3 -m venv --system-site-packages "${VENV_DIR}"
fi

source "${VENV_DIR}/bin/activate"

echo "Установка/проверка зависимостей pywebview и pyinstaller..."
pip install --upgrade pip
pip install pywebview pyinstaller

echo "===================================================================="
echo " [2/5] Компиляция бинарника через PyInstaller"
echo "===================================================================="

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
    "${ROOT_DIR}/linux/desktop_app.py"

echo "===================================================================="
echo " [3/5] Формирование структуры AppDir"
echo "===================================================================="

mkdir -p "${APPDIR}/usr/bin"
mkdir -p "${APPDIR}/usr/share/applications"
mkdir -p "${APPDIR}/usr/share/icons/hicolor/64x64/apps"

# Копирование скомпилированных бинарных файлов и ассетов
cp -r "${BUILD_DIR}/dist/shizo95/"* "${APPDIR}/usr/bin/"
cp "${ROOT_DIR}/linux/shizo95.desktop" "${APPDIR}/"
cp "${ROOT_DIR}/linux/shizo95.desktop" "${APPDIR}/usr/share/applications/"
cp "${ROOT_DIR}/linux/shizo95.png" "${APPDIR}/"
cp "${ROOT_DIR}/linux/shizo95.png" "${APPDIR}/usr/share/icons/hicolor/64x64/apps/"
cp "${ROOT_DIR}/linux/shizo95.png" "${APPDIR}/.DirIcon"

# Создание универсального загрузчика AppRun с поддержкой Wayland/X11
cat << 'EOF' > "${APPDIR}/AppRun"
#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "${0}")")"
export PATH="${HERE}/usr/bin:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/bin/_internal:${HERE}/usr/lib:${LD_LIBRARY_PATH}"
if [ -d "${HERE}/usr/bin/_internal/gi_typelibs" ]; then
    export GI_TYPELIB_PATH="${HERE}/usr/bin/_internal/gi_typelibs:${GI_TYPELIB_PATH}"
fi

# На сессиях Wayland (KDE / GNOME) используем XWayland (GDK_BACKEND=x11) для предотвращения Error 71
if [ -n "${WAYLAND_DISPLAY}" ] && [ -n "${DISPLAY}" ] && [ -z "${GDK_BACKEND}" ]; then
    export GDK_BACKEND=x11
fi

export WEBKIT_DISABLE_DMABUF_RENDERER=1

exec "${HERE}/usr/bin/shizo95" "$@"
EOF
chmod +x "${APPDIR}/AppRun"

echo "===================================================================="
echo " [4/5] Подготовка appimagetool"
echo "===================================================================="

APPIMAGETOOL_BIN=""

if command -v appimagetool &> /dev/null; then
    APPIMAGETOOL_BIN="appimagetool"
    echo "Используется системный appimagetool"
else
    APPIMAGETOOL_LOCAL="${BUILD_DIR}/appimagetool-x86_64.AppImage"
    if [ ! -f "${APPIMAGETOOL_LOCAL}" ]; then
        echo "Загрузка appimagetool с GitHub..."
        curl -Lo "${APPIMAGETOOL_LOCAL}" \
            "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" || {
            curl -Lo "${APPIMAGETOOL_LOCAL}" \
                "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
        }
        chmod +x "${APPIMAGETOOL_LOCAL}"
    fi
    APPIMAGETOOL_BIN="${APPIMAGETOOL_LOCAL}"
fi

echo "===================================================================="
echo " [5/5] Упаковка в ${OUTPUT_APPIMAGE}"
echo "===================================================================="

export ARCH=x86_64
rm -f "${TMP_APPIMAGE}"

# Упаковываем AppDir в AppImage во временный файл во избежание Text file busy
if "${APPIMAGETOOL_BIN}" --version &> /dev/null; then
    "${APPIMAGETOOL_BIN}" "${APPDIR}" "${TMP_APPIMAGE}"
else
    "${APPIMAGETOOL_BIN}" --appimage-extract-and-run "${APPDIR}" "${TMP_APPIMAGE}"
fi

chmod +x "${TMP_APPIMAGE}"
# Атомарная замена файла
mv -f "${TMP_APPIMAGE}" "${OUTPUT_APPIMAGE}"

echo "===================================================================="
echo " Сборка завершена успешно!"
echo " Файл: ${OUTPUT_APPIMAGE}"
echo "===================================================================="
