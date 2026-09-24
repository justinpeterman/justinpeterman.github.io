# Procedural hero workbench

An opaque tinted-teal dock contains an element tree, focused styles, and a rolling terminal. There is no heading overlay or free-floating decoration.

The workbench has eight deliberate steps per cycle. Its transcript alternates commands and results on successive beats, with a
deeper indentation on results and one occasional continuation line. A fixed
empty prompt and blinking block cursor sit below the rolling history. The cursor
is 4 × 8 CSS pixels, alternating 1000 ms visible and 1000 ms hidden; reduced
motion keeps it visible. The tree selection visits the parent, inspects a sibling
while its style rules receive focus, then returns to the original node and holds.
The tree itself stays anchored, with abstract self-closing leaf tags, paired parent
tags, and one attribute segment. Node selection changes the style values; matched
property marks and a struck-through declaration suggest a CSS override. The CSS
pane uses two selector/rule blocks, curly braces, declaration punctuation, and
small outlined squares before properties. There are no color swatches or DOM
checkboxes. The terminal contains
only segmented command/result rows, prompt strokes, and a soft cursor. It never contains tree
branches, layout diagrams, or readable text.

The work is illustrative geometry: no live telemetry, readable text, actual tool
branding, or fake source code. It borrows familiar tool behavior rather than
pretending to be a functioning IDE or design application. Event names in the
source are for maintainers and tests; they are never rendered to the canvas.

## Structure

- `WorkbenchBanner.astro`: decorative, aria-hidden canvas and custom-element lifecycle.
- `renderer.ts`: one animation loop, palette, measurement, visibility,
  reduced motion, and cleanup.
- `scene.ts`: config and geometry types.
- `workbench.ts`: opaque dock drawing, with no heading decoration.
- `workbench-model.ts`: measured right-side placement and seeded eight-beat transcript.
- `primitives.ts`: crisp lines, rectangles, and the background grid.

## Controls

| Control | Default | Purpose |
| --- | --- | --- |
| `gridSpacing` | 24 CSS px | Grid unit; geometry uses half-grid units |
| `gridOpacity` | 0.045 | Faint background marks |
| `motifOpacity` | 0.28 | Maximum decorative motif opacity |
| `motionSpeed` | 2 | Base cadence multiplier; one operation every 1.05 seconds at 2 |
| `logIntervalMs` | 2100 | Time per operation before the speed multiplier |
| `seed` | 333 | Workbench transcript vocabulary |
| `maxDpr` | 2 | Maximum canvas backing-store scale |
| `introDurationMs` | Infinity | Continuous playback; finite values stop after that active-time budget |
| `safePadding` | 16 CSS px | Motif clearance around actual heading text, halved on mobile |
| `smallScreenWidth` | 600 CSS px | Omit the entire workbench below this container width |
| `workbench.widthFraction` | 0.34 | Preferred dock width, reduced to clear actual heading lines |
| `workbench.rowHeight` | 28 CSS px | Desktop transcript/inspector rhythm; compact inspector adapts to height |
| `workbench.hoverSpeedMultiplier` | 5 | Pointer-hover cadence multiplier within the measured desktop dock |

Palette values in `renderer.ts` read the site's `--ink`, `--teal`, and
`--teal-subtle` tokens. The opaque dock shares the metadata/facts surface tint;
selection and internal geometry use ink. The original heading remains live HTML, with unchanged typography,
spacing and responsive rules. The grid is unmasked behind the heading.

DOM Range measurements keep the dock clear of the live heading. Workbench docks to the right of the widest measured text line, flush to the
top, right and bottom banner edges. Its opaque tinted-teal ground covers the grid;
internal marks and the selection accent use ink. It omits styles
when only a compact tree and terminal fit. On phones it shows only the static grid;
there is no terminal, inspector, or animation loop while the composition is absent.
There is no outline, tint, mask, or caliper around the heading. The canvas never
determines layout height.

## Motion and fallback

An absent workbench stops the loop. Offscreen and hidden-document
pauses avoid background work. The workbench only repaints when its inspection
step or cursor visibility changes; measurement forces a repaint. A single RAF
loop tracks elapsed time, without redrawing unchanged frames. Hidden-document
pauses reset frame timestamps, preventing catch-up bursts. Reduced motion renders
a deterministic still, and changing the preference live uses the media-query event
state. Listeners, RAF, and observers are removed on disconnection. Browser history
caching and canvas context loss/restoration are handled too.
Fine-pointer hover over the measured workbench bounds increases its cadence without
changing the animation timeline abruptly. Touch and reduced-motion users never
receive the speed-up. The cursor uses unscaled active time, so hover accelerates
inspection and output without accelerating its blink.

When JavaScript or Canvas 2D is unavailable, the existing CSS grid fallback
remains visible. Successful initialization covers it with an opaque canvas.
No new runtime dependencies were added.

## Verification

```sh
mise run build
mise run test
```

Tests cover redraw keys and workbench wide/compact/mobile placement, clearance for a longer second heading
line, seeded transcript retention, and style-focus ordering.

Browser verification should inspect the workbench over a complete operation cycle,
compare foreground geometry at 320, 390, 768, 1024 and 1440px, and exercise
reduced motion, no-JS/null-context fallback, DPR capping, visibility, and cleanup.
The project has no dedicated lint or typecheck script.
