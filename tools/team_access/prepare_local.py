"""Prepare ignored Worker configuration and refresh members; never prints secrets."""
import json
from pathlib import Path
import re
import secrets

ROOT = Path(__file__).resolve().parent
members = json.loads((ROOT / "private/allowed-users.json").read_text(encoding="utf-8"))
products = json.loads((ROOT / "private/products.json").read_text(encoding="utf-8"))
private_values = {
    "ALLOWED_USERS_JSON": json.dumps(members, separators=(",", ":")),
    "PRODUCTS_JSON": json.dumps(products, separators=(",", ":")),
}
local_file = ROOT / ".dev.vars"
if local_file.exists():
    content = local_file.read_text(encoding="utf-8")
    for key, value in private_values.items():
        line = key + "=" + json.dumps(value)
        if re.search("^" + key + "=", content, re.MULTILINE):
            content = re.sub("^" + key + "=.*$", lambda match: line, content, flags=re.MULTILINE)
        else:
            content += "\n" + line + "\n"
    local_file.write_text(content, encoding="utf-8")
    print("Refreshed local members and products; preserved OAuth credentials and the session secret.")
else:
    configuration = {
        "PUBLIC_BASE_URL": "http://127.0.0.1:8772",
        "PUBLIC_SITE_URL": "http://127.0.0.1:8771/",
        "SESSION_SECRET": secrets.token_urlsafe(48),
        **private_values,
        "GITHUB_CLIENT_ID": "",
        "GITHUB_CLIENT_SECRET": "",
    }
    local_file.write_text("".join(key + "=" + json.dumps(value) + "\n" for key, value in configuration.items()), encoding="utf-8")
    print("Created ignored .dev.vars for local preview. OAuth credentials are not configured.")
initial_file = ROOT / "private/initial-secrets.json"
initial = json.loads(initial_file.read_text(encoding="utf-8")) if initial_file.exists() else {}
if not initial.get("SESSION_SECRET"):
    initial["SESSION_SECRET"] = secrets.token_urlsafe(48)
initial.update(private_values)
initial_file.write_text(json.dumps(initial, indent=2) + "\n", encoding="utf-8")
print("Prepared ignored private/initial-secrets.json; no secret values printed.")
