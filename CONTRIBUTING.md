# Contributing

Thanks for your interest in Ephemera.

## Setup

```bash
git clone https://github.com/majiayu000/ephemera.git
cd ephemera
python3 -m http.server 8000
```

Open http://localhost:8000/ to browse the gallery. There is no build step and no dependencies.

## Check

CI syntax-checks every JavaScript file. Run the same check locally before opening a pull request:

```bash
for f in $(git ls-files '*.js'); do node --input-type=module --check < "$f" || echo "FAIL $f"; done
```

Then open the piece you changed in a browser and confirm the console shows no errors.

## Guidelines

- Keep pieces self-contained: no image, audio, or font assets; generate everything in code.
- Keep each file under 200 lines; split into modules when a piece grows.
- Shared WebGL helpers live in `shared/glkit.js`; reuse them instead of duplicating boilerplate.
- New pieces need a card in `index.html` and a row in both READMEs.

## Pull requests

Describe what changed and how you verified it (browser, screenshots or a short recording for visual changes).
