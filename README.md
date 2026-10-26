# Bangladesh Landmarks — ASPA AGM 2026 LED Wall

A full-screen, continuously animated line-art panorama of Bangladesh's
national landmarks, built as a live event backdrop for the **3rd Annual
General Meeting of Round Table Bangladesh (ASPA AGM 2026)** — designed for
a 2:1 LED wall at 1920 × 960.

![preview](./RTI.svg)

## What it is

A single-page, zero-dependency *motion-graphics package* implemented as a
real-time web experience:

- **Background — "Landmarks of Bangladesh" line-art panorama.** A layered
  Canvas2D drawing of six national landmarks: the National Martyrs'
  Memorial, Shaheed Minar and Lalbagh Fort on the left; the Sixty Dome
  Mosque, Ahsan Manzil and Jatiya Sangsad Bhaban on the right. Fine ivory
  and gold line work on deep ink green, framed by a faint frieze of
  Mughal arches, a distant dome-and-minaret skyline and a large shapla
  watermark. The scene draws itself in once, stroke by stroke, with a
  small gold pen tip; then the panorama pans continuously and loops
  seamlessly, while shapla, jute leaves, birds and geometric motifs float
  across the sky. The centre stays clear for event content.
- **Foreground — five-stage identity sequence** on an independent
  timeline controller (8 s headline · 6 s RTBD · 8 s trio · 10 s five
  clubs · 8 s finale, 1 s crossfades, endless seamless loop). Background
  never resets between scenes.

No WebGL, no frameworks, no build step. Fonts, logos and code are plain
files; palette derives from the club rondels (ink green, ivory, gold,
red, teal).

## Run (presentation mode)

Open `index.html` in any Chromium browser → press `F` for fullscreen.
It autoplays and loops forever; no interaction needed.

For a proper stage preview serve the folder:

```
python -m http.server 8080
# → http://localhost:8080
```

### Test locks

| URL | Behaviour |
|---|---|
| `?bt=14` | freezes the landmark reveal + parallax clock at 14 s |
| `?ft=31` | pins the foreground to the "five logos" scene (end states) |
| `?loop=0` | hold on the finale instead of looping |
| `&debug` combo | combine both locks for deterministic stills |

With `prefers-reduced-motion: reduce`, the landmark panorama holds a fully
drawn still frame; the foreground sequence keeps its scene changes.

## Files

| Path | Role |
|---|---|
| `index.html` | stage, foreground scenes, timeline controller |
| `landmarks-bg.js` | landmark panorama engine (`LandmarkBG`) |
| `*.svg`, `fiveclubs.png` | official club marks (never recolor/crop these) |
| `fraunces.woff2`, `nunito.woff2` | display + label typefaces |

## Deployment

Static hosting only — vercel/netlify/GH pages all work. On Vercel:
import the repo, framework "Other", no build command. Or CLI:
`vercel deploy --prod`.

## Provenance

- Artwork: 100% procedural Canvas2D paths authored in code.
- Logos: original asset files from the Round Table Bangladesh event
  organizer; rendered verbatim.
- Type: Fraunces 900 (Google Fonts), Nunito Sans (Google Fonts).
