# Homepage UX Architecture

The homepage is about the academy only. The marketing agency lives on `/media` and its pages; nothing on
the homepage sells agency services.

Story arc: **ENTRY → DISCOVERY → EXPLORATION → PROOF → CONVERSION**

| # | Section | Goal | Signature interaction |
|---|---|---|---|
| 0 | Header | Orientation, always-available CTA | Transparent → glass → compact on scroll; inverts only over full-width dark sections; language select with flags |
| 1 | Hero: "Kelajak kasblarini bugundan oʻrganing." | Immediate positioning and energy | Word-rise headline and ecosystem tiles on CSS keyframes from the first paint; glass stat chips; cursor parallax on desktop, scroll-timeline drift on phones |
| 2 | Journey: "Bilimdan koʻnikmaga. Koʻnikmadan kasbga." | Explain the education model | Bilim → Koʻnikma → Tajriba → Kasb. Desktop: an ascending staircase ending in the solid orange goal step. Phones: a compact numbered progression whose connector fills as the steps arrive |
| 3 | Courses: "Qaysi kasbni tanlaysiz?" | Exploration | Six course cards (featured first; 3 × 2 on desktop, 2 × 3 compact cards on phones) and a small "Barcha kurslarni koʻrish +N" link under the grid to `/kurslar` |
| 4 | Results: "Bizning natijalarimiz gapiradi." | Proof | Counters (500+ / 9+ / 100+) that count up when they scroll in; stories only when real ones exist |
| 5 | Application | Convert | Course application form on a peach ambient glass card; contact facts |
| 6 | Footer | Navigation, trust | Courses column (agency links only on `/media`), branches, hours, socials |

Every section answers: purpose · hierarchy · interaction · identity. Sections that need real assets degrade
gracefully (hidden or replaced with a structural placeholder in the demo seed).

Motion rules: transform/opacity only, nothing on screen is hidden while JavaScript loads, and
`prefers-reduced-motion` turns entrances off. See `docs/PERFORMANCE.md`.
