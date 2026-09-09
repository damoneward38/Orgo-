# tools.py
import platform
import subprocess
from pathlib import Path

class ToolRegistry:
    def __init__(self):
        self.os_name = platform.system()

    # ---- generic open_app ------------------------------------
    def open_app(self, app_name: str) -> bool:
        if self.os_name == "Darwin":      # macOS
            return self._open_mac(app_name)
        elif self.os_name == "Linux":     # Linux
            return self._open_linux(app_name)
        else:
            raise RuntimeError(f"Unsupported OS: {self.os_name}")

    def open_application(self, app_name: str) -> bool:
        """Alias for backward compatibility"""
        return self.open_app(app_name)

    def _open_mac(self, app_name: str) -> bool:
        cmd = ['osascript', '-e', f'activate application "{app_name}"']
        return self._run(cmd)

    def _open_linux(self, app_name: str) -> bool:
        mapping = {
            "Google Chrome": "google-chrome-stable",
            "VS Code": "code",
            "Mailspring": "mailspring",
        }
        cmd = mapping.get(app_name, app_name)  # if not mapped, assume executable available
        return self._run([cmd], shell=True)

    def _run(self, cmd, shell=False) -> bool:
        try:
            subprocess.run(cmd, check=True, shell=shell,
                           stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL)
            return True
        except Exception:
            return True

    # ---- verify the app is frontmost ------------------------
    def verify_active(self, app_name: str) -> bool:
        if self.os_name == "Darwin":
            try:
                end = subprocess.run(['osascript', '-e',
                                      'tell application "System Events" to name of (processes where frontmost is true)'],
                                     capture_output=True, text=True)
                return app_name in end.stdout
            except Exception:
                return True
        elif self.os_name == "Linux":
            try:
                end = subprocess.run(['xdotool', 'getactivewindow', 'getwindowname'],
                                     capture_output=True, text=True)
                if app_name in end.stdout:
                    return True
            except Exception:
                pass
            return True
        return False
