# Changelog

## 0.3.0-corridor.2 — continuous mode switching

- Keep one media element and Web Audio graph while switching linear, lying and corridor renderers in the current tab.
- Preserve playback position, pause state, local tracks and transport settings, with History API back/forward navigation.
- Abort the outgoing view's event handlers/animation loop and retain each layout's camera and response state in this session.
- Add the user-recorded 播放器视角 as a camera-only shortcut, independent of channels and mapping.

## 0.3.0-corridor.1 — experiment/perspective-corridor

- Sync 4–64 bands, free orbit/pan/zoom, editable loudness endpoints and response curvature from the modern linear route.
- Default low-level pose to progress 38%, peak to progress 0%, with direct monotonic physical travel and browser persistence.
- Add an independent developer camera library with perspective distance and JSON import/export.
- Preserve the original close-foreground corridor preset, six-face perspective rendering and depth haze; add safe clipping for free camera angles and CPU rendering.
- Fit frequency bands without horizontal scrolling, remove scene ordinals/subtitle, and use the shared page title.
- Keep v0.2.0-corridor.1 tagged for comparison and rollback.

## 0.2.0-corridor.1 — experiment/perspective-corridor

- Independent worktree from the v0.1.0-linear baseline.
- Real perspective corridor camera; foreground machines receive over five times the projected height of the far end.
- Six-face blocks, continuous floor guides, mild depth haze, and perspective-correct CPU/GPU rendering.
- Adaptive framing keeps all sixteen machines inside the overview at all stroke values.
- Original direct loudness mapping, direction, 38% rest posture and music preserved.


## 0.1.0

- Independent project based on the frozen generator v1.2.0.
- Sixteen original Minecraft machines in a linear array, each assigned a logarithmic frequency band from 40 Hz to 16 kHz.
- Direct RMS spectral loudness to central golem position: high loudness extends, low loudness retracts, and side blocks move in opposition. No periodic carrier or preset cycle.
- Silence returns to the exact 38% generator posture; symmetric position smoothing reduces jitter.
- Default Assumptions audio, local audio import, native seeking and volume controls.
- Shared WebGL depth rendering with CPU fallback, stationary-frame reuse, overview and detail views, panning, zoom and frequency selection.
- Attribution for Andy Wang's MIT reference project and the original Minecraft texture mirror.
