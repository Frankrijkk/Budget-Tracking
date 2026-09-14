---
name: Our Budget
description: A private, shared budget tracker for two people
colors:
  ink-black: "#0e0d12"
  charcoal-panel: "#17151d"
  raised-charcoal: "#201d29"
  soft-graphite: "#2a2733"
  warm-white: "#f3f1f6"
  dusty-mauve-grey: "#9891a3"
  dusk-lavender: "#b8a1ff"
  clear-sky-blue: "#6fb8ff"
  soft-blossom-pink: "#f78fc2"
  warm-coral-red: "#ff6b6b"
  peach-coral: "#ff8a7a"
  honey-mustard: "#f5c563"
  mint-teal: "#5fe0c4"
  soft-sage: "#a8d88a"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  money:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 600
    letterSpacing: "-0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.dusk-lavender}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  button-primary-disabled:
    backgroundColor: "{colors.dusk-lavender}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.charcoal-panel}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.md}"
    padding: "12px"
  input:
    backgroundColor: "{colors.charcoal-panel}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Our Budget

## Overview

**Creative North Star: "The Late-Night Ledger"**

Logging a purchase standing in the kitchen at 11pm, phone screen the only light on — a near-black surface with small, warm-colored badges glowing against it. The system inherits its character from the Crylia AwesomeWM rice (github.com/Crylia/crylia-theme): a dark, borderless, hacker-desktop base carrying small rounded pill badges in a restrained mix of soft-saturated colors, never one dominant hue. The "cute" register comes from color variety and rounded warmth in small details, not from pastel washes or heavy decoration — this stays a serious two-person finance tool wearing a cozy coat.

Money itself is set in a tabular monospace face (JetBrains Mono, the reference's own font) — data, not a technical costume — while every other surface uses the system UI stack, keeping the interface quiet so the small color badges (category icons, split indicators, the balance figure) are what catch the eye.

**Key Characteristics:**
- Dark-only, near-black base — no light theme
- One primary accent (Dusk Lavender) carries buttons and active states; a curated set of 6-8 secondary/tertiary hues carries category and person badges
- Flat and borderless by default — depth comes from subtle background-tint separation, not shadows
- Rounded-full badges for every category/goal icon and every person indicator
- Tabular monospace exclusively for money figures

## Colors

A dark neutral field with a single confident primary accent, plus a small curated set of badge colors used only on small elements (icons, chips, indicators) — never as page-scale fields.

### Primary
- **Dusk Lavender** (#b8a1ff): the one confident accent. Primary buttons, active nav/tab state, focus rings, text selection, the app icon. Used sparingly — never as a full-surface field.

### Secondary
- **Clear Sky Blue** (#6fb8ff): "Me" — the signed-in user's identity color across split indicators, person toggles, and trend charts.
- **Soft Blossom Pink** (#f78fc2): "Her" — the partner's identity color, same contexts. Deliberately one of several hues in rotation, not the dominant color of the app (the explicit brief: cute, not overly pink).

### Tertiary
- **Peach Coral** (#ff8a7a), **Honey Mustard** (#f5c563), **Mint Teal** (#5fe0c4), **Soft Sage** (#a8d88a): the badge palette categories and savings goals pick from, alongside Dusk Lavender, Clear Sky Blue, and Soft Blossom Pink. Eight hues total in the curated picker — enough variety that a list of categories reads as distinct at a glance, restrained enough that no two feel arbitrary.
- **Warm Coral Red** (#ff6b6b): errors, over-budget states, destructive actions (archive/delete).

### Neutral
- **Ink Black** (#0e0d12): page background.
- **Charcoal Panel** (#17151d): card, list-row, and input background.
- **Raised Charcoal** (#201d29): modal and popover background — one step lighter than a card, for stacking order without a shadow.
- **Soft Graphite** (#2a2733): all hairline borders/dividers.
- **Warm White** (#f3f1f6): primary text.
- **Dusty Mauve Grey** (#9891a3): secondary/muted text, placeholders, inactive icons. Tinted toward the palette's warm-purple undertone rather than true gray.

### Named Rules
**The One Confident Accent Rule.** Dusk Lavender is the only color that ever fills a large interactive element (a primary button, an active tab). Every other hue in the palette is reserved for small badges — a 32-40px icon circle, a 2.5px dot, a chip — never a button or a card background.

## Typography

**Body Font:** System UI stack (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`)
**Money Font:** JetBrains Mono (with `ui-monospace, monospace` fallback)

**Character:** The system stack keeps chrome quiet and native-feeling — this is an Operate-mode task app, not a brand showcase, so no display face was introduced. JetBrains Mono is reserved entirely for monetary figures: tabular numerals so amounts align in lists, and a direct nod to the pinned Crylia reference (which uses the same face as its own UI font).

### Hierarchy
- **Display** (semibold, 3rem / `text-5xl`, tight): the live amount in Quick Add — the single largest text in the app, always set in the money face.
- **Headline** (semibold, 1.5rem / `text-2xl`): page titles like "This Month".
- **Title** (semibold, 1.125rem / `text-lg`): section headers, card titles.
- **Body** (regular/medium, 0.875rem / `text-sm`): list rows, form labels, buttons.
- **Label** (regular, 0.75rem / `text-xs`): muted metadata — dates, hints, captions.

### Named Rules
**The Money-Is-Mono Rule.** Every rendered currency amount, anywhere in the app, is set in the money face with `font-variant-numeric: tabular-nums`. No amount is ever set in the body face.

## Layout

Mobile-first, single-column, capped at `max-w-md` (28rem) and centered — the app is never viewed wider than a phone in practice, so no desktop breakpoint was designed. Content sits in a bottom-tab-bar shell (Home / Activity / [+] / Stats / More) with a floating center action button that opens a bottom sheet (Quick Add / Full Transaction / Scan Receipt). Safe-area insets (`env(safe-area-inset-*)`) pad the top and bottom throughout for the PWA's notch/home-indicator on both iOS and Android. Spacing steps in 4px increments (4/8/12/16/20px); list rows and cards use 12px internal padding, sections stack with 16-20px rhythm.

## Elevation & Depth

Flat by default, no shadows anywhere in the system — matching the pinned reference's borderless, tonal-layering approach. Depth is conveyed entirely through background tint steps (Ink Black → Charcoal Panel → Raised Charcoal, each one perceptible step lighter) plus a single 1px Soft Graphite hairline border on cards, inputs, and dividers.

### Named Rules
**The No-Shadow Rule.** Nothing in this system casts a `box-shadow`. A raised surface is one step lighter in the bg→surface→surface-raised scale, never a drop shadow.

## Shapes

Soft, consistent rounding throughout: `rounded-xl` (12px) is the default for cards, inputs, and buttons; `rounded-2xl` (16px) for larger containers like the bottom sheet and stat cards; `rounded-full` for every icon badge, avatar, pill/chip, and the progress-bar track. No sharp corners anywhere — the rounding is the system's other soft-warmth signal alongside the badge colors.

## Components

### Buttons
- **Shape:** `rounded-xl` (12px).
- **Primary:** Dusk Lavender background, Ink Black text, `font-medium`, 12px vertical padding. Slight scale-down (`active:scale-[0.98]`) on press instead of a color shift — a tactile, physical-feeling tap.
- **Secondary/Ghost:** transparent or Charcoal Panel background, Soft Graphite border, Dusty Mauve Grey or Warm White text.
- **Disabled:** 50% opacity, no other treatment change.

### Category / Goal Badges (signature component)
- **Shape:** `rounded-full`, 32-40px circle.
- **Style:** background is the category's own accent color at 15% opacity (`{color}25` hex-alpha), icon drawn in the same full-opacity color. Icon is a real lucide-react glyph (never emoji) from a curated 12-icon category set / 8-icon goal set.
- **Purpose:** the app's primary "at a glance" identifier — every transaction row, category chip, and stat legend leads with one of these.

### Chips (category filter pills)
- **Style:** `rounded-full` border, transparent background; selected state fills with the chip's accent color at 15% opacity and colors both border and text/icon in that accent.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px), occasionally `rounded-2xl` (16px) for the largest containers (bottom sheets, hero stat cards).
- **Background:** Charcoal Panel.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** 1px Soft Graphite.
- **Internal Padding:** 12-16px.

### Inputs / Fields
- **Style:** Charcoal Panel background, 1px Soft Graphite border, `rounded-xl`, Warm White text, Dusty Mauve Grey placeholder.
- **Focus:** border shifts to Dusk Lavender, plus the global 2px Dusk Lavender `:focus-visible` outline.
- **Money inputs:** always set in the money face (JetBrains Mono, tabular-nums).

### Navigation
- **Bottom tab bar:** fixed, Charcoal Panel background, 1px top border. Active tab icon+label in Dusk Lavender; inactive in Dusty Mauve Grey. Center slot is a raised Dusk Lavender circular FAB rather than a sixth tab icon.
- **Back navigation:** a plain `ChevronLeft` + "Back" text link in Dusty Mauve Grey, top-left of every non-tab screen — no back-arrow-only icon buttons.

## Do's and Don'ts

### Do:
- **Do** reserve Dusk Lavender for the single primary action per screen; everything else uses the neutral or badge palette.
- **Do** set every money figure in the tabular money face, no exceptions.
- **Do** draw every category/goal/status icon from lucide-react (or an equivalent real icon library) at a consistent 2px stroke weight.
- **Do** theme browser-native surfaces (selection, focus ring, scrollbar) from the palette rather than leaving OS defaults.

### Don't:
- **Don't** use emoji as a stand-in for an icon anywhere in the product UI (category/goal icons, status indicators). A small celebratory emoji in a one-off success message's copy is the one accepted exception ("All settled up" 🎉-style moments) — even there, prefer a real drawn icon when one fits (see `PartyPopper`).
- **Don't** introduce a shadow, gradient, or glass/blur effect as decoration. Depth comes from the bg/surface/surface-raised tint scale only.
- **Don't** let Soft Blossom Pink (or pink generally) dominate a screen — it is one of eight badge hues in rotation, never the app's signature color. Dusk Lavender is.
- **Don't** add a light theme. The system is dark-only by deliberate choice, matching the pinned reference.
