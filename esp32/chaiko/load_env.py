Import("env")

from pathlib import Path

project_dir = Path(env.subst("$PROJECT_DIR"))
env_file = project_dir / ".env"

values = {}
if env_file.exists():
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")

def c_string(value):
    return value.replace("\\", "\\\\").replace('"', '\\"')


ip_address = values.get("IP_ADDRESS")
if not ip_address:
    raise RuntimeError("IP_ADDRESS must be set in .env")

wifi_ssid = values.get("WIFI_SSID")
wifi_password = values.get("WIFI_PASSWORD")
if not wifi_ssid or not wifi_password:
    raise RuntimeError("WIFI_SSID and WIFI_PASSWORD must be set in .env")

credentials_header = project_dir / "include" / "wifi_credentials.h"
credentials_header.write_text(
    "#ifndef WIFI_CREDENTIALS_H\n"
    "#define WIFI_CREDENTIALS_H\n\n"
    f"#define IP_ADDRESS \"{c_string(ip_address)}\"\n"
    f"#define WIFI_SSID \"{c_string(wifi_ssid)}\"\n"
    f"#define WIFI_PASSWORD \"{c_string(wifi_password)}\"\n\n"
    "#endif\n",
    encoding="ascii",
)
