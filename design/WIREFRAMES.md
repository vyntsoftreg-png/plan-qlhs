# 📐 UI/UX WIREFRAMES

**Project**: QLHS (Kế Hoạch Giáo Dục Cá Nhân)  
**Version**: 1.0  
**Created**: 2026-04-13

---

## SCREEN LIST

1. ✅ Login Screen
2. ✅ Dashboard (Children List)
3. ✅ Create Plan Form
4. ✅ Plan Detail View
5. ✅ Evaluation Form
6. ✅ Progress/Analytics
7. ✅ PDF Preview
8. ✅ Mobile Navigation

---

## 1. LOGIN SCREEN

### Desktop Version

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                  ┌────────────────────┐                   │
│                  │                    │                   │
│                  │      QLHS LOGO     │                   │
│                  │                    │                   │
│                  └────────────────────┘                   │
│                                                            │
│              Kế Hoạch Giáo Dục Cá Nhân                   │
│                                                            │
│                  ┌────────────────────┐                   │
│                  │                    │                   │
│                  │ Email              │                   │
│                  │ [________________] │                   │
│                  │                    │                   │
│                  │ Password           │                   │
│                  │ [________________] │                   │
│                  │                    │                   │
│                  │  ☐ Remember me     │                   │
│                  │                    │                   │
│                  │ [    Đăng Nhập    ]│                   │
│                  │                    │                   │
│                  │ Forgot password?   │                   │
│                  │                    │                   │
│                  └────────────────────┘                   │
│                                                            │
│                   © QLHS 2026                             │
│                                                            │
└──────────────────────────────────────────────────────────┘

Key Elements:
- Logo centered, 120px × 120px
- Title: "Kế Hoạch Giáo Dục Cá Nhân" (24px, centered)
- Form width: 320px, centered on page
- Email input: Full width, 48px height
- Password input: Full width, 48px height
- Remember me checkbox (optional)
- Login button: Full width, 48px height, primary color
- "Forgot password?" link, secondary color
```

### Mobile Version

```
┌────────────────────────────┐
│ QLHS                       │
├────────────────────────────┤
│                            │
│    ┌──────────────────┐   │
│    │                  │   │
│    │   LOGO (80px)    │   │
│    │                  │   │
│    └──────────────────┘   │
│                            │
│    Kế Hoạch Giáo Dục      │
│                            │
│    ┌──────────────────┐   │
│    │ Email            │   │
│    │ [______________] │   │
│    │                  │   │
│    │ Password         │   │
│    │ [______________] │   │
│    │                  │   │
│    │ ☐ Remember me   │   │
│    │                  │   │
│    │ [  Đăng Nhập   ]│   │
│    │                  │   │
│    │ Forgot password? │   │
│    └──────────────────┘   │
│                            │
│       © QLHS 2026          │
│                            │
└────────────────────────────┘

Differences from Desktop:
- Full width (100% - 32px padding)
- Larger touch targets (56px min)
- Password visibility toggle
- No remember me optional (auto on mobile)
```

---

## 2. DASHBOARD - CHILDREN LIST

### Desktop Version

```
┌──────────────────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Reports  │ User ▼  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Dashboard - Welcome, Võ Thị Thanh Thúy                          │
│  Trường Mầm Non Quốc Tế ABC | 2 Children | 3 Plans              │
│                                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Quick Stats (4 Cards, 1 row):                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────┐│
│  │ 🧒👧👦       │  │ 📋           │  │ ✓            │  │%      ││
│  │ 50 Children  │  │ 8 Plans      │  │ 3 Approved   │  │92%    ││
│  │ Active       │  │ This Month   │  │              │  │Avg    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────┘│
│                                                                    │
├────────────────────────────────────────────────────────────────┤
│  My Children                                                      │
│  [Search by name.....................] [+ Add New Child]        │
│                                                                    │
│  Filter: [All ▼] [Teacher: All ▼]    Sort: [Name ▼]            │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Name              │ Age  │ Teacher        │ Latest Plan  └┘│  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 👧 Võ Lê Yến Nhi │ 4.5  │ Võ Thị Thanh   │ Apr 2026 ✓   │  │
│  │                                  Thúy      │              │  │
│  │ Action: [View] [✎Edit] [Plan]                            │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 👦 Nguyễn Minh   │ 4.2  │ Nguyễn Thị     │ Apr 2026 ✓   │  │
│  │    Anh            │      │ Minh            │              │  │
│  │ Action: [View] [✎Edit] [Plan]                            │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 👶 Trần Bảo An   │ 3.8  │ Trần Thị Thu   │ Mar 2026 ✓   │  │
│  │                                  Hương     │              │  │
│  │ Action: [View] [✎Edit] [Plan]                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Pagination: ◄ 1 2 3 4 ... ►  Showing 1-3 of 50                │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

Column Layout:
- Name (with avatar)
- Age (calculated from DOB)
- Teacher name (linked to teacher)
- Latest plan (month/year + status icon)
- Actions (View, Edit, Create Plan dropdown)

Responsive Behavior:
- Desktop: All 5 columns visible
- Tablet: Hide "Age", keep others
- Mobile: Name only, expand on tap
```

### Mobile Version

```
┌──────────────────────────────┐
│ ☰ QLHS            User ▼    │
├──────────────────────────────┤
│                              │
│ Dashboard                    │
│ Welcome, Võ Thị Thanh Thúy   │
│                              │
│ Stats (single column):       │
│ ┌────────────────────────┐  │
│ │ 🧒 50 Children         │  │
│ └────────────────────────┘  │
│ ┌────────────────────────┐  │
│ │ 📋 8 Plans This Month  │  │
│ └────────────────────────┘  │
│ ┌────────────────────────┐  │
│ │ ✓ 3 Approved           │  │
│ └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│                              │
│ My Children                  │
│ [Search......................] │
│ [+ Add New Child          ]  │
│                              │
│ ┌────────────────────────┐  │
│ │ 👧 Võ Lê Yến Nhi      │  │
│ │ 4.5 years              │  │
│ │ Võ Thị Thanh Thúy      │  │
│ │ Apr 2026 ✓             │  │
│ │                        │  │
│ │ [View] [Edit] [Plan]   │  │
│ └────────────────────────┘  │
│                              │
│ ┌────────────────────────┐  │
│ │ 👦 Nguyễn Minh Anh    │  │
│ │ 4.2 years              │  │
│ │ Nguyễn Thị Minh        │  │
│ │ Apr 2026 ✓             │  │
│ │                        │  │
│ │ [View] [Edit] [Plan]   │  │
│ └────────────────────────┘  │
│                              │
│ ┌────────────────────────┐  │
│ │ Load More...           │  │
│ └────────────────────────┘  │
│                              │
└──────────────────────────────┘

Mobile Features:
- Cards instead of table
- Hamburger menu (top-left)
- User menu (top-right)
- Full-width stat cards
- Tap to expand more details
- Sticky bottom action buttons
```

---

## 3. CREATE PLAN FORM (Core Feature)

### Step 1: Select Child & Month

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans | Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Create New Education Plan                            │
│  Step 1 of 3                                          │
│  ████░░░░░░░░░░░░░░░░░░░░ (33%)                     │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  Select Child & Time Period                          │
│                                                        │
│  Select Child *                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 👧 Võ Lê Yến Nhi (4.5 years)            ▼      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  Time Period                                          │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │ Month: [4▼] │  │ Year: [2026▼]                 │
│  └─────────────┘  └─────────────┘                  │
│                                                        │
│  Note: Plan already exists for this period?          │
│        ⚠ Yes, copy from it [Suggest]               │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  [Previous Step ☐]              [Next: Choose Template ▶]    │
│                                                        │
└──────────────────────────────────────────────────────┘

Key Features:
- Child dropdown with search
- Month selector (1-12)
- Year selector
- Conflict detection (plan exists)
- Copy from previous month shortcut
```

### Step 2: Choose Template

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Create New Education Plan                            │
│  Step 2 of 3                                          │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░ (67%)             │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  Choose Template                                      │
│  [Search template .................] [Create Custom] │
│                                                        │
│  Filter: [Age Group ▼] [Month ▼]                    │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ ◉ Mẫu KH Tháng 4-5/2026 (4-5 tuổi)             │  │
│  │ 14 skills, Standard template                    │  │
│  │                                                  │  │
│  │ Skills Preview:                                 │  │
│  │ • Vận động thô: 2 skills                        │  │
│  │ • Vận động tinh: 2 skills                       │  │
│  │ • Nhận biết ngôn ngữ: 5 skills                  │  │
│  │ • Cá nhân & Xã hội: 5 skills                    │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ ○ Mẫu KH Tháng 3/2026 (4-5 tuổi)               │  │
│  │ 14 skills                                       │  │
│  │ [View details ▼]                               │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ ○ Mẫu KH Tháng 4-5/2026 (3-4 tuổi)             │  │
│  │ 12 skills                                       │  │
│  │ [View details ▼]                               │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  [◄ Back]                [Create from Template ▶]    │
│                                                        │
└──────────────────────────────────────────────────────┘

Template Features:
- Preset 14-20 skills
- Filter by age group
- Preview skills before selection
- Option to customize (step 3)
```

### Step 3: Review & Create

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Create New Education Plan                            │
│  Step 3 of 3                                          │
│  ██████████████████████████████░░░░░░░░░ (100%)      │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  Review & Customize                                   │
│                                                        │
│  Child: Võ Lê Yến Nhi | Period: Apr-May 2026        │
│  Template: Mẫu KH Tháng 4-5/2026 (4-5 tuổi)         │
│  Skills Count: 14                                    │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  By Development Area:                                │
│                                                        │
│  ┌─ Vận động thô (Red) ────────────────────────────┐ │
│  │ ✓ Ngồi lăn bóng                                 │ │
│  │   [View instruction ▼]                          │ │
│  │ ✓ Nghiêng người sang 2 bên                     │ │
│  │   [View instruction ▼]                          │ │
│  │ [+ Add more skill in this area]                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Vận động tinh (Teal) ──────────────────────────┐ │
│  │ ✓ Rót nước vào ly                               │ │
│  │ ☐ [Optional] Đóng cọc bàn gỗ                   │ │
│  │   (uncheck to exclude)                          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Nhận biết ngôn ngữ & TƯ duy (Blue) ────────────┐ │
│  │ ✓ Nhận biết số 6,7                              │ │
│  │ ✓ Nói được số 1,2,3,4,5                         │ │
│  │ ✓ Nhận biết to-nhỏ                              │ │
│  │ ✓ Nhận biết hình ngôi sao                       │ │
│  │ ✓ Nhận biết màu cam                             │ │
│  └─────────────────────────────────────────────────┘ │
│                                                        │
│  ☐ Include special notes section                     │
│  ☐ Print-optimized layout                           │
│  ☐ Send to principal for instant review             │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│  [◄ Back to Template]      [Create Plan & Start Eval]│
│                                                        │
└──────────────────────────────────────────────────────┘

Final Review Options:
- Customize skills per area
- Optional checkboxes to exclude skills
- Special options (notes, print, send)
- Create & go straight to evaluation
```

---

## 4. PLAN DETAIL VIEW

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│ KH: Võ Lê Yến Nhi - Tháng 4-5/2026                   │
│ Status: [Draft ▼]    Teacher: Võ Thị Thanh Thúy      │
│                                                        │
│ Progress: ████████░░░░░░░░░░░░░░░░░░░░░░░ (57%)     │
│ 8/14 skills achieved                                  │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ [Vận động thô] [Vận động tinh] [Ngôn ngữ] [Cá nhân] │
│  (4 tabs to switch areas)                           │
│                                                        │
├─ Vận động thô ──────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 1. Ngồi lăn bóng về phía trước                   │ │
│  │                                                   │ │
│  │ [Image Thumbnail] ┌──────────────────────────┐  │ │
│  │  (80px)          │ Status: ✓ Achieved       │  │ │
│  │                  │ Evaluated: 2026-04-15    │  │ │
│  │                  └──────────────────────────┘  │ │
│  │                                                   │ │
│  │ Instruction: Cô chuẩn bị 1 quả bóng...         │ │
│  │ [View full instruction ▼]                      │ │
│  │                                                   │ │
│  │ Notes: Trẻ lăn bóng tốt, cần giảm hỗ trợ thêm │ │
│  │                                                   │ │
│  │ [View images ▼] [Edit evaluation] [View detail] │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 2. Nghiêng người sang 2 bên                      │ │
│  │                                                   │ │
│  │ Status: ⚠ Partial (Có tiến bộ)                 │ │
│  │ Evaluated: 2026-04-15                            │ │
│  │                                                   │ │
│  │ Notes: Trẻ còn cần hỗ trợ khi nghiêng sang trái │ │
│  │                                                   │ │
│  │ [View images ▼] [Edit evaluation] [View detail] │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ [◄ Back] [Save] [Submit for Approval] [Export PDF]    │
│                                                        │
└──────────────────────────────────────────────────────┘

Key Features:
- 4 area tabs
- Tabbed navigation by development area
- Skill cards with status
- Image previews
- Edit evaluations inline
- Bulk actions (Save, Submit, Export)
```

---

## 5. EVALUATION FORM (Quick Entry)

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Review & Enter Evaluations                            │
│ Plan: Võ Lê Yến Nhi - Tháng 4-5/2026                │
│                                                        │
│ Progress: ████████░░░░░░░░░░░░░░░░░░░░░░░ (57%)     │
│ Still need: 6 more evaluations                        │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ Lĩnh vực: [Vận động thô ▼]                          │
│                                                        │
│ ┌────────────────────────────────────────────────┐  │
│ │ Skill: Ngồi lăn bóng về phía trước             │  │
│ │ ┌────────────────────────────────────────────┐ │  │
│ │ │ [Skill image - 120px × 120px]              │ │  │
│ │ └────────────────────────────────────────────┘ │  │
│ │                                                  │  │
│ │ Status:                                         │  │
│ │ ◉ Đạt (Achieved)                             │  │
│ │ ○ Chưa đạt (Not Achieved)                    │  │
│ │ ○ Có tiến bộ (Partial)                       │  │
│ │ ○ Chưa đánh giá (Pending)                    │  │
│ │                                                  │  │
│ │ Notes:                                          │  │
│ │ [_________________________________________]  │  │
│ │ [+ Add evidence photo]                       │  │
│ │                                                  │  │
│ │ [Previous Skill]          [Save & Next Skill ▶] │  │
│ └────────────────────────────────────────────────┘  │
│                                                        │
│ Batch Actions (for multiple):                        │
│ ☐ Mark all as achieved in this area                │
│ ☐ Auto-save evaluations                             │
│                                                        │
│ [Save Progress] [Submit Plan for Approval]            │
│                                                        │
└──────────────────────────────────────────────────────┘

Evaluation Features:
- One skill per view
- Previous/Next navigation
- Large image for reference
- 4 status options as radio buttons
- Notes text area
- Photo evidence upload (optional)
- Auto-save on submit
- Batch completion options
```

---

## 6. PROGRESS ANALYTICS VIEW

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Child Progress: Võ Lê Yến Nhi                         │
│ Select Month: [Apr 2026 ▼]                           │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ Overall Achievement: 64.3%                            │
│ ████████░░░░░░░░░░░░░░░░░░░░ (64.3%)               │
│                                                        │
│ By Development Area:                                  │
│                                                        │
│ ┌─ Vận động thô (Red) ────────────────────────────┐ │
│ │ 50% (1/2 achieved)                              │ │
│ │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░ (50%)         │ │
│ │                                                  │ │
│ │ ✓ Ngồi lăn bóng (Achieved)                      │ │
│ │ ⚠ Nghiêng người (Partial)                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Vận động tinh (Teal) ──────────────────────────┐ │
│ │ 75% (3/4 achieved)                              │ │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░░░ (75%)         │ │
│ │                                                  │ │
│ │ ✓ Rót nước                                      │ │
│ │ ✓ Đóng cọc bàn gỗ                              │ │
│ │ ⏳ Tập viết (Pending)                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Nhận biết ngôn ngữ (Blue) ────────────────────┐ │
│ │ 60% (3/5 achieved)                              │ │
│ │ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░ (60%)        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                        │
│ ┌─ Cá nhân & Xã hội (Coral) ─────────────────────┐ │
│ │ 70% (7/10 achieved)                             │ │
│ │ ███████░░░░░░░░░░░░░░░░░░░░░░░░░░ (70%)        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                        │
├──────────────────────────┬──────────────────────────┤
│                                                        │
│ Comparison with Previous Month:                      │
│                                                        │
│ Mar 2026: 58% (8/14)  →  Apr 2026: 64% (9/14)       │
│ Improvement: +6.3% ✓ (1 more skill achieved)        │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ [Compare Months ▼] [View Chart] [Export Report PDF]  │
│                                                        │
└──────────────────────────────────────────────────────┘

Analytics Features:
- Month selector
- Overall achievement percentage
- Per-area breakdown with progress bars
- Status icons (✓/⚠/❌/⏳)
- Comparison with previous month
- Charts & exports available
```

---

## 7. PDF PREVIEW & EXPORT

```
┌──────────────────────────────────────────────────────┐
│ QLHS Logo     Dashboard │ Children │ Plans │ Logout   │
├──────────────────────────────────────────────────────┤
│                                                        │
│ Plan Export: Võ Lê Yến Nhi - Tháng 4-5/2026         │
│                                                        │
│ [PDF Preview ▼] [Excel] [Print]                      │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│                 PDF PREVIEW:                          │
│                                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │      KẾ HOẠCH GIÁO DỤC CÁ NHÂN              │   │
│  │                                              │   │
│  │  Trẻ: Võ Lê Yến Nhi                         │   │
│  │  Ngày Sinh: 16/10/2021 (4 tuổi)             │   │
│  │  Thời kỳ: Tháng 4-5/2026                    │   │
│  │  Giáo viên: Võ Thị Thanh Thúy               │   │
│  │  Trường: Trường Mầm Non Quốc Tế ABC         │   │
│  │                                              │   │
│  ├──────────────────────────────────────────────┤   │
│  │  I. VẬN ĐỘNG THÔ                            │   │
│  │                                              │   │
│  │  1. Ngồi lăn bóng                           │   │
│  │  [Image: 80px]                              │   │
│  │                                              │   │
│  │  - Mục tiêu: Kỹ năng chuyển động            │   │
│  │  - Hướng dẫn: Cô chuẩn bị...                │   │
│  │  - Kết quả: ✓ ĐẠT                           │   │
│  │  - Nhận xét: Trẻ lăn bóng tốt...            │   │
│  │                                              │   │
│  │  2. Nghiêng người sang 2 bên                │   │
│  │  [Image: 80px]                              │   │
│  │  - Kết quả: ⚠ CÓ TIẾN BỘ                  │   │
│  │                                              │   │
│  │  ... (continues for all areas)              │   │
│  │                                              │   │
│  │  TỔNG KẾT:                                  │   │
│  │  - Tổng kỹ năng: 14                         │   │
│  │  - Đạt: 9                                   │   │
│  │  - Chưa đạt: 3                              │   │
│  │  - Có tiến bộ: 2                            │   │
│  │  - Tỷ lệ hoàn thành: 64%                    │   │
│  │                                              │   │
│  │  Ý kiến của giáo viên:                       │   │
│  │  Trẻ có sự tiến bộ tốt về kỹ năng vận động │   │
│  │                                              │   │
│  │  Phê duyệt:                                  │   │
│  │  (....... ngày ...... tháng 2026)           │   │
│  │                                              │   │
│  │  Hiệu trưởng: _________________             │   │
│  │  Giáo viên: _________________                │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                        │
├────────────────────────────────────────────────────┤
│                                                        │
│ Options:                                              │
│ ☐ Include images in PDF                             │
│ ☐ Include teacher notes                             │
│ ☐ Include signature pages                           │
│                                                        │
│ [⬇ Download PDF]  [Print] [Email to Principal]      │
│                                                        │
└──────────────────────────────────────────────────────┘

Export Features:
- PDF preview with professional layout
- Printable format with borders
- Include all 4 areas
- Summary section
- Signature section
- Options for customization
- Direct download/email
```

---

## 8. MOBILE NAVIGATION

### Bottom Navigation Bar

```
┌──────────────────────────────┐
│ Dashboard   Children   Plans  │
│  [🏠]       [👥]       [📋]    │
│ Active ✓    -          -     │
└──────────────────────────────┘

OR

Side Drawer / Hamburger

┌──────────────────────────────┐
│ ☰        QLHS        User▼   │
├──────────────────────────────┤
│                              │
│ 🏠 Dashboard                │
│ 👥 Children                 │
│ 📋 Plans                    │
│ 📊 Progress                 │
│ ⚙️  Settings                 │
│                              │
├──────────────────────────────┤
│ 🚪 Logout                    │
│                              │
└──────────────────────────────┘
```

---

## 9. RESPONSIVE BEHAVIOR

### Desktop (> 1024px)
- Sidebar navigation (260px)
- Main content area (full width - sidebar)
- 2-3 column layouts
- Tables with full information
- Hover states on interactive elements

### Tablet (768px - 1024px)
- Top navigation bar
- Full-width content
- Single column (mostly)
- Cards instead of tables
- Touch-friendly buttons (48px+)

### Mobile (< 768px)
- Hamburger menu
- Full-width content
- Single column always
- Bottom navigation (optional)
- 56px min button height
- Vertically stacked cards

---

## 10. KEY INTERACTION PATTERNS

### Form Submission
```
1. User fills form
2. Click submit button
3. Button shows loading state (spinner + "Loading...")
4. API request in progress
5. Success: Toast notification "Plan created!"
        + Redirect to plan view
6. Error: Error toast "Failed to create plan"
        + Show error details
        + Keep form data
```

### Loading States
```
Initial Load:
  → Skeleton loaders (gray bars)
  → No text until ready
  → Smooth fade-in

Refresh:
  → Spinner in corner
  → Don't clear existing data
  → Update smoothly
```

### Confirmation Dialogs
```
Destructive action (delete):
  → Modal with large red warning
  → "Are you sure?" message
  → Cancel/Confirm buttons
  → Default: Cancel

Example:
┌──────────────────────────┐
│ Delete Plan?             │
├──────────────────────────┤
│ This action cannot be    │
│ undone.                  │
│                          │
│ Võ Lê Yến Nhi - Apr 2026│
│                          │
│ [Cancel]  [Delete]       │
└──────────────────────────┘
```

---

**Next**: Create user flow diagrams and interaction specifications

---

## FILE LOCATIONS

All wireframes designed for:
- Desktop (1440px width)
- Tablet (768px width)
- Mobile (375px width)

View in Figma, Adobe XD, or similar design tools for interactive prototypes.

---

**Design Version**: 1.0  
**Status**: ✅ Complete  
**Ready for**: High-fidelity mockups & development handoff
