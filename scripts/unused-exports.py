"""Report exported names that nothing else in src/ imports."""

import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

EXPORT = re.compile(
    r"^export\s+(?:declare\s+)?"
    r"(?:async\s+)?"
    r"(?:function|const|let|var|class|interface|type|enum)\s+"
    r"([A-Za-z_$][\w$]*)",
    re.M,
)
EXPORT_LIST = re.compile(r"^export\s*\{([^}]*)\}", re.M)

files = sorted(p for p in SRC.rglob("*") if p.suffix in {".ts", ".tsx"})
text = {p: p.read_text() for p in files}

# Next.js reserves these: the framework imports them, not our code.
RESERVED = {"metadata", "viewport", "generateMetadata", "generateStaticParams",
            "dynamic", "revalidate", "runtime", "default"}

exports = defaultdict(list)
for path, body in text.items():
    names = set(EXPORT.findall(body))
    for group in EXPORT_LIST.findall(body):
        for part in group.split(","):
            part = part.strip().split(" as ")[-1].strip()
            if part and part != "type":
                names.add(part)
    for name in names - RESERVED:
        exports[name].append(path)

unused = defaultdict(list)
for name, owners in exports.items():
    word = re.compile(r"\b" + re.escape(name) + r"\b")
    for owner in owners:
        # A name its own module still uses -- to build an exported aggregate,
        # say -- is private, not dead. Only the lone declaration counts.
        if len(word.findall(text[owner])) > 1:
            continue
        if any(
            word.search(body) for path, body in text.items() if path != owner
        ):
            continue
        unused[owner].append(name)

if not unused:
    print("No unused exports.")
    sys.exit(0)

total = sum(len(names) for names in unused.values())
print(f"{total} unused exports across {len(unused)} files\n")
for path in sorted(unused, key=lambda p: -len(unused[p])):
    rel = path.relative_to(ROOT)
    print(f"{rel}  ({len(unused[path])})")
    for name in sorted(unused[path]):
        line = next(
            (i for i, text_line in enumerate(text[path].splitlines(), 1)
             if re.search(r"\b" + re.escape(name) + r"\b", text_line)
             and text_line.lstrip().startswith("export")),
            "?",
        )
        print(f"    {rel}:{line}  {name}")
    print()
