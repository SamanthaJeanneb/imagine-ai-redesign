"""Report modules under src/ that nothing else imports."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

files = sorted(p for p in SRC.rglob("*") if p.suffix in {".ts", ".tsx"})
text = {p: p.read_text() for p in files}

# Next.js owns everything routable plus the instrumentation/middleware hooks.
ENTRY = {"page.tsx", "layout.tsx", "template.tsx", "loading.tsx", "error.tsx",
         "not-found.tsx", "route.ts", "global-error.tsx", "middleware.ts",
         "instrumentation.ts", "sitemap.ts", "robots.ts", "opengraph-image.tsx"}

imports = set()
for body in text.values():
    for spec in re.findall(r"""from\s+["']([^"']+)["']""", body):
        imports.add(spec)
    for spec in re.findall(r"""import\(["']([^"']+)["']\)""", body):
        imports.add(spec)


def referenced(path: Path) -> bool:
    alias = "@/" + path.relative_to(SRC).with_suffix("").as_posix()
    stem = path.with_suffix("").name
    for spec in imports:
        if spec == alias or spec.endswith("/" + stem) or spec == "./" + stem:
            return True
    return False


orphans = [
    p for p in files
    if p.name not in ENTRY and not referenced(p)
]

if not orphans:
    print("No orphan modules.")
else:
    print(f"{len(orphans)} orphan modules\n")
    for p in sorted(orphans, key=lambda p: -len(text[p].splitlines())):
        print(f"{len(text[p].splitlines()):6}  {p.relative_to(ROOT)}")
    print(f"\n{sum(len(text[p].splitlines()) for p in orphans)} lines total")
