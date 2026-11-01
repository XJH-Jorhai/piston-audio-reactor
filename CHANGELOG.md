# Changelog

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
