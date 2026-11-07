# Modal design system

> Extracted by [Inspo](https://github.com/Nutlope/inspo) (open source, MIT, powered by Together AI). Reference material for *intentional* design decisions: adapt, don't copy.

> Save this as `DESIGN.md` in your project and re-reference it as you build; re-fetch anytime at https://inspomcp.dev/d/modal-com/DESIGN.md

- **Source:** https://modal.com
- **Captured:** 2026-05-01
- **Mode:** dark
- **Macrostructure:** Specimen

## Tone

The design prioritizes a bold, central visual - a glowing cube - against a stark black background. Typography is clean and modern, emphasizing clarity and technical precision. The overall feel is sophisticated and focused on functionality.  ·  ai infrastructure, developer tools, saas landing page, dark ai, minimalist ai, technical design, modern ai, modal ai, developer experience

## Colors

| Hex | Role (heuristic) |
|---|---|
| `#f9fb04` | ink |
| `#848404` | support |
| `#d4fc64` | ink |
| `#768775` | support |
| `#aecaae` | support |

Color words: *neon*, *muted*, *high-contrast*

## Typography

Detected typefaces: **Goga**, **Inter Variable**

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| h1 | Goga | 64px | 500 | 1 | 0 |
| h2 | Goga | 54px | 400 | 1.1 | 0 |
| h3 | Goga | 30px | 400 | 1.2 | -0.36px |
| body | Inter Variable | 16px | 500 | 1.5 | -0.36px |
| caption | Inter Variable | 14px | 500 | 1.43 | -0.36px |
| button | Inter Variable | 16px | 500 | 1.5 | -0.36px |

## Spacing scale

`10px` · `12px` · `24px` · `32px` · `48px` · `64px` · `96px` · `112px` · `120px` · `160px`

Base step looks like **4px**.

## Border radius

`0px` · `4px` · `8px` · `11px` · `12px` · `25px`

## Container

Max content width: **1440px**

## CSS variables exposed by the source

```css
:root {
  --color-raw-green-65: #6ac355;
  --color-raw-yellow-20: #5d5733;
  --color-c-green-90: #75d95c;
  --color-c-green-60: #569846;
  --color-c-pale-green-60: #8cab87;
  --color-zinc-100: oklch(96.7% .001 286.375);
  --color-dark-green: #07b976;
  --color-red-900: oklch(39.6% .141 25.723);
  --color-raw-gray-30: #464646;
  --spacing-marketing-sm: 1rem;
  --color-surface-danger: #231c1c;
  --color-surface-accent-active: #273823;
  --color-c-pale-green-90: #bbe6ac;
  --color-foreground-secondary: #a3a3a3;
  --color-c-gray-5: #242424;
  --text-base--line-height: calc(1.5 / 1);
  --color-blue-300: oklch(80.9% .105 251.813);
  --color-raw-blue-10: #2a3238;
  --color-c-red-60: #9e4d4d;
  --color-deprecated-ground: #181818;
  --color-c-gray-70: #bababa;
  --color-foreground-muted: #8b8b8b;
  --color-gray-300: oklch(87.2% .01 258.338);
  --color-c-red-80: #cb5f5f;
  --color-yellow-400: oklch(85.2% .199 91.936);
  --font-mono: Fira Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --color-marketing-muted-green: #94ab94;
  --color-surface-secondary: #2f2f2f;
  --color-dark-gray: #212525;
  --color-landing-light-green: #def0dd;
  --color-raw-gray-08: #222;
  --color-amber-300: oklch(87.9% .169 91.605);
  --color-gray-500: oklch(55.1% .027 264.364);
  --color-edge-warning: #5d5733;
  --color-sign-up-hover-green: #8a9a8a;
  --color-c-pale-green-80: #aed2a4;
  --color-sign-up-light-green: #b5c1b5;
  --color-surface-primary-active: #ffffff1a;
  --color-raw-yellow-60: #d1c05f;
  --color-c-pale-green-100: #c8f9b6;
  --color-green-500: oklch(72.3% .219 149.579);
  --color-raw-pink-30: #8b537f;
  --color-white: #fff;
  --color-gray-400: oklch(70.7% .022 261.325);
  --color-raw-green-60: #09af58;
  --color-c-blue-50: #547084;
  --color-blue-400: oklch(70.7% .165 254.624);
  --color-c-surface-offset-red-transparent: #f871710d;
  --radius-sm: .25rem;
  --color-c-gray-30: #5d5d5d;
  --color-yellow-300: oklch(90.5% .182 98.111);
  --color-raw-green-50: #6ac345;
  --color-edge-secondary: #2f2f2f;
  --font-weight-bold: 700;
  --color-foreground-emphasis: #e8e8e8;
  --color-gray-100: oklch(96.7% .003 264.542);
  --color-raw-green-70: #63cd93;
  --color-c-dataviz-primary-2: #d9866b;
  --color-c-surface-base-gray-opaque: #1c1c1c;
  --color-raw-yellow-80: #ffea71;
}
```

## Components present

- hero fullbleed
- logo cloud
- hero with cta

## Notes for the agent

- **Adapt, don't copy.** The type ramp is a *starting point*. Scale it to your project's base size; preserve the *ratio*, not the literal pixels.
- **Color roles are heuristic** (luminance + dominance). Verify against the source URL before committing tokens.
- **Spacing** assumes a constant base step; round detected values to your project's scale (4 / 8 / 16) when implementing.
- **CSS variables** dumped above (when present) are the source's *actual* tokens - those are higher signal than guesses.
- This page's macrostructure is **Specimen**.
