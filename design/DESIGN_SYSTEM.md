# 🎨 UI/UX DESIGN SYSTEM

**Project**: QLHS (Kế Hoạch Giáo Dục Cá Nhân)  
**Design Version**: 1.0  
**Last Updated**: 2026-04-13

---

## 1. DESIGN PRINCIPLES

### Core Values
1. **Simplicity** - Minimize steps to create a plan (2-minute target)
2. **Clarity** - Clear instructions for giáo viên
3. **Consistency** - Uniform UI across all screens
4. **Accessibility** - WCAG 2.1 AA compliant
5. **Responsiveness** - Works on desktop, tablet, mobile
6. **Trust** - Professional appearance for schools

---

## 2. COLOR PALETTE

### Primary Colors

```
Brand Blue:        #2E7D32  (Primary action, trustworthy)
  RGB: (46, 125, 50)
  - Use for: Buttons, links, headers
  - Emotion: Trust, growth, education

Success Green:     #4CAF50  (Achieved, positive)
  RGB: (76, 175, 80)
  - Use for: Success messages, achieved status
  
Warning Yellow:    #FFC107  (Partial, needs attention)
  RGB: (255, 193, 7)
  - Use for: Partial completion, warnings

Error Red:         #F44336  (Not achieved, danger)
  RGB: (244, 67, 52)
  - Use for: Errors, not achieved status

Info Blue:         #2196F3  (Information)
  RGB: (33, 150, 243)
  - Use for: Info boxes, help texts
```

### Development Areas Colors (Mapped to 4 Lĩnh Vực)

```
Vận động thô:                #FF6B6B (Red - action)
Vận động tinh:               #4ECDC4 (Teal - precision)
Nhận biết ngôn ngữ & TƯ duy: #45B7D1 (Blue - cognitive)
Cá nhân & Xã hội:            #FFA07A (Coral - social)
```

### Neutral Colors

```
Text Dark:         #1F1F1F  (Primary text)
Text Medium:       #666666  (Secondary text)
Text Light:        #999999  (Placeholder, disabled)
Background White:  #FFFFFF  (Primary background)
Background Light:  #F5F5F5  (Secondary background)
Border Gray:       #E0E0E0  (Borders, dividers)
```

### Status Indicators

```
✅ Achieved:       #4CAF50 (Green)
⚠️ Partial:        #FFC107 (Yellow)
❌ Not Achieved:   #F44336 (Red)
⏳ Pending:        #2196F3 (Blue/Gray blend)
📝 Draft:          #9E9E9E (Gray)
✓ Submitted:       #FF9800 (Orange)
✓ Approved:        #4CAF50 (Green)
```

---

## 3. TYPOGRAPHY

### Font Family

```
Headings & UI Controls:
  Font: "Inter" or "Segoe UI" (system fallback)
  Weight: 600 (semi-bold)
  
Body Text:
  Font: "Inter" or "Segoe UI" (system fallback)
  Weight: 400 (regular)
  
Code & Monospace:
  Font: "Monaco" or "Courier New"
  Weight: 400
```

### Font Sizes & Line Heights

```
Display (h1):       2.5rem (40px)  | weight: 700 | line-height: 1.2
Heading 1 (h2):     2rem (32px)    | weight: 600 | line-height: 1.3
Heading 2 (h3):     1.5rem (24px)  | weight: 600 | line-height: 1.4
Heading 3 (h4):     1.25rem (20px) | weight: 600 | line-height: 1.4
Subtitle:           1rem (16px)    | weight: 500 | line-height: 1.6
Body Large:         1rem (16px)    | weight: 400 | line-height: 1.6
Body Regular:       0.9375rem (15px) | weight: 400 | line-height: 1.6
Body Small:         0.875rem (14px)  | weight: 400 | line-height: 1.5
Caption:            0.75rem (12px)   | weight: 400 | line-height: 1.4
```

### Text Colors

```
Primary Text:       #1F1F1F (Used for headings, main content)
Secondary Text:     #666666 (Used for labels, help text)
Tertiary Text:      #999999 (Used for disabled, placeholders)
Link Color:         #2E7D32 (Primary blue, underlined on hover)
Link Visited:       #8B5CF6 (Purple)
```

---

## 4. SPACING SYSTEM (8px Grid)

### Spacing Scale

```
0:    0px
1:    4px
2:    8px      ← Base unit
3:   12px
4:   16px      ← Common padding
5:   20px
6:   24px      ← Section spacing
7:   28px
8:   32px      ← Large spacing
9:   36px
10:  40px
12:  48px
16:  64px      ← XL spacing
20:  80px
24:  96px
```

### Common Combinations

```
Buttons:         padding: 12px 16px (4-2)
Cards:           padding: 24px (6)
Sections:        margin: 32px 0 (8)
Input fields:    padding: 12px (4)
Default margin:  16px (2)
```

---

## 5. COMPONENT LIBRARY

### Buttons

#### Primary Button (Main actions)
```
Background:     #2E7D32
Text Color:     #FFFFFF
Padding:        12px 24px
Border Radius:  4px
Font Weight:    600
Font Size:      16px
Min Width:      120px
Cursor:         pointer

States:
  Normal:       bg: #2E7D32
  Hover:        bg: #1B5E20, shadow: 0 4px 12px rgba(0,0,0,0.15)
  Active:       bg: #1B5E20, transform: scale(0.98)
  Disabled:     bg: #CCCCCC, cursor: not-allowed, opacity: 0.6
  Loading:      show spinner, disable interaction
```

#### Secondary Button
```
Background:     #F5F5F5 (or transparent)
Text Color:     #2E7D32
Border:         1px solid #2E7D32
Padding:        12px 24px
Border Radius:  4px
Font Weight:    600

States:
  Hover:        bg: #F0F0F0 or bg: #2E7D32, text: #FFFFFF
  Active:       opacity: 0.8
```

#### Danger Button (Delete)
```
Background:     #F44336
Text Color:     #FFFFFF
Padding:        12px 24px
Border Radius:  4px
Font Weight:    600

States:
  Hover:        bg: #D32F2F, box-shadow: 0 4px 12px rgba(244,67,52,0.25)
  Active:       bg: #B71C1C
```

### Input Fields

```
Background:      #FFFFFF
Border:          1px solid #E0E0E0
Border Radius:   4px
Padding:         12px 16px
Font Size:       16px
Font Family:     Inter, Segoe UI

States:
  Focus:         border: 2px solid #2E7D32, shadow: 0 0 0 3px rgba(46,125,50,0.1)
  Error:         border: 2px solid #F44336
  Disabled:      bg: #F5F5F5, opacity: 0.6, cursor: not-allowed
  Placeholder:   color: #999999
  Label:         font-weight: 600, font-size: 14px, margin-bottom: 8px
```

### Cards

```
Background:      #FFFFFF
Border:          1px solid #E0E0E0
Border Radius:   8px
Padding:         24px
Shadow:          0 2px 8px rgba(0,0,0,0.08)

Hover State:
  Shadow:        0 4px 16px rgba(0,0,0,0.12)
  Transform:     translateY(-2px) [optional, for clickable cards]

Variants:
  Elevated:      background prominent white, shadow more pronounced
  Outlined:      no shadow, thicker border
  Filled:        background: #F5F5F5
```

### Badges/Status Tags

```
Achieved:        bg: #4CAF50, text: #FFFFFF, padding: 6px 12px, border-radius: 12px
Not Achieved:    bg: #F44336, text: #FFFFFF, padding: 6px 12px, border-radius: 12px
Partial:         bg: #FFC107, text: #1F1F1F, padding: 6px 12px, border-radius: 12px
Pending:         bg: #E3F2FD, text: #2196F3, padding: 6px 12px, border-radius: 12px, border: 1px solid #2196F3
Draft:           bg: #F5F5F5, text: #666666, padding: 6px 12px, border-radius: 12px
Submitted:       bg: #FFE0B2, text: #E65100, padding: 6px 12px, border-radius: 12px
Approved:        bg: #C8E6C9, text: #2E7D32, padding: 6px 12px, border-radius: 12px
```

### Form Elements

#### Radio Buttons
```
Size:            16px × 16px
Checked:         bg: #2E7D32, inner circle: #FFFFFF
Unchecked:       border: 2px solid #E0E0E0, bg: #FFFFFF
Focus:           outline: 3px solid rgba(46,125,50,0.1)
Disabled:        opacity: 0.5, cursor: not-allowed

Label Spacing:   8px from button
```

#### Checkboxes
```
Size:            16px × 16px
Checked:         bg: #2E7D32, checkmark: #FFFFFF
Unchecked:       border: 2px solid #E0E0E0, bg: #FFFFFF
Focus:           outline: 3px solid rgba(46,125,50,0.1)
Border Radius:   4px
```

#### Dropdowns/Selects
```
Background:      #FFFFFF
Border:          1px solid #E0E0E0
Border Radius:   4px
Padding:         12px 16px
Arrow Icon:      #666666, positioned right
Font Size:       16px

Open State:
  Border:        2px solid #2E7D32
  Shadow:        0 2px 8px rgba(0,0,0,0.1)

Options:
  Padding:       12px 16px
  Hover bg:      #F5F5F5
  Selected:      bg: #E8F5E9, text: #2E7D32, font-weight: 500
```

---

## 6. SHADOWS & ELEVATION

```
Elevation 1:     0 2px 4px rgba(0, 0, 0, 0.08)
Elevation 2:     0 4px 8px rgba(0, 0, 0, 0.10)
Elevation 3:     0 8px 16px rgba(0, 0, 0, 0.12)
Elevation 4:     0 12px 24px rgba(0, 0, 0, 0.15)
Elevation 5:     0 16px 32px rgba(0, 0, 0, 0.18)

Focus Glow:      0 0 0 3px rgba(46, 125, 50, 0.1)
Error Glow:      0 0 0 3px rgba(244, 67, 52, 0.1)
```

---

## 7. RESPONSIVE BREAKPOINTS

```
Mobile Small:    < 320px
Mobile:          320px - 480px
Mobile Large:    480px - 768px
Tablet:          768px - 1024px
Desktop:         1024px - 1440px
Desktop Large:   > 1440px
```

### Responsive Layout

```
Mobile (< 768px):
  - Single column layout
  - Full-width buttons
  - Stacked cards
  - Larger touch targets (48px min)

Tablet (768px - 1024px):
  - Two column layout (where applicable)
  - Wider content

Desktop (> 1024px):
  - Two-three column layout
  - Sidebar navigation
  - Multi-column cards
  - Normal sized buttons
```

---

## 8. NAVIGATION PATTERNS

### Top Navigation Bar (Desktop)

```
┌─────────────────────────────────────────────────────┐
│ LOGO  Dashboard  |  Children  Plans  Reports       │ User▼ │
└─────────────────────────────────────────────────────┘
  ↓ Active tab underlined in primary color
  ↓ Right side: User dropdown with Logout
```

### Side Navigation (Desktop Alternative)

```
┌──────────┐ ┌─────────────────────────┐
│ LOGO     │ │ Main Content Area       │
├──────────┤ │                         │
│Dashboard │ │                         │
│Children  │ │                         │
│Plans     │ │                         │
│Reports   │ │                         │
│Settings  │ │                         │
├──────────┤ │                         │
│Logout    │ │                         │
└──────────┘ └─────────────────────────┘

Width: 260px
Background: #F5F5F5 or #2E7D32 (dark variant)
```

### Mobile Navigation (Hamburger)

```
┌──────────────────────────┐
│ ☰  QLHS          USER ▼   │
├──────────────────────────┤
│ › Dashboard              │
│ › Children               │
│ › Plans                  │
│ › Reports                │
│ › Settings               │
├──────────────────────────┤
│ › Logout                 │
└──────────────────────────┘
```

---

## 9. ANIMATIONS & TRANSITIONS

### Page Transitions
```
Default duration:        200ms
Easing:                  ease-in-out cubic-bezier(0.4, 0, 0.2, 1)
Fade in:                 opacity: 0 → 1
Slide in (from right):   transform: translateX(20px) → translateX(0)
```

### Button Interactions
```
Hover:                   transition: all 200ms ease-in-out
Loading:                 spinner animation 800ms linear infinite
Click feedback:          transform: scale(0.98)
Toast notification:      slide-in 300ms, auto-dismiss 4s
```

### Loading States
```
Skeleton loader:         animated placeholder
Progress bar:            animated stripe pattern
Spinner:                 rotating loader icon
Loading text:            "...loading" with animated dots
```

---

## 10. ACCESSIBILITY (WCAG 2.1 AA)

### Color Contrast
```
Normal text:             4.5:1 (AA), 7:1 (AAA)
Large text (18px+):      3:1 (AA), 4.5:1 (AAA)
UI components:           3:1 minimum
Don't rely on color alone - use icons, patterns
```

### Keyboard Navigation
```
Tab order:               Logical flow (left-to-right, top-to-bottom)
Skip link:               Skip to main content
Focus indicators:        Visible 3px outline, minimum 2px wide
Focus visible:           Always visible on keyboard nav
Keyboard shortcuts:      Documented (? to show)
```

### Screen Reader Support
```
Alt text:                All images have meaningful alt text
Labels:                  All inputs properly labeled
ARIA:                    Use aria-label, aria-describedby where needed
Semantic HTML:           <button>, <label>, <form> proper elements
Headings:                Proper h1-h6 hierarchy
Lists:                   Use <ul>, <ol>, <li>
```

### Mobile Accessibility
```
Touch targets:           Minimum 48px × 48px
Zoom:                    Allow up to 200% zoom
Text:                    Readable at 200% zoom
Orientation:             Support portrait & landscape
```

---

## 11. DARK MODE (Optional, Phase 2)

### Dark Color Palette

```
Background Primary:      #121212
Background Secondary:    #1E1E1E
Surface:                 #2C2C2C
Text Primary:            #E8E8E8
Text Secondary:          #B0B0B0
Text Tertiary:           #808080

Brand Color:             #81C784 (slightly lighter green)
```

---

## 12. ICON SYSTEM

### Icon Library
```
Use: Material Design Icons (google/material-design-icons)
Size: 24px, 32px, 48px (multiples of 8)
Weight: Regular (400) or Outlined
Color: Inherit from text color
```

### Common Icons
```
Navigation:
  ☰ Menu
  🏠 Home/Dashboard
  👥 Children
  📋 Plans
  📊 Reports
  ⚙️ Settings
  🚪 Logout

Actions:
  ✓ Check/Done
  ✕ Close/Cancel
  + Add/Create
  ✎ Edit
  🗑 Delete
  ↓ Download
  ⋯ More/Menu
  ⟳ Refresh

Status:
  ✓ Success/Achieved
  ⚠ Warning/Partial
  ✕ Error/Not Achieved
  ⓘ Info
  ⏳ Loading/Pending
```

---

## 13. COMPONENT STATES

### Button States (Example)

```
Enabled Normal:     bg: #2E7D32, text: white, cursor: pointer
Enabled Hover:      bg: #1B5E20, shadow elevated
Enabled Focus:      outline: 2px solid #2E7D32, offset: 2px
Enabled Active:     bg: #1B5E20, transform: scale(0.98)
Disabled:           bg: #CCCCCC, text: #999999, cursor: not-allowed
Loading:            show spinner inside button
```

### Form Field States (Example)

```
Empty:              border: #E0E0E0, text: gray placeholder
Filled:             border: #E0E0E0, text: #1F1F1F
Focused:            border: #2E7D32 (2px), shadow: glow
Filled + Focused:   border: #2E7D32 (2px), shadow: glow
Error:              border: #F44336 (2px), error text below
Disabled:           bg: #F5F5F5, opacity: 0.6
```

---

## 14. CONSISTENCY GUIDELINES

### Desktop Layout
```
Max-width:       1200px
Side margins:    Auto (centered)
Content padding: 32px horizontal
Vertical rhythm: 24px or 32px between sections
Header height:   64px
Footer height:   80px
```

### Mobile Layout
```
Full-width:      100%
Side margins:    0
Content padding: 16px horizontal
Vertical rhythm: 16px or 24px
Header height:   56px
Bottom nav:      56px (if used)
```

---

## 15. DESIGN TOKENS SUMMARY

```
Color Tokens:
  $primary:       #2E7D32
  $success:       #4CAF50
  $warning:       #FFC107
  $danger:        #F44336
  $info:          #2196F3
  
Spacing Tokens:
  $spacing-xs:    4px
  $spacing-sm:    8px
  $spacing-md:    16px
  $spacing-lg:    24px
  $spacing-xl:    32px

Typography Tokens:
  $font-size-sm:  14px
  $font-size-md:  16px
  $font-size-lg:  20px
  $font-size-xl:  32px

Radius Tokens:
  $rounded-sm:    4px
  $rounded-md:    8px
  $rounded-lg:    12px
  $rounded-full:  9999px

Shadow Tokens:
  $shadow-sm:     0 2px 4px rgba(0,0,0,0.08)
  $shadow-md:     0 4px 8px rgba(0,0,0,0.10)
  $shadow-lg:     0 8px 16px rgba(0,0,0,0.12)
```

---

## 16. FILE STRUCTURE (For Designers)

```
design/
├── Design System (Figma)
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Components
│
├── Screens
│   ├── Authentication
│   │   ├── Login
│   │   ├── Register
│   │   └── Forgot Password
│   ├── Main
│   │   ├── Dashboard
│   │   ├── Children List
│   │   └── Plans List
│   ├── Forms
│   │   ├── Create Plan
│   │   ├── Evaluation
│   │   └── Child Profile
│   ├── Views
│   │   ├── Plan Detail
│   │   ├── Progress
│   │   └── PDF Preview
│   └── Mobile
│       └── All responsive versions
│
└── Prototypes
    ├── Click-through prototype
    ├── User flows
    └── Animation specs
```

---

**Next**: Create detailed wireframes for each screen
