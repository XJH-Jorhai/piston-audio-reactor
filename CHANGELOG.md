# Changelog

## 0.3.0-lying-eight.10 — continuous mode switching

- Keep one media element and Web Audio graph while switching linear, lying and corridor renderers in the current tab.
- Preserve playback position, pause state, local tracks and transport settings, with History API back/forward navigation.
- Abort the outgoing view's event handlers/animation loop and retain each layout's camera and response state in this session.

## 0.3.0-lying-eight.9 — experiment/lying-eight

- Unify page/browser title as 让声谱，推动开凿。 and remove the descriptive subtitle.
- Fit every frequency band within the available width with count-aware spacing and zero fixed dense-band insets.

## 0.3.0-lying-eight.8 — experiment/lying-eight

- Promote six user-recorded cameras into camera-only shortcuts, independent of channel count and response parameters.
- Reanchor shortcuts to the current array or focused station; keep the selected camera when changing channel count.
- Hide the lying developer panel while retaining loudness mapping.
- Introduce shared layout profiles so the standing linear route can use the same renderer and controls.

## 0.3.0-lying-eight.7 — experiment/lying-eight

- Collapsible developer camera library: name/capture multiple views, restore, remove, export one/all and import versioned JSON.
- Include complete camera composition, viewport, orbit pivot, channel count and response settings; retain records in browser storage.
- Proportional composition restore across viewports and stable free-view resizing.
- Remove rendered channel ordinals, spectrum codes and the numbered corner legend.

## 0.3.0-lying-eight.6 — experiment/lying-eight

- Default silence/low-level pose is generator progress 32; peak loudness maps to progress 0 (fully extended central body).
- Editable low/high endpoint poses and response curvature, automatically retained in this browser with a reset button.
- Direct interpolation of physical endpoint extensions avoids generator timing plateaus and the old opposite-direction dip.
- Increase channel limit to 64 and add a shortcut; grow GPU vertex storage when required.

## 0.3.0-lying-eight.5 — experiment/lying-eight

- Add a 32-channel shortcut beside the 8/16-channel controls.

## 0.3.0-lying-eight.4 — experiment/lying-eight

- Fit recomputes the base scale at the current orbit angle, so end-on views correctly fill the available canvas.

## 0.3.0-lying-eight.3 — experiment/lying-eight

- Adjustable 4–32 spectrum channels with 8/16 shortcuts and count URL parameter.
- Live FFT repartition and array rebuild preserve camera angles and audio playback, fitting the complete new array.
- Dynamic floor, labels, frequency meters and proportional low/mid/high colors.
- Safe camera clipping for long arrays, including end-on free views; scrollable dense meters on narrow displays.

## 0.3.0-lying-eight.2 — experiment/lying-eight

- Free orbit around the array or selected machine with 360-degree azimuth and −89° to 89° elevation.
- Drag rotation, Shift/right-button drag panning, explicit pan tool, wheel zoom and two-finger pinch/pan.
- Keyboard camera controls, visible free-camera state and one-click preset restoration.
- Camera angles survive resizing; orbit preserves zoom, pan and audio playback.
- Additional camera tests cover all sides, near-pole views, complete turns and invalid input.

## 0.3.0-lying-eight.1 — experiment/lying-eight

- Separate worktree based on v0.2.0-corridor.1; previous routes remain available.
- Eight machines rigidly rotated 90 degrees into three parallel vertical piston lanes.
- Equal-size orthographic side-oblique and front-oblique views; the front view looks across the long edge, retaining a 52-degree elevation.
- Correctly rotated face textures, fixed housings/pumpkins, fully retractable rods, arm shading and height-linked shadows.
- Eight direct logarithmic loudness bands, original rest posture and Assumptions audio.
- Responsive full-stroke framing, URL view selection, GPU depth and CPU fallback.


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
