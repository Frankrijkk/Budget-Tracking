# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two people: a couple sharing household finances. Both install the app on their own phone (one iPhone, one Android) and use it independently day to day — logging a purchase they just made, checking what they owe each other, reviewing spending together. Not a multi-tenant product; exactly these two accounts will ever exist.

## Product Purpose

A private, shared budget tracker that eliminates the recurring "who owes who" conversation between two people who split expenses. Every purchase is logged with who paid and how it's split (fully one person's, fully the other's, or shared in any ratio/amount), and the app continuously computes a running balance from that — no manual settling-up math, no memory required.

## Positioning

The mechanism a note-taking app or a manual ledger can't replicate: every logged transaction automatically resolves into a live, always-correct balance (computed fresh from transaction history, never a stored running total that can drift or need manual reconciliation). Paired with two low-friction capture paths — a sub-5-second Quick Add for personal purchases, and AI receipt scanning that extracts and lets you split itemized purchases — logging stays fast enough that the balance stays trustworthy instead of going stale like most shared-expense trackers.

## Operating Context

Used in two distinct moments: (1) in-the-moment, standing at a register or right after a personal purchase, via the Quick Add home-screen shortcut — needs to be near-instant; (2) at home, reviewing the month together — dashboard, stats, and settling up. Installed as a home-screen PWA on both an iPhone (Safari) and an Android phone (Chrome), not distributed through app stores.

## Capabilities and Constraints

- Manual transaction entry, Quick Add (fast path, defaults to 100% on whoever paid), and receipt-photo scanning (AI-extracted line items, splittable per item).
- Every transaction/item splits between the two people as: fully person A, fully person B, or shared — shared splits can be entered as a percentage or as exact amounts per person (typing one fills in the other).
- Budgets can be set per category as shared (household-wide) and/or personal (per person), independently.
- Running balance ("who owes who") is always computed from transaction history, never stored/manually adjusted.
- Currency: EUR.
- Backend: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions). Receipt AI: NVIDIA-hosted vision-language model.
- No public signup — exactly two accounts, provisioned manually. Never distributed publicly.

## Brand Commitments

App is currently named "Our Budget" (working name I chose during build, not a confirmed brand decision) — open to change. No existing logo, visual identity, or prior brand assets.

Pinned visual reference: the Crylia AwesomeWM theme (github.com/Crylia/crylia-theme) — dark/near-black base, small rounded-pill accent badges in a restrained multi-color palette (not pink-dominated), soft Japanese/anime-adjacent warmth without going pastel-everywhere. Full direction expanded in DESIGN.md.

## Voice

Casual and warm. It's a private tool for a couple, not a professional finance product — some personality in copy is welcome, but should stay legible and not get in the way of quickly logging a purchase.

## Evidence on Hand

None — no real usage data, testimonials, or case studies exist. Nothing here should be fabricated in later design work (no fake testimonials, no invented usage stats).

## Product Principles

- Speed of capture protects the whole product: if logging a purchase takes more than a few seconds, the balance goes stale and the core value (never doing who-owes-who math) breaks down.
- The balance is always derived, never stored: correctness survives edits/deletes of any past transaction without reconciliation logic.
- Every split is symmetric and precise: whether by percentage or exact amount, both people's numbers always sum to the total — no rounding-off-into-the-void.
- Built for exactly two people, on purpose: no multi-user, multi-household, or general-audience concerns shape any decision.

## Accessibility & Inclusion

No specific accessibility needs identified for either user. Design to normal good-practice contrast and touch-target standards.
