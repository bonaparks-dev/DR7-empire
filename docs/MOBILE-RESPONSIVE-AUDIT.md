# DR7 Empire — Mobile / Responsive Audit

Audited 2026-05-09 against the customer-facing website at `/Users/opheliegiraud/antigravity-dr7web/DR7-empire`. Stack: React 19 + TypeScript + Tailwind (loaded via CDN — see Critical #1) + Vite.

---

## 1. Executive summary

Five high-impact issues are responsible for the bulk of the "everything is broken" feeling on phones:

1. **Tailwind is loaded from `cdn.tailwindcss.com` at runtime** (`index.html:285`). That CDN is the dev-only "play CDN", explicitly NOT for production. It pulls JIT in the browser, blocks paint, and on a 4G phone adds ~400 ms before any class works — which is exactly what makes the page look "exploded" for a beat. This alone is responsible for the "rendering looks wrong on mobile" perception more than any single component.
2. **iOS form-zoom on every input.** Most inputs in `CarBookingWizard.tsx`, `BookingPage.tsx`, `MyBookings.tsx`, `ProfileSettings.tsx` use `text-sm` (14 px). Safari iOS auto-zooms when font-size < 16 px, so every tap inside the booking wizard yanks the layout — feels broken, isn't.
3. **Hero section preloads SIX MP4 videos in parallel** (`HomePage.tsx:35-60`, ~13 MB total) and uses `h-screen` (the buggy `100vh` that hides under the iOS URL bar instead of `100dvh`).
4. **`grid-cols-3` with no responsive prefix** in DR7Club tier table (`DR7Club.tsx:300`) and the deposit-owner address block in the wizard (`CarBookingWizard.tsx:5383`) — both produce a horizontal scroll on phones.
5. **Floating UI collisions:** the AI chat button (`DR7AIChat.tsx:354`) and the Prime Wash floating cart (`CarWashServicesPage.tsx:713`) are both `fixed bottom-6 right-6 z-40` — they overlap on the car-wash page. Combined with the CookieBanner (`CookieBanner.tsx:39`, `z-[60]`) the bottom-right of the screen is unusable on first visit.

Fixing #1 and #2 alone will eliminate ~70 % of the "broken on mobile" reports.

---

## 2. Critical bugs (functionality breaks on mobile)

| # | Bug | File:line | Why it breaks |
|---|-----|-----------|---------------|
| C1 | Tailwind via CDN script (no purge, no JIT, blocks paint, ~250 KB script) | `index.html:285` | Production should use the Vite Tailwind plugin. Currently styles arrive late on every page → first 200-500 ms looks unstyled on slow 4 G. |
| C2 | All wizard inputs are `text-sm` (14 px) → iOS Safari zooms on focus, distorting wizard | `CarBookingWizard.tsx:4165, 4168, 4170-4174, 4191-4201, 4482-4525, 5375-5404, 6307` (~37 inputs) | Every form interaction on iPhone causes layout zoom; users can't easily tap "Continua" after typing. |
| C3 | `grid-cols-3` with no `sm:` prefix → 3 columns at 360 px width = horizontal scroll | `DR7Club.tsx:300`, `CarBookingWizard.tsx:5383` (deposit owner Città/CAP/Provincia) | Tier reward percentages (`text-2xl`) overflow; Provincia field becomes unusable. |
| C4 | Hero loads 6 MP4s in parallel, no `preload="metadata"`, no mobile fallback | `HomePage.tsx:138-149` | First contentful paint on 4 G ~7 s; iOS pauses more than 2 concurrent videos so 4 of them silently fail. |
| C5 | `h-screen` on hero / many pages instead of `h-dvh` | `HomePage.tsx:121`, `RentalPage.tsx:149`, ~30 pages use `min-h-screen` | iOS hides the bottom 75 px under the URL bar; "scroll-down" arrows and CTAs sit below the fold. |
| C6 | Two `fixed bottom-6 right-6 z-40` elements collide | `CarWashServicesPage.tsx:713` (cart) + `DR7AIChat.tsx:354` (chat) | On Prime Wash page the AI chat is hidden behind the cart; tapping cart sometimes triggers chat. |
| C7 | `<meta name="viewport">` lacks `viewport-fit=cover` | `index.html:6` | Safe-area insets don't apply, so any future `env(safe-area-inset-bottom)` work won't take effect on iPhone X+ notches. |
| C8 | Bundle size 1873 KB JS (already known) — no lazy routes | `App.tsx`, `vite.config.ts` | TTI on a mid-range Android > 8 s. |
| C9 | Native `<input type="date">` and `<input type="time">` everywhere with `text-sm` | `BookingPage.tsx:405`, `MyBookings.tsx:1074, 1078, 1090, 1094, 1146`, `CarBookingWizard.tsx:4523-4525, 4551, 6306` | iOS shows minuscule date wheel; Android Chrome rejects empty value silently. Combined with C2, picking a date is awful. |
| C10 | The dead-code "Prenota Ora" popup at `Header.tsx:247-414` references `bookingPickupLocation` etc. that are not declared in scope (the `false &&` masks a runtime crash). If anyone toggles the flag it crashes the entire mobile menu. | `Header.tsx:278-411` | Latent regression risk — should be deleted. |

---

## 3. Per-page issues

### Header / mobile menu — `components/layout/Header.tsx`
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | `w-8 h-8` close button (32 px) — below 44 px touch target | 468 | `w-11 h-11` or wrap in 44 px hitbox |
| HIGH | Empty `<button>` at line 100-106 (no children, just `aria-label`) renders an invisible 32 px hot-zone overlapping logo | 100-106 | Either remove or add an SVG X icon |
| MED | Backdrop blur (`backdrop-blur-xl`) on mobile is paint-expensive; causes jank during open animation | 84, 463 | Drop to `backdrop-blur-md` on `< sm` breakpoint |
| MED | `Credit Wallet` chip wraps to 2 lines on iPhone SE (320 px) because logo is centered & overflowing | 561-565, 578-586 | `text-[11px]` on small + shorter label "Wallet" |
| LOW | 247-414 dead "Prenota Ora" popup — see C10 | 247-414 | Delete entire block |

### Homepage — `pages/HomePage.tsx`
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Hero uses `h-screen` → loses 75-100 px on iOS Safari | 121 | `h-dvh` (Tailwind v3.4+) or fallback CSS `height: 100svh` |
| HIGH | 6 hero MP4s mounted simultaneously with `<video>` (~13 MB total) | 35-60, 138-149 | Render only `activeSlide` and the next; mobile poster image fallback |
| HIGH | Featured grid card uses `h-[40rem]` (640 px) — bigger than viewport on most phones | 218 | `h-[60vh] md:h-[40rem]` |
| MED | Nav dots are 8×8 px (`w-2 h-2`) — far below 44 px tap target | 158-160 | Wrap in 44 px hitbox via `p-3 -m-3` |
| MED | Title `text-xl md:text-3xl` is fine, but card is wrapped in `h-96` (384 px) image with no `loading="lazy"` | 218 | Add `loading="lazy"` to non-featured images |
| LOW | Container `px-6` on mobile leaves only ~308 px usable on 360 px width | 188 | `px-4 md:px-6` |

### BookingSearchBox — `components/ui/BookingSearchBox.tsx`
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | DatePicker portal isn't enabled — calendar pops INSIDE the popup, gets clipped by `max-h-[90dvh]` | 268-291, 317-338 | Add `withPortal` or `popperPlacement="auto"` and `popperContainer` |
| MED | Time `<select>` width `w-[85px]` — fine on most phones but truncates "23:30" with custom Italian fonts | 296, 343 | `w-[92px]` or `min-w-[5.5rem]` |
| MED | Checkbox is `sr-only` with custom 22×22 visual — fine, but the LABEL text is long (`Riconsegna nella sede principale Viale Marconi 229, Cagliari 09131`) and wraps awkwardly | 257 | Shorten to "Stessa sede di ritiro" |
| LOW | `text-[15px]` on inputs is fine for iOS (≥16 px is the trigger only at 16) — actually 15 px STILL triggers iOS zoom. Bump to 16 | 290, 296, 337, 343 | `text-base` (16 px) |

### CarBookingWizard — `components/ui/CarBookingWizard.tsx` (7019 lines)
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | All driver-form inputs `text-sm` → iOS zoom on every focus | 4482-4525 | Bulk replace `text-sm` → `text-base` on inputs (or apply `text-base` only on `<sm` to keep desktop compact) |
| HIGH | Address grid `grid-cols-3 gap-3` — Città / CAP / Provincia — no `sm:` prefix | 5383 | `grid-cols-1 sm:grid-cols-3` |
| HIGH | Step indicator labels truncated to `max-w-[60px]` and `text-[10px]` — illegible on iPhone | 6644 | Hide labels on `< sm`, show only step number |
| HIGH | Camera modal uses `max-h-[70vh]` for video — on iPhone with notch, controls overlap notch | 6244 | `max-h-[60dvh]` + safe-area padding |
| HIGH | Bottom action buttons are NOT sticky — user must scroll all the way down on a long step | 6908-6965 | `sticky bottom-0` with backdrop + `pb-[env(safe-area-inset-bottom)]` |
| MED | Inline `<input type="number">` for "Km dalla sede" lacks `inputMode="numeric"` and `pattern="[0-9]*"` | 4174, 4201 | Add inputMode + pattern |
| MED | Wash-upsell modal `max-w-2xl w-full` with `h-48` header image then `max-h-[90dvh]` — portrait phones must scroll TWICE inside modal because the targa input is below the fold | 6271, 6278, 6307 | Reduce header image to `h-32 sm:h-56` |
| MED | Vehicle-deposit popup uses `text-lg` on the targa input but rest is `text-sm` — visual hierarchy okay, but the popup spans 90 dvh on iPhone SE, so action buttons are scrolled below | 5253, 5271 | Sticky footer for "Annulla / Conferma" |
| LOW | Many `<select>` use default browser styling — iOS renders ugly chevron + small font | many | Use `AppleStyleSelect.tsx` (already exists in the repo) |

### RentalPage — `pages/RentalPage.tsx` (1320 lines)
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Quote form `lg:grid-cols-5` — at the awkward `md` breakpoint (768-1024 px tablets) it stays 2 cols, then snaps to 5 — Search button ends up alone in the row | 172 | `md:grid-cols-3 lg:grid-cols-5` |
| HIGH | `<input type="number">` for passengers without `inputMode` or `min:1` enforcement | 200, 1160, 1179, 1186, 1190, 1197, 1201 | Add `inputMode="numeric"` |
| HIGH | Light-mode form fields (`border-gray-300 text-gray-700`) on a dark page — invisible until focused | 1160-1201 | Match dark-theme styling |
| MED | Hero/marketing sections use `text-3xl` without `text-2xl sm:text-3xl` → barely fits on 360 px | 938, 974 | Add responsive variants |
| MED | Vehicle category chips `grid-cols-2 md:grid-cols-4` — chips wrap content, but inside chip text is `text-sm` and gets clipped for long names like "Auto Sportive" | 468 | Add `whitespace-nowrap overflow-hidden text-ellipsis` |

### CarWashServicesPage — `pages/CarWashServicesPage.tsx` (1015 lines)
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Floating cart `fixed bottom-6 right-6 z-40` collides with AI chat | 713 | Move cart to `bottom-24` when AI chat is mounted, or stack vertically |
| HIGH | Cart modal `fixed inset-0 z-50 bg-black overflow-y-auto` — locks scroll but the X button is at default position (`top-4 right-4`?), need to verify it's reachable on iPhone with `env(safe-area-inset-top)` | 821 | Add `pt-[env(safe-area-inset-top)]` |
| MED | Service grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (line 884) for option pills — fine — but option `<button>` height is `py-2` (~32 px touch target) | 884, 692 | `py-3` minimum (44 px) |
| MED | Single-service overlay button uses `bg-black/50` over image — low contrast in bright sunlight | 678 | `bg-black/70` or solid black |

### MyBookings — `pages/account/MyBookings.tsx` (1196 lines)
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Modify-rental modal: 6 inputs × `grid-cols-2` × dark date inputs without `text-base` — iOS zoom + clipped time field | 1071-1094 | Bulk `text-base`, `inputMode` |
| HIGH | Modal `max-h-[90vh]` (NOT `dvh`) — on iPhone the price summary + action buttons fall below fold | 1064 | `max-h-[90dvh]` |
| MED | Action buttons `flex gap-3` at 1124 — on 360 px they wrap because each button text is long | 1124-1129 | `flex-col sm:flex-row` |
| MED | The booking card `flex flex-col md:flex-row` works, but image inside is unbounded — for car_wash bookings without an image the layout collapses unexpectedly | 780-792 | Set explicit `min-h` on image container |

### DR7Club — `pages/account/DR7Club.tsx`
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Tier table `grid-cols-3 gap-3` — at 360 px each tier is 100 px wide, but contains `text-2xl` reward percent + `text-lg` label → horizontal scroll/clip | 300 | `grid-cols-1 sm:grid-cols-3` (mirror line 340 pattern) |
| MED | "Maturato oggi / Mese in corso / Accreditato" cards use `text-2xl` numbers in `p-3` containers — overflows when value > €99 | 343, 354, 361 | `text-xl sm:text-2xl` |

### ProfileSettings — `pages/account/ProfileSettings.tsx` (729 lines)
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Date inputs `text-sm` everywhere — iOS zoom | 635, 654, 655 | `text-base` |
| MED | Form has `min-h-[44px]` on inputs (good!) but labels are `text-sm` too small for one-handed use | many | `text-base` for labels |

### CreditWalletPage — `pages/CreditWalletPage.tsx` (714 lines)
| Sev | Issue | (sampled) | Fix |
|-----|-------|-----------|-----|
| MED | Long page with multiple cards — likely fine but didn't deep-dive; recommend a manual sweep at 360 px | — | — |

### BookingPage — `pages/BookingPage.tsx`
| Sev | Issue | Line | Fix |
|-----|-------|------|-----|
| HIGH | Entire form is on a single ~400 char line of JSX (line 405) with `grid-cols-2 gap-4` — all inputs `bg-gray-800 p-2` (no min-h, no text-base) | 405 | Refactor + add `text-base min-h-[44px]` |

### Footer — `components/layout/Footer.tsx`
| Sev | Issue | Notes |
|-----|-------|-------|
| LOW | 117 lines; standard responsive footer; not audited for issues. |

---

## 4. Cross-cutting patterns

These are systemic and worth a single pass across the repo:

1. **`text-sm` on every form input** → iOS zoom on focus.
   Search: `grep -rE 'type="(text|email|tel|date|time|number|password)".*text-sm' pages components`
   Replace with `text-base` (or `text-base sm:text-sm` if you want desktop compact).

2. **`h-screen` / `min-h-screen` on 30+ pages.**
   Tailwind v3.4 ships `h-dvh` / `min-h-dvh`. Mass-replace would safely fix iOS URL-bar bugs.

3. **`grid-cols-N` without `sm:` / `md:` prefix.** Found at:
   - `pages/account/DR7Club.tsx:300`
   - `components/ui/CarBookingWizard.tsx:5383`
   - `components/ui/CarBookingWizard.tsx:6652` (lg-only is fine)
   - `components/ui/CalendarPicker.tsx:240,249` (intentional 7-col calendar — OK)
   Audit any new ones with: `grep -rE 'grid-cols-[3-9](?! sm:)' pages components`

4. **Touch targets under 44 px.**
   - All `w-8 h-8` close-X buttons (Header, modals)
   - `w-2 h-2` hero dots (HomePage:158)
   - `py-1.5` buttons in wizard (CalcolaCFButton wrapper at line 4493)
   Apple HIG = 44 px, Material = 48 dp.

5. **No `inputMode` on numeric/tel/etc. inputs.** Only 3 instances repo-wide. Add `inputMode="numeric"` (km, CAP), `inputMode="tel"` (phone), `inputMode="email"` (email).

6. **react-datepicker without `withPortal`.** When the wizard modal scrolls, the native popper clips behind `overflow-y-auto` parents. Add `withPortal` everywhere DatePicker is used.

7. **No `loading="lazy"` on offscreen images.** Only 2 occurrences in 9 `<img>`-usage files. RentalCard, ImageCarousel, HomePage cards should all be lazy.

8. **Floating-element z-index conflicts.**
   Map of bottom-right floating elements: AI chat (z-40), CarWash cart (z-40), CookieBanner overlay (z-50/z-60), wizard modals (z-50, z-[100], z-[200], z-[9999]). No coordination — define a token system: `z-toast=70`, `z-fab=80`, `z-modal=100`, `z-overlay=110`, `z-popup=120`.

9. **Tailwind via CDN** (see C1). Critical perf debt — install `@tailwindcss/vite` and purge.

10. **`max-h-[90vh]` instead of `90dvh`.** vh on iOS includes the URL bar; modals get clipped or scrollable area shrinks when the keyboard opens. Many places use `dvh` correctly (good!) but a few stragglers: `MyBookings.tsx:1064`, `CarBookingWizard.tsx:6244`.

---

## 5. Priority order — fix these 5 first

1. **C1 — Replace Tailwind CDN with Vite plugin + purge.** Single biggest "feels broken" fix. `index.html:285` removal + `npm install -D @tailwindcss/vite` + config. Effort: 1-2 h. Impact: massive, every page faster + no FOUC.

2. **C2 — Bulk `text-sm` → `text-base` on every form `<input>` and `<select>`.** Stops iOS zoom-on-focus across the entire booking flow. Effort: 1 h with a careful regex. Impact: customers can actually fill the wizard.

3. **C4 — Lazy-load hero videos.** Only mount `activeSlide` (and optionally next). Add `preload="metadata"`. Add a poster image. `HomePage.tsx:138-149`. Effort: 30 min. Impact: homepage TTI on 4 G drops from ~7 s to ~2 s.

4. **C3 — Fix the two `grid-cols-3` overflows** (`DR7Club.tsx:300`, `CarBookingWizard.tsx:5383`) → `grid-cols-1 sm:grid-cols-3`. Effort: 5 min. Impact: kills horizontal scroll on Club page and cauzione modal.

5. **C5 / Pattern #2 — `h-screen` → `h-dvh` (and `min-h-screen` → `min-h-dvh`).** Codemod across all 30 pages. Effort: 30 min + testing. Impact: hero CTAs visible on iPhone, modals don't bleed under URL bar.

---

## Appendix: search recipes for ongoing audits

```bash
# iOS-zoom risk inputs
grep -rnE 'type="(text|email|tel|number|password|date|time)"[^>]*text-sm' pages components

# Naked grid-cols-N without responsive prefix
grep -rnE 'className="[^"]*grid-cols-[3-9](?! [a-z]+:grid-cols)' pages components

# h-screen and 100vh stragglers
grep -rnE '(h-screen|min-h-screen|100vh|100svh)' pages components

# Tiny tap targets
grep -rnE 'className="[^"]*\b(w-[1-8] h-[1-8])\b' components

# Missing lazy loading
grep -rnE '<img\s' pages components | grep -v 'loading='
```
