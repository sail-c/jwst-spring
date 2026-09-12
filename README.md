# JWST-SPRING

Website for **Spatially Pixel-level Resolved Investigations into Nascent Galaxies with JWST**.

## Version 2.0.2

Version 2.0.2 adds a full-resolution interactive GOODS-S FITSmap with RGB,
F150W, F277W, and F444W layers. It also includes the reorganized Observations
and Data Release pages and the latest Team updates.

## Version 2.0.0

Version 2.0.0 is a complete redesign of the JWST-SPRING website. It introduces
a responsive navigation system, reorganized science content, a field-image
carousel, and a new team directory.

The Sphinx source is organized into seven top-level sections: Home, Overview,
Instruments, Observations, Data Release, FITSmap, and Team.

## Local preview

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m sphinx -b html -W --keep-going docs docs\_build\html
```

Open `docs/_build/html/index.html`, or serve the directory with a local HTTP
server to test navigation.
