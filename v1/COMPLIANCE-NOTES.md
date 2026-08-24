# Balanced Life Care — v1 redesign, LegitScript notes

File: `index.html` (single-file, no build step, no external deps except Google Fonts)

## What v1 bakes in (LegitScript healthcare/telemedicine standards)

| Requirement | Where |
|---|---|
| Emergency disclaimer (911 / 988) | Sitewide top bar + FAQ + contact |
| "Consultation required before any medication is prescribed or dispensed" | Hero microcopy, How-it-works, Disclosures, Footer |
| "Payment does not ensure prescription issuance" | Hero, FAQ #1, Disclosures, Consent checkbox, Footer |
| Scope of service — care coordinator, not a medical practice | How-it-works, Providers, Disclosures, Footer |
| Legal entity name + physical address + phone + email | Contact block + footer (placeholders) |
| Clinician identity, credentials, license numbers | `#providers` section (placeholders) |
| Licensure / state availability + verification on request | Disclosures, FAQ |
| Controlled substances policy (Ryan Haight, no opioids/stimulants/benzos, testosterone C-III) | Care plans, FAQ, Disclosures |
| Compounded-drug disclaimer (not FDA-approved) | Care plans callout |
| DSHEA/FDA supplement disclaimer | Care Collection callout |
| Rx vs. OTC visually separated | `pill-rx` / `pill-otc` badges |
| Transparent pricing + refund/cancellation policy | `#pricing` |
| Adverse event reporting (FDA MedWatch 1-800-FDA-1088) | FAQ + Disclosures |
| 18+ / US-only eligibility, affirmed at intake | Consent checkbox + Disclosures |
| HIPAA / no sale of health data | Trust strip, FAQ, footer legal links |
| Policy links (Terms, Privacy, NPP, Telehealth Consent, Shipping/Returns) | Footer |
| Certification seal placement | Footer `.seal` block |
| No efficacy guarantees / no "no prescription needed" language | Copy reviewed throughout |

## Placeholders you must fill before submitting for certification
- `[Legal Entity Name, LLC]` — registered legal name (must match domain WHOIS; **anonymous/private domain registration is disallowed**)
- `[Street Address]`, `[City, State ZIP]` — a real physical business address, not a PO box
- `[Affiliated Medical Group, PC/PLLC]` — the friendly-PC entity employing the clinicians
- Medical director + clinician names, credentials, state, license numbers
- `$XX` pricing in `#pricing`
- LegitScript seal image + verification URL once issued

## Still to build (referenced by v1, not yet written)
`/terms`, `/privacy`, `/notice-of-privacy-practices`, `/telehealth-consent`, `/shipping-returns`, `/about`, `/accessibility`.
The intake form is a demo — wire it to a HIPAA-compliant endpoint under a BAA before launch (no PHI through a generic form handler).

## Brand assets (v1.3)

Source: the live site's only logo file, `/wp-content/uploads/2022/05/Balanced-Life-Care-FS-R3-01-1-1.jpg`
(704x311, **white-background JPEG** — no transparent original exists on the server).

Converted to transparent PNG with `tools/make_logo.py` (pure stdlib; this box has no
Pillow/ImageMagick, so `tools/jpeg2png.py` is a hand-written baseline-JPEG decoder + PNG encoder):

| File | Size | Use |
|---|---|---|
| `assets/logo.png` | 668x278, 42 KB | full lockup on light — header |
| `assets/logo-reversed.png` | 668x278, 34 KB | charcoal ink -> white, teal kept — the black footer |
| `assets/logo-mark.png` | 221x242, 11 KB | icon only — favicon, apple-touch-icon, banner watermark |
| `assets/logo.jpg` | 704x311 | untouched source, kept for reference |

Cleanup applied: exact colour-to-alpha against the white matte (so antialiased edges keep real
coverage instead of a white fringe), JPEG ringing below 5.5% alpha dropped, alpha ramp firmed,
and the two inks snapped 75% toward their measured values — **teal `#06BDA1`, charcoal `#313032`** —
which undoes the JPEG chroma mush. Margins trimmed; the mark cut free of the tagline strip.

## Theming (v1.3) — white / green / black

The page now commits to a single light scheme built from the logo's own inks. Every
`prefers-color-scheme: dark` block was removed, along with the white plate that used to sit
behind the logo, and `<meta name="color-scheme" content="light">` declares the intent.

| Token | Value | Role |
|---|---|---|
| `--bg`, `--surface` | `#ffffff` | page and cards |
| `--surface-2` | `#f1faf7` | banded sections, whisper of green |
| `--green` | `#06bda1` | the logo ink — fills, graphics, footer accents (2.4:1, never body text) |
| `--brand` | `#068068` | text-safe green, 4.9:1 on white — links, buttons, labels |
| `--brand-2` | `#04604e` | hover |
| `--brand-soft` | `#e2f8f2` | chips, step markers, banner wash |
| `--ink` | `#0e1211` | near-black text, the safety bar, the footer |
| `--alert` | `#b3261e` | form validation only — functional, not brand |

Black now carries real weight rather than just being text: the emergency safety bar and the
footer are both solid `--ink`, with green links and headings reversed out of them, and the
"Prescription required" badge is black-on-white against the green "No prescription needed" badge —
so the Rx/OTC split LegitScript cares about stays obvious without a third colour.

**The dark-background problem is solved properly**, not patched: `logo-reversed.png` recolours only
the charcoal ink to white and keeps the teal, so the mark stays two-tone on black instead of going
flat mono. The vector original would still be worth having for crispness at large sizes, but
nothing in the layout depends on it now.
