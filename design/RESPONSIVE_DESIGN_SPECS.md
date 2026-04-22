# 📱 RESPONSIVE DESIGN SPECIFICATIONS

**Project**: QLHS (Kế Hoạch Giáo Dục Cá Nhân)  
**Version**: 1.0  
**Focus**: Mobile-first responsive design

---

## BREAKPOINTS & DEVICE TARGETS

```
Extra Small   │  Small    │  Medium   │  Large    │  Extra Large
(XS)          │  (SM)     │  (MD)     │  (LG)     │  (XL)
─────────────────────────────────────────────────────────────
< 320px       │ 320-575px │ 576-991px │ 992-1199  │ ≥ 1200px
              │           │           │ px        │
Phone         │ Tablet    │ Small     │ Desktop   │ Large
(very small)  │ Portrait  │ Desktop   │           │ Desktop
              │           │ (Laptop)  │           │

Example devices:
iPhone SE     │ iPad      │ Windows   │ iMac      │ 4K Monitor
(375px)       │ (768px)   │ (800px)   │ (1024px)  │ (2560px)
```

### CSS Media Queries

```scss
// Mobile First Approach
body { 
  // XS default styles (320px+)
  font-size: 14px;
}

@media (min-width: 576px) {
  // SM: Tablets portrait
  body { font-size: 15px; }
}

@media (min-width: 768px) {
  // MD: Tablet landscape / Small desktop
  body { font-size: 16px; }
}

@media (min-width: 992px) {
  // LG: Desktop
  body { font-size: 16px; }
}

@media (min-width: 1200px) {
  // XL: Large desktop
  body { font-size: 18px; }
}

// Print styles
@media print {
  // PDF export optimization
  body { background: white; }
  nav, footer { display: none; }
}
```

---

## SCREEN-BY-SCREEN RESPONSIVE BEHAVIOR

## 1. LOGIN SCREEN

### XS (320px) - iPhone SE
```
┌────────────────────────────────┐
│                                │
│ (32px safe area)               │
│                                │
│   ┌──────────────────────┐     │
│   │                      │     │
│   │   LOGO (80px)        │     │
│   │                      │     │
│   └──────────────────────┘     │
│                                │
│   QLHS                         │
│   (Kế Hoạch Giáo Dục)         │
│   (16px title, center)         │
│                                │
│   ┌──────────────────────┐     │
│   │ Email                │     │
│   │ [________________]   │     │
│   │                      │     │
│   │ Password             │     │
│   │ [________________]   │     │
│   │                      │     │
│   │ ☐ Remember me       │     │
│   │                      │     │
│   │ [  Đăng Nhập      ]  │     │
│   │                      │     │
│   │ Forgot password?     │     │
│   └──────────────────────┘     │
│                                │
│ © QLHS 2026                    │
└────────────────────────────────┘

Layout Rules:
- Full width - 32px padding (safe area)
- Center content
- Form width: 100% (288px actual)
- Button height: 56px (touch-friendly)
- Input height: 56px
- Focus outline: 2px blue
- Font size: 16px (prevents zoom on iOS)
- Logo: 80px × 80px
```

### SM (375px) - iPhone 12
```
┌────────────────────────────────────┐
│      (Safe area 16px)              │
│                                    │
│      ┌──────────────────────────┐  │
│      │                          │  │
│      │     LOGO (100px)         │  │
│      │                          │  │
│      └──────────────────────────┘  │
│                                    │
│      QLHS - Kế Hoạch Giáo Dục     │
│      (18px title)                 │
│                                    │
│      ┌──────────────────────────┐  │
│      │ Email                    │  │
│      │ [____________________]   │  │
│      │                          │  │
│      │ Password                 │  │
│      │ [____________________]   │  │
│      │                          │  │
│      │ ☐ Remember me            │  │
│      │ [    Đăng Nhập       ]   │  │
│      │                          │  │
│      │ Forgot password?         │  │
│      └──────────────────────────┘  │
│                                    │
│            © QLHS 2026             │
└────────────────────────────────────┘

Changes from XS:
- Padding: 32px → 16px
- Form width: 343px (100% - 32px)
- Logo: 100px × 100px
- Title font: 18px
```

### MD (768px) - iPad Portrait
```
┌─────────────────────────────────────┐
│                                     │
│          ┌──────────────────┐       │
│          │                  │       │
│          │   LOGO (120px)   │       │
│          │                  │       │
│          └──────────────────┘       │
│                                     │
│      Kế Hoạch Giáo Dục Cá Nhân     │
│      (24px title)                   │
│                                     │
│          ┌──────────────────┐       │
│          │ Email            │       │
│          │ [______________] │       │
│          │                  │       │
│          │ Password         │       │
│          │ [______________] │       │
│          │                  │       │
│          │ ☐ Remember me    │       │
│          │                  │       │
│          │ [  Đăng Nhập    ] │       │
│          │                  │       │
│          │ Forgot password? │       │
│          └──────────────────┘       │
│                                     │
│          © QLHS 2026                │
│                                     │
└─────────────────────────────────────┘

Changes from SM:
- Centered on page
- Form width: 320px (fixed)
- Logo: 120px × 120px
- Title font: 24px
- Better spacing around form
```

### LG (1024px+) - Desktop
```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              ┌────────────────┐              │
│              │                │              │
│              │  LOGO (120px)  │              │
│              │                │              │
│              └────────────────┘              │
│                                              │
│         Kế Hoạch Giáo Dục Cá Nhân           │
│         (24px, centered)                     │
│                                              │
│              ┌────────────────┐              │
│              │ Email          │              │
│              │ [__________]   │              │
│              │                │              │
│              │ Password       │              │
│              │ [__________]   │              │
│              │                │              │
│              │ ☐ Remember me  │              │
│              │                │              │
│              │ [  Đăng Nhập  ]│              │
│              │                │              │
│              │ Forgot password│              │
│              └────────────────┘              │
│                                              │
│              © QLHS 2026                     │
│                                              │
└──────────────────────────────────────────────┘

No changes from MD (same layout)
```

---

## 2. DASHBOARD - CHILDREN LIST

### XS (320px)
```
┌────────────────────────────────┐
│ ☰ QLHS      User ▼            │ (sticky header)
├────────────────────────────────┤
│                                │
│ Dashboard                      │
│ Welcome, Cô Thanh              │
│                                │
│ Stat cards STACKED:            │
│ ┌──────────────────────────┐   │
│ │ 🧒 50 Children           │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ 📋 8 Plans This Month    │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ ✓ 3 Approved             │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │ 92% Avg Achievement      │   │
│ └──────────────────────────┘   │
│                                │
│ My Children                    │
│ [Search...................]   │
│ [+ Add New Child        ]    │
│                                │
│ Filters (full width):          │
│ [All Teachers ▼]               │
│ [Sort: Name ▼]                 │
│                                │
│ Children (stacked cards):      │
│ ┌──────────────────────────┐   │
│ │ 👧 Võ Lê Yến Nhi        │   │
│ │ 4.5 years                │   │
│ │ Teacher: Võ Thị Thanh    │   │
│ │ Thúy                     │   │
│ │ Latest: Apr 2026 ✓       │   │
│ │                          │   │
│ │ [View] [Edit] [Plan]     │   │
│ └──────────────────────────┘   │
│                                │
│ ┌──────────────────────────┐   │
│ │ 👦 Nguyễn Minh Anh      │   │
│ │ 4.2 years                │   │
│ │ Teacher: Nguyễn Thị Minh │   │
│ │ Latest: Apr 2026 ✓       │   │
│ │                          │   │
│ │ [View] [Edit] [Plan]     │   │
│ └──────────────────────────┘   │
│                                │
│ ┌──────────────────────────┐   │
│ │ [Load More...]           │   │
│ └──────────────────────────┘   │
│                                │
└────────────────────────────────┘

Layout Rules XS:
- Hamburger menu (top-left)
- User menu (top-right)
- 100% width cards
- 16px horizontal padding
- Stats: 1 column (full width)
- Children: Full width cards
- Card padding: 16px
- Button width: 100% (or 3 columns if space)
- Font sizes: 14px body, 16px headings
```

### SM (375px)
```
[Layout similar to XS]
- Slightly more breathing room
- Stats cards: Still 1 column
- Child cards: Full width
- Font sizes increase slightly (14px → 15px)
```

### MD (768px) - Tablet
```
┌──────────────────────────────────────────────┐
│ ☰  QLHS      Dashboard │ Children  ▼        │
├──────────────────────────────────────────────┤
│                                              │
│ Welcome, Cô Võ Thị Thanh Thúy                │
│ 50 Children | 8 Plans This Month             │
│                                              │
│ Stat cards (2 columns):                     │
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ 🧒 50 Children   │ │ 📋 8 Plans       │   │
│ └──────────────────┘ └──────────────────┘   │
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ ✓ 3 Approved     │ │ 92% Avg          │   │
│ └──────────────────┘ └──────────────────┘   │
│                                              │
│ My Children                                  │
│ [Search...........................] [+ New] │
│                                              │
│ [All Teachers ▼] [Sort: Name ▼]            │
│                                              │
│ Children (2-column grid):                    │
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ 👧 Võ Lê Yến Nhi │ │ 👦 Nguyễn Minh   │   │
│ │ 4.5 years        │ │ Anh               │   │
│ │ Võ Thị Thanh     │ │ 4.2 years         │   │
│ │ Thúy             │ │ Nguyễn Thị Minh   │   │
│ │ Apr 2026 ✓       │ │ Apr 2026 ✓        │   │
│ │ [View] [Edit]    │ │ [View] [Edit]     │   │
│ │ [Plan]           │ │ [Plan]            │   │
│ └──────────────────┘ └──────────────────┘   │
│                                              │
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ 👧 Trần Bảo An   │ │ ...more children │   │
│ │ 3.8 years        │ │                  │   │
│ │ ...              │ │                  │   │
│ └──────────────────┘ └──────────────────┘   │
│                                              │
│ [Load More...]                               │
└──────────────────────────────────────────────┘

Layout Changes MD:
- Sidebar: Off-canvas (hamburger menu)
- Stats: 2 column grid
- Children: 2 column card grid
- Card padding: 20px
- Wider spacing
- Font size: 15px body, 18px headings
```

### LG (1024px+) - Desktop
```
┌────────────────────────────────────────────────────────┐
│ QLHS  │ Dashboard │ Children │ Plans │ Reports │ User ▼│
├────────────────────────────────────────────────────────┤
│                                                        │
│ Dashboard - Welcome, Võ Thị Thanh Thúy                │
│ Trường Mầm Non Quốc Tế ABC | 50 Children | 3 Plans  │
│                                                        │
│ Quick Stats (4 columns):                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ 🧒50     │ │ 📋8      │ │ ✓3       │ │ %92      │  │
│ │ Children │ │ Plans    │ │ Approved │ │ Avg      │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│ My Children                                            │
│ [Search by name.....................] [+ Add New]    │
│                                                        │
│ Filter: [All ▼] [Teacher: All ▼]   Sort: [Name ▼]   │
│                                                        │
│ TABLE FORMAT:                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Name              │ Age │ Teacher     │ Latest Plan│ │
│ ├────────────────────────────────────────────────────┤ │
│ │ 👧 Võ Lê Yến Nhi  │ 4.5 │ Võ Thị      │ Apr 2026✓ │ │
│ │                                 Thanh Thúy        │ │
│ │ Actions: [View] [Edit] [Plan]                     │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ 👦 Nguyễn Minh    │ 4.2 │ Nguyễn Thị │ Apr 2026✓ │ │
│ │ Anh                      Minh                     │ │
│ │ Actions: [View] [Edit] [Plan]                     │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ 👧 Trần Bảo An    │ 3.8 │ Trần Thị   │ Mar 2026✓ │ │
│ │                                 Thu Hương        │ │
│ │ Actions: [View] [Edit] [Plan]                     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Pagination: ◄ 1 2 3 4 ... ► Showing 1-3 of 50        │
└────────────────────────────────────────────────────────┘

Layout Changes LG:
- Horizontal navigation bar visible
- Stats: 4 columns (full row)
- Children: Table format (traditional)
- Table columns: Name, Age, Teacher, Latest Plan, Actions
- Hover effects on rows
- Font size: 16px body, 20px headings
```

---

## 3. CREATE PLAN FORM RESPONSIVE

### XS (320px)
```
┌────────────────────────────────┐
│ ☰ QLHS              [Cancel]  │
├────────────────────────────────┤
│                                │
│ Create Plan                    │
│ Step 1 of 3                    │
│ ████░░░░░░░░░ (33%)           │
│                                │
│ Select Child & Month           │
│                                │
│ Child *                        │
│ ┌──────────────────────────┐   │
│ │ Võ Lê Yến Nhi (4.5y) ▼   │   │
│ └──────────────────────────┘   │
│                                │
│ Month *                        │
│ ┌──────────────┐                │
│ │ April     ▼  │                │
│ └──────────────┘                │
│                                │
│ Year *                         │
│ ┌──────────────┐                │
│ │ 2026      ▼  │                │
│ └──────────────┘                │
│                                │
│ ⚠ Plan exists for this period │
│ ☐ Copy from April?            │
│                                │
├────────────────────────────────┤
│                                │
│ [Cancel]  [Next Step ▶]        │
│                                │
└────────────────────────────────┘

XS Layout Rules:
- Full width inputs
- Stacked layout
- 16px padding
- 56px button height
- Selects full width
- Month/Year in 2 columns
```

### SM/MD (375-768px)
```
┌──────────────────────────────────┐
│ ☰ QLHS              [Cancel]    │
├──────────────────────────────────┤
│                                  │
│ Create Education Plan            │
│ Step 1 of 3                      │
│ ████░░░░░░░░░░░░░░░░░░░ (33%)   │
│                                  │
│ Select Child & Time Period       │
│                                  │
│ Child *                          │
│ ┌──────────────────────────────┐ │
│ │ Võ Lê Yến Nhi (4.5y)    ▼   │ │
│ └──────────────────────────────┘ │
│                                  │
│ Time Period                      │
│ ┌──────────────┐ ┌────────────┐ │
│ │ Mo: April ▼│ │ Yr: 2026 ▼│ │
│ └──────────────┘ └────────────┘ │
│                                  │
│ ⚠ Plan exists for this period   │
│ ☐ Copy evaluation from April?   │
│                                  │
├──────────────────────────────────┤
│                                  │
│ [Previous ◄]      [Next Step ▶]  │
│                                  │
└──────────────────────────────────┘

SM/MD Layout Rules:
- Month & Year side-by-side
- More spacing
- Selects 50% width each
```

### LG (1024px+)
```
┌────────────────────────────────────────┐
│ QLHS     Dashboard  Children  Plans    │
├────────────────────────────────────────┤
│                                        │
│ Create Education Plan                  │
│ Step 1 of 3: Select Child & Time      │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░ (33%)  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │                                  │  │
│ │ Child *                          │  │
│ │ ┌──────────────────────────────┐ │  │
│ │ │ Võ Lê Yến Nhi (4.5 yrs) ▼   │ │  │
│ │ └──────────────────────────────┘ │  │
│ │                                  │  │
│ │ Time Period                      │  │
│ │ ┌─────────────────┐              │  │
│ │ │ Month: April ▼ │              │  │
│ │ └─────────────────┘              │  │
│ │ ┌─────────────────┐              │  │
│ │ │ Year:  2026  ▼ │              │  │
│ │ └─────────────────┘              │  │
│ │                                  │  │
│ │ ⚠ Plan exists for this period   │  │
│ │ [✓ Copy from April 2026]        │  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [◄ Previous Step]  [Next: Choose Template ▶]│
│                                        │
└────────────────────────────────────────┘

LG Layout Rules:
- Centered form box (400-500px)
- Plenty of whitespace
- Larger text
- More padding
```

---

## 4. EVALUATION FORM RESPONSIVE

### XS (320px)
```
┌────────────────────────────────┐
│ ☰ QLHS              [Cancel]  │
├────────────────────────────────┤
│                                │
│ Enter Evaluations              │
│ Võ Lê Yến Nhi - Apr 2026       │
│ ████████░░░░░░░░░░░░░░ (57%)   │
│                                │
│ Lĩnh vực:                      │
│ ┌──────────────────────────┐   │
│ │ Vận động thô        ▼    │   │
│ └──────────────────────────┘   │
│                                │
│ Skill: Ngồi lăn bóng           │
│                                │
│ ┌──────────────────────────┐   │
│ │  [Image - 160px × 160px] │   │
│ │  (fits in 100% - 32px)   │   │
│ └──────────────────────────┘   │
│                                │
│ Status:                        │
│ ◉ Đạt (Achieved)               │
│ ○ Chưa đạt (Not Achieved)     │
│ ○ Có tiến bộ (Partial)        │
│ ○ Chưa đánh giá (Pending)     │
│                                │
│ Notes:                         │
│ [____________________]         │
│ [____________________]         │
│ [____________________]         │
│                                │
│ [+ Evidence Photo]             │
│                                │
├────────────────────────────────┤
│                                │
│ [◄ Prev]  [Save & Next ▶]      │
│                                │
└────────────────────────────────┘

XS Layout:
- Full width image (288px)
- Stacked radios
- Full width inputs
- Single column buttons
```

### SM/MD (375-768px)
```
┌──────────────────────────────────┐
│ ☰ QLHS              [Cancel]    │
├──────────────────────────────────┤
│                                  │
│ Review & Enter Evaluations       │
│ Plan: Võ Lê Yến Nhi - Apr 2026  │
│ ████████░░░░░░░░░░░░░░ (57%)    │
│ Still need: 6 evaluations        │
│                                  │
│ Lĩnh vực:                        │
│ ┌──────────────────────────────┐ │
│ │ Vận động thô            ▼    │ │
│ └──────────────────────────────┘ │
│                                  │
│ Skill: Ngồi lăn bóng            │
│                                  │
│ ┌────────────────────────────┐   │
│ │   [Image - 200px × 200px]  │   │
│ └────────────────────────────┘   │
│                                  │
│ Status:                          │
│ ◉ Đạt (Achieved) ✓              │
│ ○ Chưa đạt (Not Achieved)      │
│ ○ Có tiến bộ (Partial)         │
│ ○ Chưa đánh giá (Pending)      │
│                                  │
│ Notes:                           │
│ [____________________________]   │
│ [____________________________]   │
│                                  │
│ [+ Add evidence photo]           │
│                                  │
├──────────────────────────────────┤
│                                  │
│ [◄ Previous]    [Save & Next ▶]  │
│                                  │
└──────────────────────────────────┘

SM/MD Layout:
- Image larger
- More readable
- Better spacing between elements
```

### LG (1024px+)
```
┌──────────────────────────────────────────────┐
│ QLHS    Dashboard  Children  Plans  Reports  │
├──────────────────────────────────────────────┤
│                                              │
│ Review & Enter Evaluations                   │
│ Plan: Võ Lê Yến Nhi - Tháng 4-5/2026        │
│ Progress: ████████░░░░░░░░░░░░ (57%)         │
│ Still need: 6 more evaluations               │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │ Lĩnh vực: Vận động thô [▼]              │ │
│ │                                          │ │
│ │ ┌────────────────────────────────────┐   │ │
│ │ │                                    │   │ │
│ │ │   Skill: Ngồi lăn bóng             │   │ │
│ │ │                                    │   │ │
│ │ │   ┌──────────────────────────────┐ │   │ │
│ │ │   │  [Image 240px × 240px]       │ │   │ │
│ │ │   └──────────────────────────────┘ │   │ │
│ │ │                                    │   │ │
│ │ │   Status:                          │   │ │
│ │ │   ◉ Đạt (Achieved) ✓              │   │ │
│ │ │   ○ Chưa đạt (Not Achieved)      │   │ │
│ │ │   ○ Có tiến bộ (Partial)         │   │ │
│ │ │   ○ Chưa đánh giá (Pending)      │   │ │
│ │ │                                    │   │ │
│ │ │   Notes:                           │   │ │
│ │ │   [________________________________]│   │ │
│ │ │   [________________________________]│   │ │
│ │ │                                    │   │ │
│ │ │   [+ Add evidence photo]           │   │ │
│ │ │                                    │   │ │
│ │ └────────────────────────────────────┘   │ │
│ │                                          │ │
│ │ [◄ Previous Skill]      [Save & Next ▶]  │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘

LG Layout:
- Centered card layout
- Larger image (240px)
- More whitespace
- Clear separation
```

---

## 5. COMPONENTS RESPONSIVE SPECS

### Button Component

**XS (touch priority)**:
- Min height: 56px (48px + 8px padding top/bottom)
- Min width: 44px (touch target)
- Padding: 16px 24px
- Font: 16px (prevents iOS zoom)
- Full width on mobile

**SM-MD**:
- Height: 48px
- Padding: 12px 24px
- Font: 16px
- Full width or inline (as needed)

**LG**:
- Height: 44px
- Padding: 12px 32px
- Font: 16px
- Inline placement

### Input Field Component

**XS**:
- Height: 56px
- Padding: 12px 16px
- Font: 16px (prevents zoom)
- Full width
- Clear button on right (if search)

**SM+**:
- Height: 48px
- Padding: 12px 16px
- Font: 16px
- Flex as needed

### Select/Dropdown Component

**XS**:
- Height: 56px
- Full width
- Native dropdown on mobile (performance)
- Dropdown menu: Full screen or bottom sheet

**SM+**:
- Height: 48px
- Width: As needed
- Styled custom dropdown if space

---

## 6. SAFE AREAS & NOTCHES

### iOS Safe Areas

```
iPhone X/11 Pro/12/13:
  Top notch:    44px
  Bottom home:  34px

iPhone XR/11/12 mini:
  Top:          48px
  Bottom:       34px

iPhone SE (2nd gen):
  Top:          20px (status bar)
  Bottom:        0px (physical button)
```

### Implementation

```css
/* Viewport meta tag */
<meta name="viewport" content="viewport-fit=cover">

/* CSS safe areas */
body {
  padding-top: max(20px, env(safe-area-inset-top));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

/* Bottom nav with notch */
.bottom-nav {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

/* Sticky elements */
.sticky-header {
  top: env(safe-area-inset-top);
}
```

---

## 7. ORIENTATION CHANGES

### Portrait → Landscape (Mobile)

```
Portrait (375px):
┌────────────────────────────────┐
│ ☰ QLHS        [Cancel]        │
├────────────────────────────────┤
│ Create Plan - Step 1           │
│                                │
│ Child *                        │
│ ┌──────────────────────────┐   │
│ │ [Selection dropdown]     │   │
│ └──────────────────────────┘   │
│                                │
│ Month *                        │
│ ┌──────────────────────────┐   │
│ │ [Selection dropdown]     │   │
│ └──────────────────────────┘   │
│                                │
│ Year *                         │
│ ┌──────────────────────────┐   │
│ │ [Selection dropdown]     │   │
│ └──────────────────────────┘   │
│                                │
│ [Button]  [Button]             │
│                                │
└────────────────────────────────┘

Landscape (667px):
┌──────────────────────────────────────────┐
│ ☰ QLHS                    [Cancel]      │
├──────────────────────────────────────────┤
│ Create Plan - Step 1                     │
│                                          │
│ Child *                 Month *          │
│ ┌──────────────────┐   ┌──────────────┐ │
│ │ [Dropdown]      │   │ [Dropdown]  │ │
│ └──────────────────┘   └──────────────┘ │
│                                          │
│ Year *                                   │
│ ┌──────────────────┐                    │
│ │ [Dropdown]      │                    │
│ └──────────────────┘                    │
│                                          │
│ [Button]         [Button]                │
│                                          │
└──────────────────────────────────────────┘

Orientation Rules:
- On landscape: Use wider layout
- Inputs side-by-side if space
- Avoid full-height elements
- Maintain scrollability
```

---

## 8. PRINT STYLES

```css
@media print {
  /* Hide navigation and UI chrome */
  nav { display: none; }
  .sidebar { display: none; }
  .bottom-nav { display: none; }
  button { display: none; }
  
  /* Optimize for paper */
  body {
    background: white;
    color: black;
    font-size: 12pt;
  }
  
  /* Page breaks */
  .plan-area {
    page-break-inside: avoid;
  }
  
  /* Hide on print */
  .no-print { display: none; }
  
  /* URL visibility */
  a[href]:after {
    content: " (" attr(href) ")";
  }
  
  /* Image sizing */
  img {
    max-width: 100%;
    page-break-inside: avoid;
  }
}
```

---

## 9. TESTING CHECKLIST

```
Mobile Testing (XS/SM):
□ Test on iPhone SE (375px)
□ Test on iPhone 12 (390px)
□ Test on iPhone 13 Pro Max (428px)
□ Test on Samsung Galaxy S21 (360px)
□ Test with actual touch (not mouse)
□ Check button/input hit targets (48px minimum)
□ Verify portrait/landscape orientation
□ Test with pinch zoom disabled
□ Test keyboard on iOS/Android
□ Check safe area insets

Tablet Testing (MD):
□ Test on iPad Air (768px)
□ Test on iPad Pro (1024px)
□ Test portrait/landscape
□ Test split-view if possible
□ Check performance with larger images

Desktop Testing (LG/XL):
□ Test at 1024px (small desktop)
□ Test at 1440px (standard)
□ Test at 1920px (wide)
□ Test at 2560px (4K)
□ Mouse hover states
□ Keyboard navigation
□ Tab order

Accessibility:
□ Keyboard-only navigation
□ Screen reader testing
□ Color contrast (WCAG AA 4.5:1)
□ Focus indicators visible
□ No color-only messaging

Performance:
□ Lighthouse mobile ≥ 80
□ First Contentful Paint < 3s
□ Time to Interactive < 5s
□ Image optimization
□ CSS/JS minification
```

---

**Version**: 1.0  
**Status**: ✅ Complete  
**Ready for**: Frontend development & implementation

