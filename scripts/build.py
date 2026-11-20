"""Check the buildless application and prepare its portable source bundle."""
import json
from pathlib import Path
import subprocess
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
# The portable source ZIP already contains the website copies.
if (root / "presentation").is_dir():
    for name in ("QUANTARA.pdf", "QUANTARA.pptx"):
        shutil.copyfile(root / "presentation" / name, dist / "presentation" / name)
for module in sorted(dist.glob("*.js")):
    subprocess.run(["node", "--check", str(module)], check=True)
for file in ["index.html", "style.css", "app.js", "oracle.js", "ahead.js", "graph-data.js"]:
    if not (dist / file).is_file():
        raise FileNotFoundError(file)
json.loads((dist / "sample-observations.json").read_text())
paths = [root / name for name in (".gitignore", "README.md", "package.json", "package-lock.json")]
for folder in ("dist", "docs", "research", "server", "scripts", "qa", "tests"):
    paths.extend(p for p in (root / folder).rglob("*") if p.is_file()
                 and p.suffix not in {".zip", ".tmp", ".pyc"} and "__pycache__" not in p.parts)
target = dist / "quantara-source.zip"
temp = target.with_suffix(".tmp")
with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(paths):
        entry = zipfile.ZipInfo("quantara/" + path.relative_to(root).as_posix(), (2025, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(entry, path.read_bytes())
with zipfile.ZipFile(temp) as archive:
    if archive.testzip():
        raise ValueError("Source archive failed checksum validation")
temp.replace(target)
print(f"Checked static modules and packaged {len(paths)} source files.")
