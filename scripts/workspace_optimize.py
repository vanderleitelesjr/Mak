#!/usr/bin/env python3
"""Workspace image optimizer — the shared sync rule for both agents.

Converts PNG images inside workspace/ entities to WebP (visually lossless-ish,
~10x smaller) so generated images can be committed to git and seen from both
sides (local workstation and remote repository). PNG originals stay on the machine
that produced them (gitignored); WebP siblings are versioned.

Also rewrites `<name>.png` references to `<name>.webp` inside the entity's
*.html reports for every file it converted, so reports render on both sides.

Usage:
  python scripts/workspace_optimize.py --last 10     # newest N entities (default 10)
  python scripts/workspace_optimize.py --entity 2026-06-19_japanese-river-town
  python scripts/workspace_optimize.py --all

Rule of the house: as soon as images are generated into a workspace entity,
run this script and commit. Videos are NOT versioned unless the user explicitly
asks for a specific project (then whitelist it in .gitignore).

Requires: Pillow (pip install pillow / apt install python3-pil)
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
WORKSPACE = REPO / "workspace"
QUALITY = 88


def pick_entities(args) -> list[Path]:
    if args.entity:
        p = WORKSPACE / args.entity
        if not p.is_dir():
            sys.exit(f"entity not found: {p}")
        return [p]
    state = json.loads((WORKSPACE / "workspace.json").read_text(encoding="utf-8"))
    folders = []
    for e in sorted(state["entities"], key=lambda e: e.get("created", ""), reverse=True):
        p = WORKSPACE / e.get("folder", "")
        if p.is_dir() and p not in folders:
            folders.append(p)
    return folders if args.all else folders[: args.last]


def convert_entity(entity: Path) -> tuple[int, int, int]:
    converted, src_bytes, dst_bytes = 0, 0, 0
    renamed: set[str] = set()
    for png in entity.rglob("*.png"):
        webp = png.with_suffix(".webp")
        if webp.exists() and webp.stat().st_mtime >= png.stat().st_mtime:
            renamed.add(png.name)
            continue
        try:
            with Image.open(png) as im:
                im.save(webp, "WEBP", quality=QUALITY, method=6)
        except Exception as exc:  # corrupt/huge file — skip, keep going
            print(f"  skip {png.relative_to(WORKSPACE)}: {exc}")
            continue
        converted += 1
        src_bytes += png.stat().st_size
        dst_bytes += webp.stat().st_size
        renamed.add(png.name)
    # rewrite references in reports so they render from the webp siblings
    for html in entity.rglob("*.html"):
        text = html.read_text(encoding="utf-8", errors="ignore")
        new = text
        for name in renamed:
            new = new.replace(name, name[:-4] + ".webp")
        if new != text:
            html.write_text(new, encoding="utf-8")
    return converted, src_bytes, dst_bytes


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--last", type=int, default=10, help="newest N entities (default 10)")
    g.add_argument("--entity", help="single entity folder name")
    g.add_argument("--all", action="store_true", help="every entity")
    args = ap.parse_args()

    total_c, total_src, total_dst = 0, 0, 0
    for entity in pick_entities(args):
        c, s, d = convert_entity(entity)
        total_c += c
        total_src += s
        total_dst += d
        if c:
            print(f"{entity.name}: {c} png -> webp ({s/2**20:.0f} MB -> {d/2**20:.0f} MB)")
    print(f"\nTOTAL: {total_c} converted, {total_src/2**20:.0f} MB png -> {total_dst/2**20:.0f} MB webp")


if __name__ == "__main__":
    main()
