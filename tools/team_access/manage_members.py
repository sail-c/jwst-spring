"""Manage the server-side GitHub allowlist without rebuilding the website."""
import argparse
import json
import os
from pathlib import Path
import re
import tempfile

import requests

DEFAULT = Path(__file__).resolve().parent / "private/allowed-users.json"


def save(path, users):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, suffix=".tmp", delete=False) as output:
        json.dump({"users": users}, output, ensure_ascii=False, indent=2)
        output.write("\n")
        temporary = output.name
    os.replace(temporary, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=Path(os.environ.get("ALLOWED_USERS_PATH", DEFAULT)))
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list")
    commands.add_parser("add").add_argument("username")
    commands.add_parser("remove").add_argument("username_or_id")
    arguments = parser.parse_args()
    try:
        users = json.loads(arguments.file.read_text(encoding="utf-8"))["users"] if arguments.file.exists() else []
        if arguments.command == "add":
            username = arguments.username
            if not re.fullmatch(r"[A-Za-z0-9](?:-?[A-Za-z0-9]){0,38}", username):
                parser.error("Invalid GitHub username")
            response = requests.get("https://api.github.com/users/" + username,
                                    headers={"Accept": "application/vnd.github+json", "User-Agent": "JWST-SPRING-team-access"},
                                    timeout=15)
            response.raise_for_status()
            profile = response.json()
            identifier = profile["id"]
            if type(identifier) is not int or identifier <= 0:
                parser.error("GitHub did not return a valid account ID")
            member = {"id": identifier, "login": profile["login"]}
            users = [user for user in users if user["id"] != identifier] + [member]
            save(arguments.file, users)
            print("Added " + member["login"] + " (" + str(identifier) + ")")
        elif arguments.command == "remove":
            target = arguments.username_or_id.casefold()
            remaining = [user for user in users if user["login"].casefold() != target and str(user["id"]) != target]
            if len(remaining) == len(users):
                parser.error("That account is not in the allowlist")
            save(arguments.file, remaining)
            print("Removed " + arguments.username_or_id)
        else:
            for user in users:
                print(user["login"] + " (" + str(user["id"]) + ")")
            print(str(len(users)) + " allowed member(s)")
    except (OSError, ValueError, KeyError, TypeError, requests.RequestException) as error:
        parser.exit(1, "Could not update members: " + type(error).__name__ + "\n")


if __name__ == "__main__":
    main()
