# Handoff: Duke Men's Basketball Video Room App

## Overview

A mobile app for the Duke men's basketball video room — the student-intern crew that films practices and games, cuts film, and uploads it for coaching staff. The app replaces a group text and a whiteboard. It does five jobs:

1. **Shift scheduling** — an admin builds practice/game shifts; interns accept or decline, and a decline requires naming a replacement rather than leaving a hole.
2. **Hour tracking** — interns owe 10–15 hours a week; the app clocks time and shows the whole crew against that target.
3. **Task board** — six shared buckets (coach-assigned, daily, during-practice, post-practice, game day) plus one private personal list.
4. **Practice mode** — a full-screen ordered checklist the on-duty intern ticks through live during a practice.
5. **How-tos** — a crew-authored knowledge base of written step-by-step guides and screen recordings; any intern can publish one.

Practices happen any day of the week at any time and frequently have **no scheduled end time**, which drives several design decisions (see "Open-ended shifts" below). Every intern also has a class schedule that must block them from being assigned.

## About the Design Files

The files in this bundle are **design references created in HTML** — a prototype showing intended look and behavior, not production code to copy directly. `Video Room.dc.html` is a single-file prototype built on a custom streaming template runtime; **do not try to reuse that runtime**. All application state is in-memory and per-session; there is no backend.

The task is to **recreate these designs in a real codebase**. There is no existing environment for this project, so pick an appropriate stack. Recommended, based on the constraints (6–10 users, phone-first, free hosting, one non-professional maintainer):

- **Next.js (App Router) + TypeScript + Tailwind CSS** on Vercel
- **Supabase** for Postgres, auth (email/password), storage (how-to screenshots and screen recordings), and row-level security
- Installable PWA (web app manifest + service worker) — the crew adds it to their home screen; no app stores

Treat the HTML as the visual and behavioral spec. Implement it with real persistence, real accounts, and real cross-device sync.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, and interaction states are final and intentional. Recreate the UI faithfully. The design follows a wireframe/blueprint visual system (square corners, hairline borders, corner registration marks, one solid accent fill) documented under "Design Tokens" and "Visual system" — do not substitute a generic component library's rounded-card look.

---

## Roles and permissions

Three roles. The prototype switches between them with a segmented control on the sign-in screen (a prototype affordance — in production the role comes from the user record).

| Capability | Intern | Head intern (admin) | Staff |
|---|---|---|---|
| Accept/decline own shifts | ✅ | ✅ | — |
| Propose a replacement on decline | ✅ | ✅ | — |
| Claim open slots | ✅ | ✅ | — |
| Build/assign shifts, post open slots | — | ✅ | ✅ |
| See crew coverage overview | — | ✅ | ✅ |
| Manage roster (add names, view everyone) | — | ✅ | ✅ |
| Edit another person's class schedule | — | ✅ (flag-gated) | ✅ (flag-gated) |
| Own timesheet + clock in/out | ✅ | ✅ | ❌ (salaried) |
| See everyone's weekly hours | — | ✅ | ✅ |
| Shared task buckets (read/write/check off) | ✅ | ✅ | ✅ |
| Personal task bucket | ✅ (private) | ✅ (private) | ✅ (private) |
| Publish how-tos | ✅ | ✅ | ✅ |

Notes:
- **Staff are salaried** — they have no timesheet, no clock button, and no hours strip on the home screen. Their hours tab is labeled `CREW HRS` and shows only the roster roll-up.
- **Head intern** is the app owner/operator: everything staff can do, plus their own timesheet.
- A `staffCanEditClasses` flag (default true) controls whether admins can edit other people's class blocks or only view them. Expose it as a настройка/setting, not hardcoded.

## Registration and roster matching

This is a deliberate two-step onboarding worth preserving:

1. An admin pre-populates the **roster** with names only — no emails needed (`Crew` screen → "Add a name to the roster"). Those entries show as `Invite pending`.
2. Each person later registers with **their own personal email** (gmail etc. — this is explicitly *not* a team-domain email) plus their name. The app **matches the typed name against the roster** and attaches the new account to the existing entry, so shifts, hours, and class blocks already entered for them are waiting.

Matching rules (implemented in `matchRoster`, port them):
- Normalize: lowercase, strip everything except letters and spaces, trim.
- Exact normalized match wins.
- Then: first-name match where the last-name initial also agrees (or the typed name has no last name) — so "maya" matches "Maya P.".
- Then: either string being a prefix of the other.
- Case and punctuation never matter.

Registration button states:
- Name or email empty → disabled, label `Add your name and email`
- Role = Intern and no roster match → enabled, label `Join and request access`; on submit the person is appended to the roster as unconfirmed
- Role = Head intern or Staff, or any roster match → label `Create account`
- Crew code field exists but is **optional** (label says so)

Helper line under the name field states the match result: `✓ Matched to the roster as Maya P. — your shifts and hours are already waiting.` / `Not on the roster — you can still join. Staff confirm you afterwards.` / for admins: `Staff accounts do not need a roster entry.`

---

## Screens / Views

Global chrome, present on all main tabs:

**Header** — `background: --color-accent-800` (#012169), white text, `padding: 56px 16px 12px` (the 56px absorbs the status bar). Left: eyebrow `DUKE MEN'S BASKETBALL` (font-heading, 11px, letter-spacing .22em, uppercase, color `--color-accent-300`) above `VIDEO ROOM` (font-heading, 600, 26px, line-height 1.05). Right: a 38×38 bell button, transparent with `1px solid rgba(255,255,255,0.28)`, Lucide-style 19px bell at stroke 1.5, with a notification badge — white square, min-width 17px, height 17px, navy text, font-heading 11px — pinned at `top:-5px; right:-5px`. Badge count = pending shift replies + 2 unread alerts until the alerts screen is opened.

**Bottom tab bar** — `display:grid; grid-template-columns: repeat(6,1fr)`, `border-top: 1px solid --color-divider`, `padding-bottom: 26px` (home indicator). Each tab: column flex, `gap:4px`, `padding: 10px 0 8px`, 20px Lucide icon at stroke 1.5, label in font-heading 11px, letter-spacing .06em, uppercase. Active tab: color `--color-accent-800` and a `2px solid` top border in the same color; inactive: `color-mix(in srgb, var(--color-text) 50%, transparent)` and a transparent top border.

Six tabs, left to right:
1. `TODAY` — home icon
2. `SCHEDULE` — calendar icon
3. `HOURS` (interns/admin) or `CREW HRS` (staff) — clock icon
4. `TASKS` — checklist icon
5. `HOW-TOS` — document icon
6. `CREW` (admins) or `CLASSES` (interns) — person icon

**Toast** — absolutely positioned `left:16px; right:16px; bottom:96px`, `background: --color-accent-900`, white, `padding: 11px 13px`, 13px text, `box-shadow: --shadow-lg`, auto-dismiss after 2600ms. Used for every confirmation ("Accepted — Tue 3:00 PM. Added to your week.", "Swap request sent to Devin L. Coaches copied.", etc.).

---

### 1. Sign in

Full-screen overlay, `z-index: 90`. Top two-thirds is a navy field (`--color-accent-800`) with the wordmark bottom-aligned: eyebrow `DUKE MEN'S BASKETBALL` (12px, letter-spacing .24em, `--color-accent-300`), then `VIDEO` / `ROOM` on two lines (font-heading 600, 52px, line-height 0.95), then a 13.5px line in `--color-accent-200`, max-width 260px: "Shifts, hours, task board and how-tos for the practice video crew."

Bottom card on `--color-bg`, `padding: 20px 24px 34px`, `gap: 12px`:
- Field `Email`, `type=email`, placeholder `you@gmail.com`, empty by default
- Field `Password`, `type=password`, placeholder `Your password`
- Segmented control `Head intern | Staff | Intern` (prototype role switch; default Head intern)
- Primary button `Sign in`, full width, height 44
- Footer row: "New intern this season?" + ghost button `Register`

### 2. Register

Navy header with back arrow, eyebrow `REGISTER`, title `Join the video room`. Scrolling body, `padding: 18px 20px`, `gap: 14px`:
- `Full name` + helper line showing the roster-match result (see Registration above)
- `Email` (`type=email`, placeholder `you@gmail.com`) + helper: "Any email you actually check — personal is fine. Sign-in and alerts go here."
- `Crew code from staff — optional`, placeholder `6 characters`
- `Role` segmented: `Intern | Head intern | Staff`, with a 12.5px note beneath that changes per role:
  - Intern: "Interns accept or decline shifts, log their own hours and work the task board."
  - Head intern: "Head intern: assign shifts, track the whole crew's hours, and keep your own timesheet."
  - Staff: "Staff build the schedule, assign shifts and post tasks, and see everyone's hours. Salaried — no timesheet of your own."

Footer: primary button, full width, height 44, label per the state table above.

### 3. Today (home)

`padding: 18px 16px 24px`, `gap: 18px`.

**Greeting block** — `Saturday · Aug 29` (font-heading 11px, letter-spacing .16em, uppercase, `--color-accent-700`), `h3` "Afternoon, Jordan.", then a 13px status line: "N shifts still need your answer · M accepted" or, when settled, "Week is settled — M shifts accepted."

**Next shift card** — `.card.blueprint` (transparent, hairline border, four corner marks), `padding: 14px`, `gap: 10px`. Kicker `Next shift`; session name (font-heading 600, 21px); `Tue · 3:00 PM · 2h 45m`; a status tag top-right. Divider, then a two-column grid: `Assignment` / `Location` with 10px uppercase labels above 13px values. If the shift is unanswered: two buttons side by side, `Accept shift` (primary) and `Can't make it` (secondary).

**`START PRACTICE MODE`** — primary button, full width, height 46, 16px, letter-spacing .04em.

**Hours strip** (hidden for staff) — `.card`, `padding: 13px`. Header row: `Hours this week` + total (font-heading 600, 19px) + "of 10–15" (11px muted). An 8px-tall progress bar: track `color-mix(in srgb, var(--color-text) 9%, transparent)`, fill width = `min(100, total/15*100)%`, fill color `--color-accent` at ≥10h else `--color-accent-400`, plus a 1px vertical tick at `left: 66.6%` marking the 10-hour minimum. Below: verdict line + ghost `Timesheet` link, then a full-width secondary button `Clock in · Not clocked in` / `Clock out · On the clock · 1.25 h · Full practice`.

**Daily checklist** — `h5` + progress ("2 of 5") in `--color-accent-700`. Rows are full-width buttons, `padding: 11px 2px`, bottom border `1px solid color-mix(in srgb, var(--color-text) 8%, transparent)`, an 19px square checkbox (`1px solid --color-accent-600`, filled `--color-accent` with a white ✓ when done) and 14px label that goes `line-through` + 42% opacity when checked.

**From the coaches** — `h5` + ghost `All tasks` link; up to two incomplete coach-assigned tasks as `.card`s, `padding: 11px 12px`: task title (14px) with a priority tag, then `.card-meta` "Coach Vance · Due Sun 6 PM".

### 4. Schedule

`padding: 16px`, `gap: 14px`.

Header row: `h4` "Week of Aug 31" + ghost button `Crew · 6` (admins). Beneath, uppercase summary "3 accepted · 3 pending" in `--color-accent-700`.

**Coverage panel** (admins only) — `.card.blueprint`, `padding: 13px`. Kicker `Coverage · whole crew` + a `.tag.tag-accent` with the role label ("Head intern · admin"). Then a 7-column grid of day cells: `Mon` (9.5px uppercase, 70% opacity), shift count (font-heading 600, 15px) or `—`, and a status word (8.5px uppercase): `set`, `N open`, or `no shifts`. Cells with unanswered shifts get `border: 1px solid --color-accent-900`; fully-set days get `background: --color-accent-100`. Tapping a cell filters the list below. Footer: a 3-column stat row — `awaiting reply`, `unclaimed`, `not signed up` — each a 19px font-heading number over a 10px uppercase label.

**Week strip** — 7 columns, each a button: day-of-week (10px uppercase), date number (font-heading 600, 16px), and a 5×5px dot (accent if you work that day, muted if someone else does, transparent if empty). Selected day inverts to navy background / white text.

**Scope segmented control** — `Whole week | My shifts`.

**Shift cards** — `.card.blueprint`, `padding: 13px`, `gap: 9px`:
- Left rail (52px): day-of-week (font-heading 11px uppercase `--color-accent-700`), start time (font-heading 600, 15px), duration or `Open end` (11px muted)
- Right: session name (font-heading 600, 17px), then `role · location` (12.5px, 62% text)
- Assignee row: 24×24 navy-tinted initials square (`--color-accent-100` bg, `--color-accent-800` text, font-heading 11px), name, status tag
- Optional note block above the actions: divider, then a `NOTE` label (font-heading 10px uppercase `--color-accent-700`) beside the 12.5px note text
- A right-aligned ghost button `Add a note` / `Edit note`
- Conditional action rows:
  - unanswered & mine → `Accept` (primary) + `Decline` (secondary)
  - declined & mine → note text ("You declined. Name who can cover it — coaches see the swap, not a hole in the schedule.") + secondary `Propose a replacement`
  - open slot → primary `Claim this slot`

Status tags: `Needs reply` (`.tag-outline`), `Accepted` (`.tag-accent`), `Declined` (`.tag-neutral`), `Swap sent` (`.tag-outline`), `Open slot` (`.tag-outline`).

Footer (admins): `+ New shift` (primary, flex 1) + `Quick open slot` (secondary).

### 5. Shift builder (admin, full-screen)

Navy header with an ✕ button, eyebrow `BUILD A SHIFT`, title `Week of Aug 31`. Body sections, each with a 10px uppercase muted label:

- **Day** — 7-column grid of day buttons (single select)
- **Start and end** — two `<select>`s separated by a 13px "to". Start options: every 15 minutes from 5:00 AM to 10:00 PM. End options: the same list prefixed with **`Open end`** (the default). Helper line beneath: "No end time — whoever works it clocks out when practice actually breaks." or "Scheduled 2h 30m — hours still come from the clock."
- **Session** — wrapping chips: `Full practice`, `Game`, `Half-court work`, `Individual workouts`, `Early lift`, `Live scrimmage`, `Film session prep`. Location auto-derives: Early lift → Weight room; Game and Live scrimmage → Main arena; Individual workouts → Auxiliary gym; Film session prep → Video room; everything else → Practice court.
- **Who works it** — stacked full-width buttons: `Leave open` first (sub-label "anyone can claim"), then every roster name. The right-hand sub-label normally shows that person's shift count ("2 this week", or "you"), **but when they have a class conflict it shows the conflict instead** — "ECON 101 4:00 PM–5:30 PM" — in `--color-accent-900` at weight 500.
- **Notes** — textarea, placeholder "Anything the crew should know — has to leave early, doubling up on cameras, meet at the loading dock…"

Footer: if a conflict exists, a bordered panel (`1px solid --color-accent-900`) with a `CLASS CONFLICT` label, the sentence "Tre W. has ECON 101 on Wed, 4:00 PM–5:30 PM. That overlaps this shift.", and a checkbox "Assign anyway — I cleared it with them". Then the summary line ("Wed · 4:15 PM · open end — Full practice · Practice court" / "Assigned to Tre W. — they must accept") and the primary button, height 44, labeled `Post shift` or, while blocked, `Conflict — check the box to override` (disabled).

### 6. Replacement / swap dialog

`.dialog-backdrop` + `.dialog.blueprint`, `z-index: 60`. Title `Propose a replacement`, body line naming the shift ("Live scrimmage · Sat 10:00 AM · Baseline + corner"). A scrollable radio list (max-height 212px) of every other crew member with their shift count on the right. Actions: `Cancel` (secondary) and `Send request` (primary, disabled until a pick). On send: status → `Swap sent`, toast "Swap request sent to Devin L. Coaches copied."

### 7. Shift note dialog

Same dialog shell, `z-index: 65`. Two modes:
- **Accept mode** (opens automatically right after accepting a shift): title `Shift accepted`, body "Anything staff should know? Times you have to leave, who is covering the rest.", cancel button reads `No note`
- **Edit mode** (from the card's Add/Edit note button): title `Shift note`, body "Everyone on the crew sees this, including staff.", cancel reads `Cancel`

Textarea placeholder: "e.g. Need to leave at 4:45 — Tre is covering the rest." Save button `Save note`.

### 8. Hours / Timesheet

Heading `Timesheet` (interns/admin) or `Crew hours` (staff); subhead "Week of Aug 24 · target 10–15 hours" / "Week of Aug 24 · interns owe 10–15 hours".

**Own timesheet block** (hidden for staff) — `.card.blueprint`, `padding: 14px`: the week total at font-heading 600 / 44px / line-height 0.9, beside a 12px muted "Room for 5.5 h more" or "Minimum 10 h · cap 15 h". A 12px progress bar with the same fill logic and the 10-hour tick at 66.6%. An axis row: `0` / `10 MIN` / `15 CAP` (10px uppercase). A 13px verdict line: "At the top of the range" / "In range — you are good" / "1 h short of the 10 h minimum". Primary `Clock in` / `Clock out` button (height 42) and a centered 11.5px status line ("On the clock · 1.25 h · Full practice").

**Entries** — rows of `Mon` / `Aug 24` (52px rail), session name, a `Clocked` or `Manual` tag, and hours right-aligned in font-heading 600 15px.

**Log a shift you worked** — for each accepted shift not yet logged: a bordered row with the label, sub-line, and a secondary button `Log 2.5 h`. **If the shift is open-ended** the sub-line reads "3:00 PM · no set end time" and the button reads `Use the clock` — tapping it clocks you in rather than logging a guess.

**Everyone this week** (admins and staff) — `h5` + "N under 10" in accent. One row per crew member: name, hours (font-heading 600 15px), a status word right-aligned in a 56px column (`at cap` / `in range` / `2 h short`, the last in `--color-accent-900`), and a 7px bar with the same fill rules and 10-hour tick.

**My earlier weeks** (hidden for staff) — three prior weeks: label, hours, `met`/`under`, and a 6px bar.

### 9. Tasks

`h4` `Task board`. A horizontally scrolling row of bucket chips, each showing its label and incomplete count: `From coaches`, `Daily`, `During practice`, `Post-practice`, `Game day`, `Mine`. Active chip inverts to navy.

Beneath the chips, a 12px privacy line:
- `Mine` → "Private — only you see this list." in `--color-accent-700`
- everything else → "Shared with the whole crew — anyone can add one or check one off." in 50% text

Task rows: 20px square checkbox (same treatment as the daily checklist), 14px title that strikes through when done, then a meta row — "Coach Vance · Due Sun 6 PM" (11px muted) plus a tag. Tag colors: `Priority`/`Required` → `.tag-accent`; `Live`/`Game` → `.tag-outline`; everything else → `.tag-neutral`.

Footer: text input with a contextual placeholder ("Add to Daily…") + primary `Add`; Enter also submits.

### 10. Practice mode (full-screen)

`background: --color-accent-900`, white text, `z-index: 40`.

Header: eyebrow `DURING PRACTICE`, session title (font-heading 600, 24px), and progress `4/9` in `--color-accent-300`. A 3px white-on-translucent progress bar beneath.

Step rows: full-width buttons, `padding: 14px 0`, bottom border `1px solid rgba(255,255,255,0.14)`, a 22px square checkbox (`1px solid rgba(255,255,255,0.5)`, fills white with navy ✓ when done), a 15px title (drops to 0.5 opacity + strike-through when done), and an 11.5px hint line in `--color-accent-300`.

The nine steps and hints:
1. Cameras up, framed, and recording 20 min early — *Baseline first, then corner*
2. Slate the file: date, session type, personnel — *Say it out loud on the mic too*
3. Confirm audio on the coach mic — *Levels around −12 dB*
4. Mark warmup / stretch break — *Tap as the horn sounds*
5. Mark each drill segment as it starts — *Shell, closeouts, transition*
6. Flag every "pull that one" from staff — *Note the player and the action*
7. Watch card space at the halfway point — *Swap if under 20 min left*
8. Mark live scrimmage start and stop — *Coaches watch this segment first*
9. Stop recording only after staff clears the floor — *Post-practice talks get used*

Footer: `End practice` (white fill, navy text) + `Minimize` (outlined). **End practice navigates to Tasks with the Post-practice bucket selected** and toasts "Practice closed. Post-practice list is up next."

### 11. How-tos (list)

Header row: `h4` `How-tos` + 13px "Written by the room, for the room.", and a primary `+ New` button.

Each entry is a horizontal `.card.blueprint` button, `padding: 0`:
- Left: an 84px-wide thumbnail column, `background: --color-accent-200`, right border, filled with a 45°-rotated SVG stripe pattern (`--color-accent-400`, 2.5px lines, 7px pitch) and a centered monospace 9px chip on `--color-bg` naming the missing asset ("tripod setup", "editor UI"). **These are placeholders for real screenshots** — replace with uploaded images.
- Right: kicker (`HARDWARE` / `SOFTWARE` / `WORKFLOW` / `GAME DAY`), title (font-heading 600, 17px), and `.card-meta` ("Written · 6 steps · updated Aug" or "Video · 7:40").

Six seeded guides: baseline camera setup; tagging a practice in the editor (video); export presets for staff vs players; card offload and backup verification; uploading to the shared drive + Hudl (video); bench iPad tagging setup for games. Their full step content is in the prototype file and is real, usable copy — port it as seed data.

### 12. How-to detail

Navy header with back arrow, kicker, and title. Body `padding: 16px`:
- Video guides open with a 16:9 striped placeholder carrying a monospace chip "screen recording · 7:40" — **replace with a real video player**
- 14px intro paragraph
- Numbered steps: a 26px navy square with the step number, then step title (font-heading 600, 16px) and body (13.5px, line-height 1.5, 78% text), with an optional 104px-tall striped screenshot placeholder labeled with what it should show
- Footer credit line above a top border: "Written by Maya P. · last checked Aug 24"

### 13. Compose how-to (full-screen)

Navy header with ✕, eyebrow `NEW HOW-TO`, title `Write it once`. Body:
- `Title` input, placeholder "e.g. Resetting the corner camera mid-practice"
- `Category` chips: Hardware / Software / Workflow / Game day
- `Format` segmented: `Written steps | Screen recording`
- `Intro — why this matters` textarea, placeholder "One or two lines. When does someone need this?"
- If video format: a full-width secondary button `Attach screen recording` that toggles to `Recording attached ✓` — **in production this is a real file upload to storage**
- `Steps` section with a count; each added step renders in a bordered row with its number square, title, body, and two ghost buttons: `No screenshot` / `Screenshot attached` (toggle — **make this a real image upload**) and `Delete`
- A bordered composer at the bottom: step title input, step body textarea, secondary `Add step`

Footer: primary button, height 44 — `Add a title` (disabled) / `Add at least one step` (disabled) / `Publish to the room`. On publish the guide is prepended to the list, credited to the author, and its detail view opens.

### 14. Crew / roster (admin, full-screen)

Navy header with ✕, eyebrow `ROSTER`, title `The crew`. Intro: "Add names now, no email needed. When someone signs up with that name, their account attaches to this roster entry — shifts, hours and classes already waiting." Then a secondary `My class schedule` button.

Rows (tappable, opening that person's class screen): 28px initials square, name, their email or "no email yet", a third line "2 shifts this week · 3 blocks on file", and a `Registered` (`.tag-accent`) or `Invite pending` (`.tag-outline`) tag.

Footer: text input "Add a name to the roster" + primary `Add`.

### 15. Class times / availability (full-screen)

Navy header, eyebrow `CLASS TIMES · NOT AVAILABLE`, title `My class schedule` or `Maya P.'s classes`. Intro copy differs: your own — "Add every class and anything else you cannot miss. Staff see the conflict before they assign you, not after."; someone else's (admin editing) — "You are entering these for Maya P. Pick every day the class meets, then Block."

Block rows, sorted by day then start time: a 42px day rail (font-heading 12px uppercase accent), label ("STAT 210"), span ("9:00 AM – 10:15 AM" or "All day — cannot work"), and a ghost `Remove`.

Editor footer (when permitted):
- A 7-column day grid that is **multi-select** — tap Mon, Wed, Fri to enter an MWF class in one pass. Helper line: "Blocking Mon, Wed, Fri — one entry per day, same time." / "Pick the days this class meets (tap several — MWF in one go)."
- Two time `<select>`s ("to" between them), same 15-minute options
- Course/reason input + primary `Block`

Validation: at least one day; end must be after start (toast "End time has to be after the start."). One block record is created per selected day.

### 16. Classes tab (intern)

`h4` `My availability` + the user's email. Intro: "Classes and days you cannot work. Staff see a conflict warning before they assign you."

**Blocked time** — `h5` + ghost `Add classes` (opens screen 15). Rows show day rail, label, span, a `Class` or `Day off` tag, and `Remove`. Empty state: a bordered box, "Nothing blocked yet — every hour of the week is open."

**Something came up** — `.card.blueprint`: kicker, the line "Block a whole day you cannot work this week.", a 7-column single-select day grid, then a reason input ("Reason — e.g. exam, travel home") + primary `Block day`. Creates an all-day block that counts as a conflict.

### 17. Alerts

Reached from the header bell; replaces the tab content (all tab bar items go inactive). `h4` `Alerts` + ghost `Done`. Rows: a 7px square dot (accent when unread, 25% text when not), 14px title, 11px timestamp. Seeded examples: "Coach Vance moved Wednesday practice to 4:15 PM" (18 min ago), "You have 3 shifts awaiting your response this week", "Devin L. accepted your swap request for Sat 10:00 AM", "New how-to posted: Bench iPad tagging setup", "Maya P. finished the Tuesday practice upload". Footer: a full-width secondary `Sign out`.

---

## Interactions & Behavior

**Open-ended shifts** (important — this is the crew's real constraint). Practices start on time and end whenever they end. So:
- The builder's end time defaults to `Open end`; duration renders as "Open end" rather than a number.
- Hours for those shifts come only from clock in/out, never from a scheduled length.
- The Hours tab's "Log a shift you worked" shortcut refuses to guess: for open-ended shifts the button becomes `Use the clock` and starts the timer.
- For conflict checking only, an open-ended shift is treated as a 150-minute window from its start (a heuristic — document it, keep it).

**Accept flow.** Accept → status becomes `Accepted`, toast fires, and the note dialog opens immediately in accept mode so the intern can add "need to leave at 4:45" while it's in their head. `No note` dismisses.

**Decline flow.** Decline → status `Declined`. If `requireSwapOnDecline` is on (default), the replacement dialog opens immediately and the card afterwards shows the "name who can cover it" prompt with a `Propose a replacement` button. If off, it just toasts "Declined — coaches notified." Sending a swap sets status `Swap sent`.

**Conflict checking.** A shift conflicts with a block when the day matches AND (the block is all-day OR the time ranges overlap: `blockStart < shiftEnd && blockEnd > shiftStart`). Surfaces in three places: the person's sub-label in the builder's people list, the footer conflict panel, and the disabled post button. Always overridable with an explicit checkbox — never a hard block.

**Clock in/out.** Clock in stamps the time and labels the session from the user's next shift. A 15-second interval keeps the live duration fresh. Clock out rounds to the nearest quarter hour with a 0.25 h floor and writes an entry tagged `Clocked`. Manual logs are tagged `Manual`.

**Hours math.** Weekly total = sum of that person's entries + live clock time. Progress bar percentage = `min(100, total / 15 * 100)`. The 10-hour tick sits at `66.6%`. Bars go full `--color-accent` at ≥10 h, `--color-accent-400` below. Verdict thresholds: ≥15 "At the top of the range", ≥10 "In range — you are good", else "N h short of the 10 h minimum". Format hours to the quarter, trimming trailing zeros, suffix " h".

**Task checkboxes** are optimistic toggles. Shared buckets write for everyone; `Mine` is scoped to the user.

**Practice mode** persists its checked steps while open and clears per session. Ending it routes to the post-practice task bucket.

**Badge count** = unanswered shifts + 2 until the alerts screen has been visited once.

**Empty and blocked states worth keeping:** "Nothing blocked yet — every hour of the week is open."; disabled publish/post buttons that *say why* in their label rather than going silently grey.

**Responsive.** Phone-first, designed at 402×874 (iPhone 16 Pro). Content column is fluid; nothing depends on a fixed width. On tablet/desktop, cap the column around 480px and center it — do not stretch the tab bar across a wide viewport.

**Animation.** Deliberately minimal — no page transitions, no spring animations. Only the toast appears and disappears. Keep it that way; the app gets used courtside in a hurry.

---

## State Management

Server-side data model (Supabase / Postgres). The prototype's in-memory shapes map cleanly:

```
profiles          id, full_name, email, role ('intern'|'lead'|'staff'),
                  roster_confirmed bool, created_at
                  -- pre-created rows with name only and email null are the "Invite pending" roster
shifts            id, day_of_week, date, start_time, end_time nullable (null = open end),
                  session_type, camera_role nullable, location,
                  assignee_id nullable (null = open slot),
                  status ('pending'|'accepted'|'declined'|'swap_sent'|'open'),
                  note text, created_by, created_at
swap_requests     id, shift_id, from_profile, to_profile, status, created_at
availability      id, profile_id, day_of_week, start_time nullable, end_time nullable,
                  all_day bool, label
time_entries      id, profile_id, date, session_label, hours numeric,
                  source ('clocked'|'manual'), clock_in_at nullable
tasks             id, bucket ('assigned'|'daily'|'practice'|'post'|'game'|'personal'),
                  title, assigned_by, due_label, tag, owner_id nullable,
                  -- owner_id set only for personal tasks
                  created_at
task_completions  task_id, profile_id, completed_at
                  -- daily/practice checklists reset per day, so completion is dated, not a bool
guides            id, author_id, kicker, title, format ('written'|'video'),
                  intro, video_url nullable, created_at, updated_at
guide_steps       id, guide_id, position, title, body, image_url nullable
notifications     id, profile_id, title, body, read_at, created_at
```

Client state (per session): active tab, selected day, scope filter, active task bucket, open overlay (practice / guide / compose / crew / availability / builder), dialog targets, builder draft, compose draft, live clock start.

Row-level security: interns read all shifts, tasks (except others' personal), availability, guides, and hours-summary data; interns write only their own shift responses, availability, time entries, task completions, and guides. Admins (`lead`, `staff`) write shifts and roster entries. Staff have no time entries at all.

Recurring resets to implement server-side: daily and during-practice checklists complete per date; the weekly hour target runs Monday–Sunday.

**Notifications.** The design shows in-app alerts with a header badge. For a crew that lives on their phones, add web push (or email via Supabase functions) for: shift assigned, shift accepted/declined, swap requested, swap answered, practice time changed, new how-to posted, and a Sunday-night nudge for anyone under 10 hours.

---

## Design Tokens

From the Industry design system (`_ds/industry-*/styles.css`), with Duke navy substituted for the accent ramp. Take values from CSS custom properties; do not hardcode.

**Colors**
```
--color-bg          #f3f3f2   page ground
--color-surface     #eaeae9
--color-text        #1d1f20
--color-divider     hairline borders (from the DS sheet)

Accent ramp (Duke navy):
--color-accent      #00539b   base accent
--color-accent-100  #e9f1fb   tinted fills, thumbnails
--color-accent-200  #cbdff5   placeholder grounds
--color-accent-300  #a2c4ea   text on navy fields (eyebrows, hints)
--color-accent-400  #6ea1d8   under-target progress fill
--color-accent-500  #2e7dc2
--color-accent-600  #00539b   checkbox borders
--color-accent-700  #013f7d   accent-colored small text (WCAG-safe on the light ground)
--color-accent-800  #012169   Duke navy — headers, active tabs, primary fills
--color-accent-900  #00133f   practice mode field, warnings, toasts

Body background outside the device frame: #dcdcd9
```
Muted text is expressed as `color-mix(in srgb, var(--color-text) N%, transparent)` at 50% (labels), 55% (subheads), 62% (secondary body), 78% (guide body), 42% (completed items). Hairlines inside lists: `1px solid color-mix(in srgb, var(--color-text) 8%, transparent)`.

**Typography** — `--font-heading` Barlow Condensed (600 for titles), `--font-body` Barlow. Sizes in use: 8.5, 9, 9.5, 10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 19, 21, 24, 26, 44, 52 px. Uppercase labels carry letter-spacing .06–.24em. Minimum tap target 44px on primary actions.

**Spacing** — from the DS `--space-*` scale (0.85× density). Observed rhythm: 16px screen padding, 18px section gaps on Today, 14px on list screens, 8–10px within cards, 4–6px in grids.

**Radius — zero.** Everything is square. This is a load-bearing rule of the visual system.

**Shadows** — only `--shadow-lg` on the toast and `.dialog`. Cards get no elevation.

**Visual system (Industry).** Cards, figures, and the primary button are wireframe objects: square corners, hairline border, transparent (unfilled) ground, and four `+` registration marks at the corners (`.blueprint` + four `<i class="corner tl|tr|bl|br">`). The solid navy primary button is the one deliberate filled object. Photography goes through a `.duotone` wrapper that washes it into the accent. Icons are Lucide at stroke-width 1.5 — no thicker. Focus is a 2px accent `:focus-visible` outline at 2px offset; never leave the browser default. Do not round corners, do not add surface fills to cards, do not drop the registration marks, and do not introduce a second decorative color.

---

## Assets

No real image assets exist yet. Every image position is an intentional placeholder: a striped SVG pattern (45° lines, `--color-accent-400`, 2.5px stroke, 7px pitch) over `--color-accent-200`, with a monospace chip naming what belongs there. Locations: how-to list thumbnails (84×full-height), how-to detail video frames (16:9), and per-step screenshots (104px tall).

Replace all of them with real uploads. The compose screen's `Attach screen recording` and per-step `Screenshot` toggles are stubs standing in for real file inputs → object storage.

Fonts: Barlow and Barlow Condensed (Google Fonts, weights 400–600). Icons: Lucide.

## Files

- `Video Room.dc.html` — the complete prototype: all 17 screens, all seeded content (crew, shifts, tasks, practice steps, six full how-tos with real step copy), and all interaction logic. The `<script data-dc-script>` block near the end holds the logic class; the markup above it is the template. Read the logic class for exact state shapes, matching rules, and hour math.
- `ios-frame.jsx` — device bezel used only to frame the prototype. Not part of the app; ignore.
- `_ds/industry-*/styles.css` — the Industry design system token sheet and component classes (`.btn`, `.card`, `.tag`, `.field`, `.input`, `.seg`, `.radio`, `.dialog`, `.blueprint`, `.duotone`). The source of truth for every color, font, space, and component treatment. Port these as your base layer (Tailwind theme extension or CSS custom properties — either is fine, keep the names).

## Suggested build order

1. Supabase project, schema above, email/password auth, RLS policies.
2. Design tokens + the primitives: `.btn` variants, `.card.blueprint` with corner marks, `.tag`, form controls, tab bar, toast.
3. Auth screens with roster matching (screens 1–2).
4. Schedule + shift builder + conflict checking + accept/decline/swap/notes (screens 4–7). This is the core; get it right before anything else.
5. Availability (screens 15–16) — the builder needs it to be useful.
6. Hours (screen 8) with clock in/out.
7. Today (screen 3) — it's a composed dashboard, so it comes after its parts exist.
8. Tasks (screen 9) with dated completions.
9. Practice mode (screen 10).
10. How-tos with real uploads (screens 11–13).
11. Crew roster (screen 14), alerts + push (screen 17).
12. PWA manifest, icons, add-to-home-screen, offline shell.

Ship after step 7 if you need to — schedule, availability, and hours are the parts that replace the group text.
