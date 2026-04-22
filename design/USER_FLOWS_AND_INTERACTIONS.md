# 🔄 USER FLOWS & INTERACTIVE SPECIFICATIONS

**Project**: QLHS (Kế Hoạch Giáo Dục Cá Nhân)  
**Version**: 1.0  
**Focus**: Time-saving workflows

---

## MAIN USER FLOW: Create & Evaluate Plan (15-minute workflow)

```
START
  ↓
┌─────────────────────────┐
│ Login                   │ (1 min)
│ Email + Password        │
│ [Đăng Nhập]             │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Dashboard               │
│ See all children        │
│ View latest plans       │
│ Quick stats             │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Select child            │ (1 min)
│ [Võ Lê Yến Nhi ▼]       │
│ Click "[Plan]" button   │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Create Plan Form        │
│ Step 1: Child + Month   │
│ Month: April 2026       │
│ [Copy prev month]       │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Step 2: Template        │ (2 min)
│ Select from 3 templates │
│ "Tháng 4-5/2026 (4-5y)" │
│ Shows 14 skills         │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Step 3: Review          │
│ 14 skills grouped       │
│ by 4 areas              │
│ Toggle optional skills  │
│ [Create Plan]           │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ ✅ PLAN CREATED         │
│ System auto-redirects   │
│ to Evaluation Form      │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Evaluation Form         │
│ Iterate through skills  │ (10 min for 14 skills)
│ Show image              │ (≈ 40 sec per skill)
│ Click status radios     │
│ Add notes (optional)    │
│ [Save & Next]           │
│                         │
│ REPEAT for all 14 skills│
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Plan Complete           │
│ 64% achieved            │
│ [Export PDF] [Submit]   │
│                         │
│ ✅ TOTAL TIME: ~15 min  │
└─────────────────────────┘
  ↓
SUBMIT → PRINCIPAL REVIEW → APPROVED
```

**Time Breakdown**:
- Login: 1 minute
- Select child: 1 minute
- Create plan (3 steps): 2 minutes
- Evaluate 14 skills: 10 minutes
- Export/Submit: 1 minute
- **TOTAL: 15 minutes** (90% reduction from 90 minutes manual process)

---

## FLOW: Quick Plan from Previous Month

```
┌─────────────────────────┐
│ Dashboard               │
│ Click child             │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ [Plan] button           │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Create Plan             │
│ Step 1: Select child    │
│ Month: May 2026         │
│                         │
│ ⚠ Plan exists Apr 2026  │
│ [Copy from Apr 2026]    │ ← SHORTCUT
│                         │
│ Auto-fills April data   │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Step 2: Skip            │ (SKIPPED)
│ (Previous data copied)  │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ Step 3: Review changes  │
│ All April skills loaded │
│ Can remove/adjust       │
└─────────────────────────┘
  ↓
┌─────────────────────────┐
│ ✅ PLAN CREATED         │
│ FROM PREVIOUS (30 sec)  │
└─────────────────────────┘

TIME SAVED: ~5 minutes on plan creation
```

---

## FLOW: Quick Batch Evaluation

```
┌──────────────────────────────┐
│ Plan View                    │
│ Progress: 57% (8/14)         │
│ Still need 6 evaluations     │
│                              │
│ [Quick Fill All]             │ ← BUTTON
└──────────────────────────────┘
  ↓
┌──────────────────────────────┐
│ Batch Evaluation Modal       │
│                              │
│ Skill: Skill 1               │
│ ◉ Achieved ( )               │
│ ○ Not Achieved ( )           │
│ ○ Partial ( )                │
│ ○ Pending ( )                │
│                              │
│ [Previous] [Next - Auto⏩]   │
└──────────────────────────────┘
  ↓
  REPEAT for remaining skills
  ↓
┌──────────────────────────────┐
│ Batch Save                   │
│ [Save All] [Submit for Review]
└──────────────────────────────┘

TIME SAVED: ~2 minutes with auto-progression
```

---

## INFORMATION ARCHITECTURE

### Main Navigation Structure

```
Dashboard
├── Quick Stats (4 cards)
├── My Children (table/cards)
│   ├── View child details
│   ├── Create new plan
│   ├── View past plans
│   └── Track progress
│
Plans
├── All plans
├── Pending review
├── Approved
├── Filter by child
├── Filter by month
└── Export/Archive
│
Children
├── All children
├── Add new child
├── Edit child profile
├── View special needs
└── Assign teacher
│
Progress/Analytics
├── Child progress by month
├── Skill achievement rates
├── Team statistics
├── Export reports
└── Trend analysis
│
Reports (Admin/Principal)
├── Class overview
├── Child benchmarks
├── Teacher assignments
└── Missing plans
│
Settings
├── Profile
├── Account
├── Preferences
├── Notifications
└── Security
```

---

## USER PATHS (Different Roles)

### Teacher Path
```
Login
  ↓
Dashboard (sees 50 assigned children)
  ├─ Create plans (monthly)
  ├─ Evaluate plans (continuous)
  ├─ View progress (track growth)
  ├─ Export PDFs (for parents)
  └─ Submit to principal
```

### Principal Path
```
Login
  ↓
Dashboard (see all teachers' activity)
  ├─ Review submitted plans
  ├─ Approve/reject
  ├─ View class statistics
  ├─ Monitor compliance
  └─ Generate reports
```

### Admin Path
```
Login
  ↓
Dashboard (system wide)
  ├─ Manage users
  ├─ Manage kindergartens
  ├─ Manage templates
  ├─ View all data
  ├─ System settings
  └─ Backup/restore
```

### Parent Path
```
Login
  ↓
Dashboard (see own child)
  ├─ View child progress
  ├─ Download reports
  ├─ View approved plans
  └─ Contact teacher
```

---

## CRITICAL INTERACTION SPECS

### 1. Child Selection Dropdown

**Desktop**:
```
┌─────────────────────────────────────────┐
│ Select Child *                          │
│ ┌─────────────────────────────────────┐ │
│ │ [🔍 Search by name..........] [✕]  │ │
│ ├─────────────────────────────────────┤ │
│ │ Recent:                             │ │
│ │ 👧 Võ Lê Yến Nhi (4.5y) - Apr     │ │
│ │                                     │ │
│ │ All (50 children):                 │ │
│ │ 👧 Võ Lê Yến Nhi (4.5y)            │ │
│ │ 👦 Nguyễn Minh Anh (4.2y)          │ │
│ │ 👧 Trần Bảo An (3.8y)              │ │
│ │ ...                                 │ │
│ │ [Show more ▼]                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Mobile**:
- Tap to expand
- Full screen overlay
- Virtual keyboard
- Recent first
- Swipe to close

---

### 2. Template Preview

**On Selection**:
```
┌─────────────────────────────────────┐
│ Mẫu KH Tháng 4-5/2026 (4-5 tuổi)   │
├─────────────────────────────────────┤
│ 14 skills total                      │
│                                      │
│ Vận động thô (Red)                  │
│ • Ngồi lăn bóng                      │
│ • Nghiêng người sang 2 bên           │
│                                      │
│ Vận động tinh (Teal)                │
│ • Rót nước vào ly                    │
│ • Đóng cọc bàn gỗ                    │
│                                      │
│ Nhận biết ngôn ngữ (Blue)            │
│ • Nhận biết số 6, 7                  │
│ • .... (2 more)                      │
│                                      │
│ Cá nhân & Xã hội (Coral)             │
│ • .... (5 skills)                    │
│                                      │
│ [Edit template] [Use template]       │
└─────────────────────────────────────┘
```

---

### 3. Evaluation Radio Selection

**Single Skill Evaluation**:
```
┌──────────────────────────────────────┐
│ Status Selection                     │
├──────────────────────────────────────┤
│                                      │
│ ◉ Đạt (Achieved) ✓                 │
│    Default selected (last status)    │
│    Radio: Green checkmark            │
│    Shows when achieved               │
│                                      │
│ ○ Chưa đạt (Not Achieved)           │
│    Radio: Red X                      │
│    Shows when not ready              │
│                                      │
│ ○ Có tiến bộ (Partial/Progress)    │
│    Radio: Orange ⚠                  │
│    Shows improvement expected        │
│                                      │
│ ○ Chưa đánh giá (Pending)           │
│    Radio: Gray ⏳                    │
│    For future evaluation             │
│                                      │
└──────────────────────────────────────┘

Selection Behavior:
- Click radio → Selects status
- Hover → Highlights row
- Visual feedback immediate
- Auto-saves after 1 second
```

---

### 4. Notes Text Area

**Dynamic Sizing**:
```
Initial:
┌──────────────────────────────────────┐
│ Notes:                               │
│ [____________________________________]│
│ (40px height, 1 line)                │
└──────────────────────────────────────┘

Typing:
┌──────────────────────────────────────┐
│ Notes:                               │
│ [Trẻ lăn bóng tốt, cần giảm hỗ     ]│
│ [trợ thêm khi được cô hướng dẫn cụ  ]│
│ [thể                                 ]│
│ (120px height, auto-expanding)       │
│                                      │
│ [Character count: 78/500]            │
└──────────────────────────────────────┘

Behavior:
- Starts small (40px)
- Expands as user types
- Max height: 200px (scrollable)
- Character count shown at bottom
- Auto-save on blur
```

---

### 5. Status Badge Styling

**In List Views**:
```
Achievement Status:
┌────────────────┐
│ ✓ Achieved     │ - Green (#4CAF50), 6px × 12px padding
└────────────────┘

┌────────────────┐
│ ❌ Not Achieved│ - Red (#F44336)
└────────────────┘

┌────────────────┐
│ ⚠ Partial      │ - Orange (#FFC107)
└────────────────┘

┌────────────────┐
│ ⏳ Pending      │ - Gray (#9E9E9E)
└────────────────┘

Plan Status:
┌────────────────┐
│ 📝 Draft       │ - Light blue
└────────────────┘

┌────────────────┐
│ ✎ In Review    │ - Yellow
└────────────────┘

┌────────────────┐
│ ✓ Approved     │ - Green
└────────────────┘

┌────────────────┐
│ 📬 Submitted   │ - Blue
└────────────────┘
```

---

### 6. Progress Bar Specifications

**Achievement Progress**:
```
Overall:
Achievement: 64.3%
████████░░░░░░░░░░░░░░░░░░ (64.3%)

By Area - Stacked:
All 4 areas shown in 1 bar (colored by area):
⬛⬛⬛⬛⬛⬛⬛⬛░░░░░░░░░░
Red    Teal    Blue    Coral    Empty

Percentage Labels:
- Large: 64.3% (main)
- Small: 9/14 skills (secondary)
- Hover shows breakdown:
  Red: 50% (1/2)
  Teal: 75% (3/4)
  Blue: 60% (3/5)
  Coral: 70% (7/10)
```

---

### 7. Loading & Skeleton States

**Skeleton Loaders**:
```
Plan List Loading:
┌─────────────────────────────────┐
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮  (animated) │
│ ▮▮▮▮▮▮▮▮▮  ▮▮▮▮▮▮▮▮▮▮▮ (animated) │
├─────────────────────────────────┤
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮  (animated) │
│ ▮▮▮▮▮▮▮▮▮  ▮▮▮▮▮▮▮▮▮▮▮ (animated) │
├─────────────────────────────────┤
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮  (animated) │
│ ▮▮▮▮▮▮▮▮▮  ▮▮▮▮▮▮▮▮▮▮▮ (animated) │
└─────────────────────────────────┘

Pulse animation: 0.5s fade in/out loop
Gray color (#E0E0E0)
Height matches real content
```

---

### 8. Toast Notifications

**Success**:
```
┌──────────────────────────────────┐
│ ✓ Plan created successfully!     │
│                                  │
│ [Redirect in 3s] [Dismiss]       │
└──────────────────────────────────┘

Position: Bottom-right
Color: Green (#4CAF50)
Duration: 5 seconds auto-dismiss
```

**Error**:
```
┌──────────────────────────────────┐
│ ❌ Failed to create plan         │
│                                  │
│ Error: Template not found        │
│ [Retry] [Cancel] [Dismiss]       │
└──────────────────────────────────┘

Position: Bottom-right
Color: Red (#F44336)
Duration: Persistent (manual dismiss)
```

**Info**:
```
┌──────────────────────────────────┐
│ ⓘ Plan saved as draft            │
│ [View] [Continue editing]        │
└──────────────────────────────────┘

Position: Bottom-right
Color: Blue (#2196F3)
Duration: 3 seconds auto-dismiss
```

---

### 9. Keyboard Navigation

**Tab Order** (Create Plan Form):
1. Child dropdown (autofocus)
2. Month select
3. Year select
4. Copy from previous checkbox
5. Next button
6. Cancel button

**Enter Key**:
- On Next button → Submit step
- On child dropdown → Open dropdown

**Esc Key**:
- Close dropdowns
- Close modals
- Go back (confirm if unsaved)

**Arrow Keys**:
- In dropdown → Navigate options
- In radio buttons → Select next/previous

---

### 10. Accessibility Features

**Screen Reader**:
```
<label for="select-child">Select Child *</label>
<select id="select-child" aria-describedby="child-help">
  <option>Võ Lê Yến Nhi (4.5 years)</option>
</select>
<span id="child-help">Choose from your assigned children</span>

Announces: "Select Child, required, combobox, Choose from your assigned children"
```

**Color Contrast** (WCAG AA):
```
Text on background: 4.5:1 minimum
- Achieved (green #4CAF50) on white: 5.2:1 ✓
- Pending (gray #9E9E9E) on white: 4.8:1 ✓
- Partial (orange #FFC107) on white: 4.9:1 ✓
```

**Focus Indicators**:
```
All interactive elements show clear focus:

Button focus:
┌────────────────────┐
│ [  Create Plan   ] │ → 2px blue outline
└────────────────────┘

Input focus:
┌────────────────────┐
│ [                ] │ → 2px blue border
└────────────────────┘
```

---

## ANIMATION SPECIFICATIONS

### Transitions

**Default**: 200ms ease-in-out

- Button hover: 200ms background change
- Input focus: 200ms border/shadow change
- Progress bar update: 600ms smooth increment
- Page transition: 300ms fade (opacity 0→1)
- Modal appear: 300ms scale (95%→100%)

### Loading States

**Spinner Animation**:
```
Rotation: 360° every 1.2s
Color: Brand blue #2E7D32
Size: 24px (inline), 48px (page-level)
```

**Skeleton Pulse**:
```
Opacity: 0.6 → 1.0 → 0.6 every 1.5s
Gray color: #E0E0E0
No movement, just fade pulse
```

### Page Transitions

**Fade**: 
- Opacity: 0 → 1 over 300ms
- Used for most page changes

**Slide** (Mobile):
- Slide in from right: translateX 100% → 0
- 300ms duration
- Used for modal/overlay pages

---

## DARK MODE SPECIFICATIONS

**Dark Mode Colors**:

```
Background:
  Primary: #1A1A1A
  Secondary: #262626
  Tertiary: #323232

Text:
  Primary: #FFFFFF (white)
  Secondary: #BDBDBD (gray)
  Disabled: #757575

Interactive:
  Primary button: Same green #2E7D32 (adjusted brightness)
  Primary text on button: #FFFFFF
  Links: #64B5F6 (light blue)
  Hover: Opacity decrease (not color)

Status Colors (same):
  Success: #81C784 (lighter)
  Error: #E57373 (lighter)
  Warning: #FFB74D (lighter)
  Info: #64B5F6 (lighter)
```

**Dark Mode Toggle**:
```
Location: Settings or user menu
Preference: Store in localStorage
System preference: Detect from OS (default)
Switch animation: 300ms fade
```

---

**Version**: 1.0  
**Ready for**: Frontend development  
**Implementation**: React components with these interaction specs

