import os
import pathlib
base = pathlib.Path(
    r"C:/Users/Thimmampalli Asritha/Desktop/Smart Waste/dataset")
for name in sorted([p.name for p in base.iterdir() if p.is_dir()]):
    d = base / name
    count = sum(1 for _ in d.rglob('*') if _.suffix.lower()
                in ['.jpg', '.jpeg', '.png'])
    print(name, count)
