# Faceless Shorts — render on GitHub Actions (free)

Renders the `brain-freeze-20s` sample short (20 seconds, 1080x1920,
"What happens if you drink a slushie too fast?") on GitHub's free
runners — no laptop needed, nothing to install locally.

## Cost

- **Public repo:** Actions minutes are free and unlimited on standard
  runners.
- **Private repo:** the free plan includes $12 of compute a month
  (2,000 Linux minutes). One render takes roughly 25–40 minutes on
  the first run (it downloads the free voice + transcription models,
  ~0.9 GB) and ~20 minutes after that (models are cached).
- With no card on file, GitHub simply stops the runs when the
  allowance is used up — no bill.

## Use it

1. Create a repo on GitHub (public is free and unlimited for this)
   and upload everything in this folder: `scripts/`,
   `brain-freeze-20s/`, `.github/`, and this README.
2. Open the repo's **Actions** tab → **Render faceless short** →
   **Run workflow**. Leave the defaults (project `brain-freeze-20s`,
   output `brain-freeze-20s.mp4`) and run it.
3. When the run finishes, download the artifacts from the run page:
   - `brain-freeze-20s.mp4` — the finished video
   - `contact-sheet` — one frame per second of the whole video.
     Look at the sheet first; if a frame looks wrong, fix the shot
     and re-run.

## Make another short

1. Copy `brain-freeze-20s/` to a new folder, e.g. `my-short/`.
2. Edit its `script.json` (narration + captions) and `src/shots.js`
   (what each shot shows) — see the skill's `SKILL.md` for the rules.
3. Push, then run the workflow with `project` set to `my-short`
   and `output` to `my-short.mp4`.

## What runs

Node 22 + Python 3.12 + ffmpeg + Chrome are installed on the runner,
then the skill's own scripts run the whole pipeline: `setup.sh`
(voice + Whisper models) → `voice.py` (narration) → `words.py`
(word timings) → `capture.mjs check` → `cues` → `mix.py`
(soundtrack) → contact sheet → `capture.mjs video`. Rendering uses
software GL (`SOFTWARE_GL=1`, 24 fps), the same as a computer with
no graphics card — that's why a 20-second short takes ~20 minutes.
