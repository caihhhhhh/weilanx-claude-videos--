---
name: weilanx-creator-video-master
description: Single entrypoint for video production using the existing eight weilanx Claude Code Skills. Route by task, validate dependencies and output requirements, review rights and factual sourcing, and run the selected native video workflow without duplicating it.
---

# Video factory: choose, route, verify

## Guardrails
- Read `AGENTS.md` and `src/library/README.md` first. Preserve original eight Skills and their native templates. Do not change existing episode assets or overwrite user content.
- Choose a **single** primary production Skill based on subject and desired output; use `weilanx-creator-distill-video` **before** production only when a reference-video style is supplied.
- Never claim a private voice model, missing music track, third-party footage, or publishing token exists. Require explicit rights for source media, music and any cloned voice.
- Do not submit to external platforms, publish, or commit to GitHub without explicit user request and correct repository/branch.
- Prefer first-party/primary sources for factual claims; never fabricate demonstrations, measurements, or causal conclusions.

## Inputs / defaults
Collect only facts that are essential: topic or reference video, desired format (`portrait-9x16`, `portrait-3x4`, `landscape-16x9`), target length, voice or subtitle-only, style, target platform. If not given, default to `portrait-9x16`, 45–75 seconds and licensed/available assets, unless the selected Skill or user context requires otherwise. Shorter video is **not** guaranteed to perform better.

## Routing
| Request | Call existing Skill |
|---|---|
| Reference video → reusable style library | `weilanx-creator-distill-video` |
| Science, tech news, cited real footage | `weilanx-creator-vox-video` |
| AI explainer with narration and playful vertical design | `weilanx-creator-pixel-video` |
| Tools/process tutorial with narration | `weilanx-creator-desk-video` |
| One counterintuitive fact, music + captions | `weilanx-creator-gilded-video` |
| Game theory / visual inference | `weilanx-creator-blackgold-video` |
| FPS game science | `weilanx-creator-fps-video` |
| Historical institution or misconception | `weilanx-creator-lamplight-video` |

If the target aspect differs from a Skill's native template, explicitly adapt `Composition` width/height and **re-layout every stage, chart, subtitle, cover and safe zone**. Use `src/library/video-formats.ts` for `ShowConfig`; for custom independent `timeline.ts` scenes, modify local geometry as well. Do not simply crop 16:9 frames to 9:16.

## Execution
1. `npm run doctor -- --json`. If an asset is essential and absent, fail early with an actionable missing-dependency report. For a specific score, use `npm run doctor -- --music track-name.mp3 --strict`.
2. If making original science/engineering content, research primary evidence, note uncertainty and whether an animation is illustrative. For 3D mechanical visualization, prioritize correct kinematics; external Blender assets are optional and need licensing review.
3. Use the selected existing Skill's stage, character, cue, and timeline conventions. Prefer library components to writing new ones. Reuse music only with verifiable authorization.
4. Verify `npm run typecheck && npm test`. Check representative frames, video-specific test rules, and listening/rights/fact review.
5. Export using `npm run export -- <episode-id>`. For 9:16 verify `node scripts/qa-media.mjs <video.mp4> --aspect 9:16 --strict`. Review `QA-report.json` and visual frames before claiming completion. A QA report cannot establish visual quality by itself.
6. Deliver MP4, cover, SRT/subtitle document, publication copy, citations/asset rights, and a concise list of known limitations. Do not hide missing media or unrun checks.

## Important
`video-formats.ts` provides correct size and **starting layout only**, not automatic responsive scene conversion. Word-level timing is optional in `src/library/cues.ts`; without aligned `words`, `cw()` keeps the original estimated timing.
