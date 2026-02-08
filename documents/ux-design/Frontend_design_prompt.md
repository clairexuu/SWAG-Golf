<goal>
You are a senior SaaS product designer. You have built high-quality user interfaces for FANG-level companies (Facebook/Meta, Amazon, Netflix, Google).
Your goal is to combine the context information, design guidelines, and user inspiration below, and transform them into a functional UI design.
</goal>

<guidelines>

<aesthetics>
Aesthetic Principles:

- Bold simplicity paired with intuitive navigation to create a frictionless experience
- Breathable whitespace with strategic color accents to form visual hierarchy
- Strategic negative space, carefully calibrated to provide cognitive breathing room and enable content prioritization
- Systematic color theory through subtle gradients and purposeful accent color application
- Typographic hierarchy leveraging weight variation and proportional scaling to build information architecture
- Visual density optimization, balancing information availability with cognitive load management
- Motion choreography implementing physics-based transitions to maintain spatial continuity
- Accessibility-driven contrast paired with intuitive navigation patterns to ensure universal usability
- Feedback responsiveness through state transitions that communicate system status with minimal latency
- Content-first layout that prioritizes user goals over decorative elements to improve task efficiency

</aesthetics>

<practicalities>
Practical Requirements:

- This is a desktop-only web application (no mobile support required); design for widescreen monitors (1440px+ width)
- Use Lucide React icons (stroke-based, consistent with SWAG Golf icon style)
- Use Tailwind CSS for all styling, leveraging the custom SWAG Golf Tailwind config provided in the design system
- All components are React 18 + TypeScript + Vite
- The existing component architecture MUST be respected -- do not restructure the component tree; design within it:
  - `Layout/MainLayout.tsx` -- Top-level three-panel layout container with header
  - `LeftPanel/StyleSelector.tsx` -- Style browsing, selection, and experimental mode toggle (upper left); StyleManager for style CRUD (lower left)
  - `CenterPanel/ChatInput.tsx` -- Concept description input + generate button (upper center); UserFeedbackInput for iteration feedback (lower center)
  - `RightPanel/SketchGrid.tsx` -- 2x2 sketch output grid with per-sketch actions (right panel, 50% width)
- Output should integrate into the existing React project at `control/frontend/`

</practicalities>

<project-specific-guidelines>

# SWAG Golf -- UI Reference Design System

> Comprehensive design system derived from analysis of the swaggergolf.com production website.
> This document serves as the canonical reference for all UI/UX decisions in the SWAG Concept Sketch Agent and any related SWAG Golf digital products.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Component Styles](#4-component-styles)
5. [Layout & Spacing System](#5-layout--spacing-system)
6. [Animations & Transitions](#6-animations--transitions)
7. [Dark Mode](#7-dark-mode-primary)
8. [Iconography & Imagery](#8-iconography--imagery)
9. [Tailwind Configuration Reference](#9-tailwind-configuration-reference)

---

## 1. Design Philosophy

SWAG Golf's visual identity is defined by a **premium dark aesthetic** with high-contrast neon accents. The design language communicates exclusivity, energy, and streetwear-inspired edge -- fitting for a brand that treats golf accessories as collectible drops rather than commodity products.

**Core Principles:**

- **Dark-first:** Pure black backgrounds are the canvas; content floats on darkness.
- **High contrast:** White text and neon accents punch through the dark theme for maximum legibility and visual impact.
- **Bold simplicity:** Large, confident type with minimal ornamentation. Let the product photography do the talking.
- **Drop culture:** UI patterns borrow from streetwear and sneaker drop sites -- urgency banners, countdown badges, lottery mechanics.
- **Vibrant product focus:** The dark environment exists to make colorful product imagery pop.

---

## 2. Color Palette

### 2.1 Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **SWAG Black** | `#000000` | `0, 0, 0` | Primary background, cards, page canvas |
| **SWAG White** | `#FFFFFF` | `255, 255, 255` | Primary text, headings, product names |
| **SWAG Green (Lime)** | `#39FF14` | `57, 255, 20` | Brand logo, primary CTA buttons, key accent |

### 2.2 Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Muted Green** | `#2ECC40` | `46, 204, 64` | Secondary buttons (Subscribe, Create Account), hover states |
| **Teal / Cyan** | `#00CED1` | `0, 206, 209` | Product photography accents, decorative highlights |
| **Dark Gray** | `#1A1A1A` | `26, 26, 26` | Card backgrounds, elevated surfaces, input fields |
| **Medium Gray** | `#2A2A2A` | `42, 42, 42` | Borders, dividers, subtle separators |

### 2.3 Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Hot Pink** | `#FF1493` | `255, 20, 147` | "NEW" badges, "DON'T MISS OUT" widget, date stamps, urgency indicators |
| **Neon Pink** | `#FF69B4` | `255, 105, 180` | Secondary badge variant, softer urgency accents |
| **Electric Lime** | `#ADFF2F` | `173, 255, 47` | "LOTTERY" badge, gamification elements, alternate green accent |

### 2.4 Functional Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Error Red** | `#FF3B30` | `255, 59, 48` | Error states, destructive actions, validation failures |
| **Warning Amber** | `#FFCC00` | `255, 204, 0` | Warning states, cautionary messaging |
| **Success Green** | `#39FF14` | `57, 255, 20` | Success confirmations (shares primary green) |
| **Info Blue** | `#007AFF` | `0, 122, 255` | Informational states, links (used sparingly) |
| **Disabled Gray** | `#555555` | `85, 85, 85` | Disabled buttons, inactive controls |
| **Placeholder Gray** | `#888888` | `136, 136, 136` | Placeholder text, secondary metadata |

### 2.5 Background Hierarchy

| Level | Hex | Usage |
|-------|-----|-------|
| **Level 0 (Canvas)** | `#000000` | Page background, outermost layer |
| **Level 1 (Surface)** | `#0D0D0D` | Section backgrounds, card containers |
| **Level 2 (Elevated)** | `#1A1A1A` | Cards, input fields, modals |
| **Level 3 (Overlay)** | `#2A2A2A` | Dropdown menus, tooltips, popovers |
| **Level 4 (Active)** | `#333333` | Active/hover state backgrounds |

### 2.6 Gradient Definitions

```css
/* Scrolling banner gradient (FREE SHIPPING bar) */
--gradient-banner: linear-gradient(90deg, #39FF14 0%, #2ECC40 50%, #39FF14 100%);

/* CTA button hover glow */
--gradient-glow: radial-gradient(circle, rgba(57, 255, 20, 0.3) 0%, transparent 70%);

/* Card hover overlay */
--gradient-card-hover: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
```

---

## 3. Typography

### 3.1 Font Families

| Role | Font Stack | Fallback |
|------|-----------|----------|
| **Headings** | `'Bebas Neue', 'Impact', 'Arial Narrow Bold'` | `sans-serif` |
| **Body** | `'Helvetica Neue', 'Helvetica', 'Arial'` | `sans-serif` |
| **UI / System** | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'` | `sans-serif` |
| **Monospace (prices)** | `'SF Mono', 'Fira Code', 'Consolas'` | `monospace` |

> **Note:** SWAG Golf headings use a condensed, all-caps display typeface. Bebas Neue is the closest open-source match. The actual site may use a proprietary or licensed variant. If Bebas Neue is unavailable, use Impact or any bold condensed sans-serif.

### 3.2 Type Scale

| Style Name | Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Transform | Usage |
|-----------|-----------|------------|--------|-------------|----------------|-----------|-------|
| **Display Hero** | 72px | 4.5rem | 800 | 1.0 | 2px | `uppercase` | Page hero titles ("APPAREL", "NEW ARRIVALS") |
| **Display Large** | 56px | 3.5rem | 800 | 1.05 | 1.5px | `uppercase` | Section hero titles ("PAST DROPS") |
| **Heading 1** | 40px | 2.5rem | 700 | 1.1 | 1px | `uppercase` | Major section headings |
| **Heading 2** | 32px | 2rem | 700 | 1.15 | 0.5px | `uppercase` | Sub-section headings |
| **Heading 3** | 24px | 1.5rem | 600 | 1.2 | 0.25px | `none` | Card group titles, panel titles |
| **Body Large** | 18px | 1.125rem | 400 | 1.6 | 0 | `none` | Introductory paragraphs |
| **Body** | 16px | 1rem | 400 | 1.5 | 0 | `none` | General body text |
| **Body Small** | 14px | 0.875rem | 400 | 1.5 | 0 | `none` | Product names, descriptions |
| **Caption** | 12px | 0.75rem | 500 | 1.4 | 0.5px | `uppercase` | Badges, labels, metadata |
| **Overline** | 10px | 0.625rem | 600 | 1.3 | 1.5px | `uppercase` | Category labels, fine print |

### 3.3 Text Color Assignments

| Context | Color | Hex |
|---------|-------|-----|
| Primary text (headings, titles) | White | `#FFFFFF` |
| Secondary text (descriptions, metadata) | Light Gray | `#B0B0B0` |
| Tertiary text (hints, captions) | Medium Gray | `#888888` |
| Interactive text (links, actions) | SWAG Green | `#39FF14` |
| Price text | White | `#FFFFFF` |
| Sale / original price | Medium Gray (with strikethrough) | `#888888` |
| Placeholder text | Dark Gray | `#555555` |
| Text on green buttons | Black | `#000000` |
| Text on dark buttons | White | `#FFFFFF` |

---

## 4. Component Styles

### 4.1 Buttons

#### Primary Button (Green CTA)

```
Background:        #39FF14  (SWAG Green)
Text Color:        #000000  (Black)
Font Size:         14px
Font Weight:       700  (Bold)
Text Transform:    uppercase
Letter Spacing:    1.5px
Padding:           12px 32px
Border Radius:     0px  (sharp corners -- brand signature)
Border:            none
Min Width:         160px
Height:            48px

Hover State:
  Background:      #2ECC40  (Muted Green)
  Box Shadow:      0 0 20px rgba(57, 255, 20, 0.4)
  Transform:       translateY(-1px)

Active State:
  Background:      #27AE36
  Transform:       translateY(0)
  Box Shadow:      none

Disabled State:
  Background:      #333333
  Text Color:      #555555
  Cursor:          not-allowed
```

#### Secondary Button (Dark)

```
Background:        #1A1A1A  (Dark Gray)
Text Color:        #FFFFFF  (White)
Font Size:         14px
Font Weight:       600
Text Transform:    uppercase
Letter Spacing:    1px
Padding:           12px 32px
Border Radius:     0px
Border:            1px solid #333333
Height:            48px

Hover State:
  Background:      #2A2A2A
  Border Color:    #555555

Active State:
  Background:      #333333

Disabled State:
  Background:      #0D0D0D
  Text Color:      #333333
  Border Color:    #1A1A1A
```

#### Tertiary Button (Ghost / Outline)

```
Background:        transparent
Text Color:        #FFFFFF
Font Size:         14px
Font Weight:       600
Padding:           12px 32px
Border Radius:     0px
Border:            1px solid #FFFFFF

Hover State:
  Background:      rgba(255, 255, 255, 0.08)
  Border Color:    #39FF14
  Text Color:      #39FF14

Active State:
  Background:      rgba(255, 255, 255, 0.12)
```

#### Icon Button (Minimal)

```
Background:        transparent
Color:             #888888
Size:              40px x 40px
Border Radius:     4px
Border:            none
Padding:           8px

Hover State:
  Background:      rgba(255, 255, 255, 0.08)
  Color:           #FFFFFF
```

#### Filter / Sort Button

```
Background:        #1A1A1A
Text Color:        #FFFFFF
Font Size:         13px
Font Weight:       500
Padding:           8px 16px
Border Radius:     4px
Border:            1px solid #333333
Icon Color:        #39FF14  (green accent on filter icon)

Hover State:
  Border Color:    #39FF14
```

### 4.2 Product Cards

#### Standard Product Card

```
Container:
  Background:      #0D0D0D
  Border:          1px solid #1A1A1A
  Border Radius:   0px  (sharp corners)
  Overflow:        hidden
  Width:           100% (fluid within grid)
  Cursor:          pointer

Image Area:
  Background:      #000000
  Aspect Ratio:    1 / 1  (square)
  Object Fit:      cover
  Padding:         0

Content Area:
  Padding:         16px
  Background:      #0D0D0D

Product Name:
  Font Size:       14px
  Font Weight:     600
  Color:           #FFFFFF
  Line Clamp:      2 lines
  Margin Bottom:   4px

Price:
  Font Size:       14px
  Font Weight:     500
  Color:           #FFFFFF

Hover State:
  Border Color:    #333333
  Transform:       translateY(-2px)
  Box Shadow:      0 8px 24px rgba(0, 0, 0, 0.6)
  Image:           scale(1.05) with overflow hidden
```

#### Drop / Event Card (Past Drops)

```
Container:
  Background:      #0D0D0D
  Border:          none
  Border Radius:   0px
  Overflow:        hidden

Image Area:
  Aspect Ratio:    16 / 9
  Object Fit:      cover
  Filter:          brightness(0.9)  (slight dimming for text overlay legibility)

Content Overlay:
  Position:        absolute (bottom of card)
  Background:      linear-gradient(180deg, transparent, rgba(0,0,0,0.8))
  Padding:         16px

Title:
  Font Size:       18px
  Font Weight:     700
  Color:           #FFFFFF
  Text Transform:  uppercase

Date Badge:
  Position:        absolute (top-right of card)
  See Badge styles below
```

### 4.3 Badges

#### "NEW" Badge

```
Background:        #FF1493  (Hot Pink)
Text Color:        #FFFFFF
Font Size:         10px
Font Weight:       700
Text Transform:    uppercase
Letter Spacing:    1px
Padding:           4px 10px
Border Radius:     0px  (sharp)
Position:          absolute
Top:               12px
Left:              12px
Z-Index:           2
```

#### "LOTTERY" Badge

```
Background:        #39FF14  (SWAG Green)
Text Color:        #000000
Font Size:         10px
Font Weight:       700
Text Transform:    uppercase
Letter Spacing:    1px
Padding:           4px 10px
Border Radius:     0px
```

#### Date / Drop Badge

```
Background:        #FF1493  (Hot Pink)
Text Color:        #FFFFFF
Font Size:         11px
Font Weight:       600
Padding:           6px 12px
Border Radius:     0px
Position:          absolute
Top:               12px
Right:             12px
White Space:       nowrap
```

#### "SOLD OUT" Badge

```
Background:        #333333
Text Color:        #888888
Font Size:         10px
Font Weight:       700
Text Transform:    uppercase
Letter Spacing:    1px
Padding:           4px 10px
Border Radius:     0px
Opacity:           0.9
```

#### Generic Status Badge

```
/* Used for: Featured, Sale, Limited, etc. */
Background:        varies by context (see color palette)
Text Color:        contextual  (#000000 on bright backgrounds, #FFFFFF on dark)
Font Size:         10px
Font Weight:       700
Text Transform:    uppercase
Letter Spacing:    1px
Padding:           4px 10px
Border Radius:     0px
```

### 4.4 Form Inputs

#### Text Input / Email Input

```
Background:        #1A1A1A
Text Color:        #FFFFFF
Font Size:         16px
Font Weight:       400
Padding:           14px 16px
Border:            1px solid #333333
Border Radius:     0px  (sharp corners)
Height:            48px
Width:             100%
Caret Color:       #39FF14

Placeholder:
  Color:           #555555

Focus State:
  Border Color:    #39FF14
  Outline:         none
  Box Shadow:      0 0 0 1px #39FF14

Error State:
  Border Color:    #FF3B30
  Box Shadow:      0 0 0 1px #FF3B30

Disabled State:
  Background:      #0D0D0D
  Text Color:      #333333
  Cursor:          not-allowed
```

#### Password Input

```
/* Same as Text Input, plus: */
Toggle Visibility Icon:
  Position:        absolute right 16px
  Color:           #555555
  Hover Color:     #FFFFFF
  Size:            20px
```

#### Textarea

```
/* Same base styles as Text Input, plus: */
Min Height:        120px
Resize:            vertical
Line Height:       1.6
```

#### Select / Dropdown

```
Background:        #1A1A1A
Text Color:        #FFFFFF
Font Size:         14px
Padding:           12px 40px 12px 16px
Border:            1px solid #333333
Border Radius:     0px
Height:            48px
Arrow Icon Color:  #39FF14

Dropdown Panel:
  Background:      #1A1A1A
  Border:          1px solid #333333
  Box Shadow:      0 8px 32px rgba(0, 0, 0, 0.8)
  Max Height:      240px
  Overflow Y:      auto

Option:
  Padding:         12px 16px
  Hover Background:#2A2A2A
  Selected Color:  #39FF14
```

### 4.5 Navigation

#### Top Announcement Banner (Scrolling)

```
Background:        #39FF14  (SWAG Green)
Height:            36px
Text Color:        #000000
Font Size:         12px
Font Weight:       700
Text Transform:    uppercase
Letter Spacing:    2px
Overflow:          hidden
Animation:         horizontal scroll marquee, infinite, 20s linear
```

#### Main Navigation Bar

```
Background:        #000000
Height:            64px
Padding:           0 40px
Position:          sticky
Top:               36px  (below announcement banner)
Z-Index:           100
Border Bottom:     none

Logo:
  Color:           #39FF14
  Font Size:       28px
  Font Weight:     800
  Text Transform:  uppercase
  Letter Spacing:  4px

Nav Links:
  Color:           #FFFFFF
  Font Size:       13px
  Font Weight:     600
  Text Transform:  uppercase
  Letter Spacing:  1.5px
  Padding:         8px 16px
  Gap:             8px

Nav Link Hover:
  Color:           #39FF14
  Text Decoration: none

Nav Icons (Cart, Account):
  Color:           #FFFFFF
  Size:            24px
  Hover Color:     #39FF14
```

### 4.6 Footer

```
Background:        #000000
Border Top:        1px solid #1A1A1A
Padding:           64px 40px 32px

Section Heading:
  Color:           #FFFFFF
  Font Size:       14px
  Font Weight:     700
  Text Transform:  uppercase
  Letter Spacing:  1.5px
  Margin Bottom:   24px

Footer Link:
  Color:           #888888
  Font Size:       14px
  Font Weight:     400
  Line Height:     2.0

Footer Link Hover:
  Color:           #FFFFFF

Newsletter Signup:
  Input Width:     280px
  Button:          Green CTA style (see Primary Button)
  Label:           "NEWSLETTER SIGNUP" in Caption style

Copyright Text:
  Color:           #555555
  Font Size:       12px
  Margin Top:      48px
```

### 4.7 "DON'T MISS OUT" Widget

```
Position:          fixed
Bottom:            24px
Left:              24px
Z-Index:           90

Container:
  Background:      #FF1493  (Hot Pink)
  Padding:         12px 20px
  Border Radius:   4px
  Cursor:          pointer
  Box Shadow:      0 4px 16px rgba(255, 20, 147, 0.4)

Text:
  Color:           #FFFFFF
  Font Size:       12px
  Font Weight:     700
  Text Transform:  uppercase
  Letter Spacing:  1px

Hover State:
  Background:      #E91280
  Transform:       scale(1.05)

Close Button:
  Position:        absolute
  Top:             -8px
  Right:           -8px
  Size:            20px
  Background:      #000000
  Border Radius:   50%
  Color:           #FFFFFF
```

---

## 5. Layout & Spacing System

### 5.1 Spacing Scale

The spacing system uses a **4px base unit** with the following scale:

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | No spacing |
| `space-1` | 4px | Tight inline spacing, icon padding |
| `space-2` | 8px | Small gaps, badge padding |
| `space-3` | 12px | Inner card padding, compact element gaps |
| `space-4` | 16px | Standard card padding, content gaps |
| `space-5` | 20px | Medium section spacing |
| `space-6` | 24px | Standard section padding, inter-card gaps |
| `space-7` | 32px | Large section spacing |
| `space-8` | 40px | Page horizontal padding, major section gaps |
| `space-9` | 48px | Major vertical section breaks |
| `space-10` | 64px | Page section vertical padding |
| `space-11` | 80px | Hero section padding |
| `space-12` | 96px | Maximum section separation |

### 5.2 Page Layout

```
Max Content Width:     1440px
Page Horizontal Pad:   40px  (desktop), 20px (mobile)
Content Centering:     margin: 0 auto

Announcement Banner:   36px height, full width
Nav Bar:               64px height, full width, sticky
Main Content:          starts below nav (100px from top)
Footer:                full width
```

### 5.3 Grid System

#### Product Grid

```
Desktop (>1200px):
  Columns:          4
  Gap:              20px
  Card Min Width:   260px

Tablet (768px-1200px):
  Columns:          3
  Gap:              16px

Mobile (480px-768px):
  Columns:          2
  Gap:              12px

Small Mobile (<480px):
  Columns:          2
  Gap:              8px
```

#### Drop / Event Grid

```
Desktop:            3 columns, 24px gap
Tablet:             2 columns, 16px gap
Mobile:             1 column, 16px gap
```

### 5.4 Breakpoints

| Name | Min Width | Usage |
|------|-----------|-------|
| `sm` | 480px | Small mobile adjustments |
| `md` | 768px | Tablet layout, 2-column grids |
| `lg` | 1024px | Desktop layout begins |
| `xl` | 1280px | Full desktop, 4-column grids |
| `2xl` | 1440px | Max content width reached |

### 5.5 Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | `0` | Default content |
| Cards | `1` | Product cards, content blocks |
| Badges | `2` | Badge overlays on cards |
| Sticky Nav | `100` | Navigation bar |
| Widget | `90` | "DON'T MISS OUT" floating widget |
| Dropdown | `200` | Dropdown menus, popovers |
| Modal Backdrop | `300` | Modal overlay background |
| Modal Content | `310` | Modal window |
| Toast / Snackbar | `400` | Notification toasts |
| Tooltip | `500` | Tooltips |

---

## 6. Animations & Transitions

### 6.1 Transition Defaults

```css
/* Standard interactive transition (buttons, links, inputs) */
--transition-default: all 200ms ease-out;

/* Card hover transition (slightly slower for smoothness) */
--transition-card: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Color-only transition (background, text, border color changes) */
--transition-color: color 150ms ease, background-color 150ms ease, border-color 150ms ease;

/* Transform transition (scale, translate) */
--transition-transform: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 6.2 Keyframe Animations

#### Marquee Scroll (Announcement Banner)

```css
@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Usage: */
animation: marquee-scroll 20s linear infinite;
```

#### Fade In (Page/Section Load)

```css
@keyframes fade-in {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Usage: */
animation: fade-in 400ms ease-out forwards;
```

#### Pulse Glow (Attention Widget)

```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 4px 16px rgba(255, 20, 147, 0.4); }
  50%      { box-shadow: 0 4px 24px rgba(255, 20, 147, 0.7); }
}

/* Usage on DON'T MISS OUT widget: */
animation: pulse-glow 2s ease-in-out infinite;
```

#### Spin (Loading Indicator)

```css
@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Usage: */
animation: spin 1s linear infinite;
```

#### Skeleton Shimmer (Loading Placeholder)

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Usage: */
background: linear-gradient(90deg, #1A1A1A 25%, #2A2A2A 50%, #1A1A1A 75%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
```

### 6.3 Hover & Interaction Behaviors

| Element | Hover Behavior |
|---------|---------------|
| Product Card | `translateY(-2px)`, border lightens, image scales to `1.05` |
| Primary Button (Green) | Background shifts to `#2ECC40`, green glow shadow appears |
| Nav Links | Color transitions to `#39FF14` |
| Footer Links | Color transitions from `#888888` to `#FFFFFF` |
| Icon Buttons | Background appears at `rgba(255,255,255,0.08)` |
| Badge (clickable) | Slight `scale(1.05)` |
| Input Focus | Border transitions to `#39FF14`, glow ring appears |

### 6.4 Page Transitions

```
Route Change:       Cross-fade, 200ms duration
Product Grid Load:  Staggered fade-in, 50ms delay between cards, 400ms per card
Modal Open:         Backdrop fade 200ms, content scale from 0.95 to 1.0 in 250ms
Modal Close:        Reverse of open, 150ms (faster close feels snappier)
```

---

## 7. Dark Mode (Primary)

> **SWAG Golf's dark theme IS the brand.** There is no light mode. The dark aesthetic is not an alternative -- it is the only mode. All design decisions start from black.

### 7.1 Dark Mode Surface Hierarchy

```
Level 0 -- Canvas:     #000000   Page background
Level 1 -- Surface:    #0D0D0D   Sections, card groups
Level 2 -- Elevated:   #1A1A1A   Cards, inputs, interactive containers
Level 3 -- Overlay:    #2A2A2A   Dropdowns, tooltips
Level 4 -- Active:     #333333   Hover states, active selections
```

### 7.2 Dark Mode Text Hierarchy

```
Primary Text:      #FFFFFF     (100% white -- headings, product names, prices)
Secondary Text:    #B0B0B0     (69% white  -- descriptions, body content)
Tertiary Text:     #888888     (53% white  -- hints, captions, timestamps)
Quaternary Text:   #555555     (33% white  -- placeholders, disabled content)
```

### 7.3 Dark Mode Border & Divider Hierarchy

```
Subtle Border:     #1A1A1A     (card edges, input resting state)
Default Border:    #2A2A2A     (visible dividers, section separators)
Strong Border:     #333333     (emphasized containers, hover states)
Focus Border:      #39FF14     (active inputs, focused elements)
Error Border:      #FF3B30     (validation errors)
```

### 7.4 Dark Mode Shadows

```css
/* Shadows on dark backgrounds use deeper blacks, not gray */

/* Card resting state -- no shadow (edges blend into background) */
--shadow-none: none;

/* Card hover state */
--shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.6);

/* Elevated modal */
--shadow-modal: 0 16px 48px rgba(0, 0, 0, 0.8);

/* Green button glow */
--shadow-glow-green: 0 0 20px rgba(57, 255, 20, 0.4);

/* Pink widget glow */
--shadow-glow-pink: 0 4px 16px rgba(255, 20, 147, 0.4);

/* Dropdown */
--shadow-dropdown: 0 8px 32px rgba(0, 0, 0, 0.8);
```

### 7.5 Dark Mode Image Treatment

```
Product images:          No filter -- full color vibrancy on dark canvas
Background images:       brightness(0.7) to prevent washing out overlaid text
Card hover images:       Slight brightness increase to 1.05 on hover
Disabled/sold-out items: grayscale(0.5) + opacity(0.6)
```

### 7.6 Dark Mode Scrollbar

```css
/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
  background: #000000;
}

::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
```

---

## 8. Iconography & Imagery

### 8.1 Icon Style

```
Style:            Outlined (stroke-based), not filled
Stroke Width:     1.5px - 2px
Default Size:     24px (nav), 20px (inline), 16px (compact)
Default Color:    #FFFFFF (on dark backgrounds)
Hover Color:      #39FF14
Icon Library:     Heroicons (outline set) or Lucide -- consistent with stroke-based aesthetic
```

### 8.2 Product Photography Guidelines

```
Background:       Pure black (#000000) or brand-consistent dark backdrop
Lighting:         High-contrast, studio-quality, vivid color reproduction
Aspect Ratio:     1:1 (square) for product grid, 16:9 for hero/drop banners
File Format:      WebP preferred, JPEG fallback, PNG for transparency
Max File Size:    200KB (grid thumbnails), 800KB (hero images)
```

### 8.3 Logo Usage

```
Primary Logo:     "SWAG" wordmark in #39FF14 on #000000 background
Minimum Size:     120px wide (digital)
Clear Space:      Minimum 16px on all sides
Do Not:           Place on light backgrounds, change color, add effects
```

---

## 9. Tailwind Configuration Reference

The following Tailwind CSS configuration maps the design system tokens for use in the SWAG Concept Sketch Agent frontend.

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swag: {
          black:       '#000000',
          white:       '#FFFFFF',
          green:       '#39FF14',
          'green-muted': '#2ECC40',
          'green-dark':  '#27AE36',
          'green-lime':  '#ADFF2F',
          pink:        '#FF1493',
          'pink-soft': '#FF69B4',
          teal:        '#00CED1',
        },
        surface: {
          0: '#000000',
          1: '#0D0D0D',
          2: '#1A1A1A',
          3: '#2A2A2A',
          4: '#333333',
        },
        border: {
          subtle:  '#1A1A1A',
          default: '#2A2A2A',
          strong:  '#333333',
          focus:   '#39FF14',
        },
        text: {
          primary:    '#FFFFFF',
          secondary:  '#B0B0B0',
          tertiary:   '#888888',
          quaternary: '#555555',
        },
        functional: {
          error:   '#FF3B30',
          warning: '#FFCC00',
          success: '#39FF14',
          info:    '#007AFF',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', '"Arial Narrow"', 'sans-serif'],
        body:    ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        system:  ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:    ['"SF Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display-hero':  ['4.5rem',  { lineHeight: '1.0',  letterSpacing: '2px',   fontWeight: '800' }],
        'display-lg':    ['3.5rem',  { lineHeight: '1.05', letterSpacing: '1.5px', fontWeight: '800' }],
        'heading-1':     ['2.5rem',  { lineHeight: '1.1',  letterSpacing: '1px',   fontWeight: '700' }],
        'heading-2':     ['2rem',    { lineHeight: '1.15', letterSpacing: '0.5px', fontWeight: '700' }],
        'heading-3':     ['1.5rem',  { lineHeight: '1.2',  letterSpacing: '0.25px',fontWeight: '600' }],
        'body-lg':       ['1.125rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'body':          ['1rem',    { lineHeight: '1.5',  fontWeight: '400' }],
        'body-sm':       ['0.875rem',{ lineHeight: '1.5',  fontWeight: '400' }],
        'caption':       ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.5px', fontWeight: '500' }],
        'overline':      ['0.625rem',{ lineHeight: '1.3',  letterSpacing: '1.5px', fontWeight: '600' }],
      },
      spacing: {
        '0':  '0px',
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '20px',
        '6':  '24px',
        '7':  '32px',
        '8':  '40px',
        '9':  '48px',
        '10': '64px',
        '11': '80px',
        '12': '96px',
      },
      borderRadius: {
        'none': '0px',
        'sm':   '4px',
      },
      boxShadow: {
        'card-hover':  '0 8px 24px rgba(0, 0, 0, 0.6)',
        'modal':       '0 16px 48px rgba(0, 0, 0, 0.8)',
        'glow-green':  '0 0 20px rgba(57, 255, 20, 0.4)',
        'glow-pink':   '0 4px 16px rgba(255, 20, 147, 0.4)',
        'dropdown':    '0 8px 32px rgba(0, 0, 0, 0.8)',
      },
      transitionTimingFunction: {
        'swag': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'marquee':   'marquee-scroll 20s linear infinite',
        'fade-in':   'fade-in 400ms ease-out forwards',
        'pulse-glow':'pulse-glow 2s ease-in-out infinite',
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        'marquee-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 4px 16px rgba(255, 20, 147, 0.4)' },
          '50%':      { boxShadow: '0 4px 24px rgba(255, 20, 147, 0.7)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      zIndex: {
        'base':     '0',
        'card':     '1',
        'badge':    '2',
        'widget':   '90',
        'nav':      '100',
        'dropdown': '200',
        'modal-bg': '300',
        'modal':    '310',
        'toast':    '400',
        'tooltip':  '500',
      },
    },
  },
  plugins: [],
}
```

---

## Appendix A: Quick Reference -- CSS Custom Properties

For projects not using Tailwind, the design system can be implemented via CSS custom properties:

```css
:root {
  /* Colors -- Primary */
  --color-black:           #000000;
  --color-white:           #FFFFFF;
  --color-green:           #39FF14;
  --color-green-muted:     #2ECC40;
  --color-pink:            #FF1493;

  /* Colors -- Surfaces */
  --surface-0:             #000000;
  --surface-1:             #0D0D0D;
  --surface-2:             #1A1A1A;
  --surface-3:             #2A2A2A;
  --surface-4:             #333333;

  /* Colors -- Text */
  --text-primary:          #FFFFFF;
  --text-secondary:        #B0B0B0;
  --text-tertiary:         #888888;
  --text-quaternary:       #555555;

  /* Colors -- Borders */
  --border-subtle:         #1A1A1A;
  --border-default:        #2A2A2A;
  --border-strong:         #333333;
  --border-focus:          #39FF14;

  /* Typography */
  --font-display:          'Bebas Neue', Impact, sans-serif;
  --font-body:             'Helvetica Neue', Helvetica, Arial, sans-serif;

  /* Spacing */
  --space-unit:            4px;

  /* Transitions */
  --transition-default:    all 200ms ease-out;
  --transition-card:       all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-color:      color 150ms ease, background-color 150ms ease, border-color 150ms ease;

  /* Shadows */
  --shadow-card-hover:     0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-glow-green:     0 0 20px rgba(57, 255, 20, 0.4);
  --shadow-glow-pink:      0 4px 16px rgba(255, 20, 147, 0.4);

  /* Layout */
  --max-content-width:     1440px;
  --nav-height:            64px;
  --banner-height:         36px;
}
```

---

## Appendix B: Component Class Cheatsheet (Tailwind)

Quick-reference utility class compositions for common SWAG Golf components:

```
Page Background:
  bg-swag-black min-h-screen

Page Heading (Hero):
  font-display text-display-hero text-swag-white uppercase tracking-wide

Product Card:
  bg-surface-1 border border-border-subtle hover:border-border-strong
  hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-300

Primary Button:
  bg-swag-green text-swag-black font-bold text-sm uppercase tracking-widest
  px-8 py-3 hover:bg-swag-green-muted hover:shadow-glow-green transition-all

NEW Badge:
  bg-swag-pink text-swag-white text-overline font-bold uppercase
  px-2.5 py-1 absolute top-3 left-3 z-badge

Input Field:
  bg-surface-2 text-swag-white border border-border-default
  px-4 py-3.5 focus:border-border-focus focus:ring-1 focus:ring-swag-green
  placeholder:text-text-quaternary transition-colors

Nav Link:
  text-swag-white text-caption font-semibold uppercase tracking-widest
  hover:text-swag-green transition-colors
```

---

*Document version: 1.0*
*Last updated: 2026-02-07*
*Source reference: swaggergolf.com production website (screenshots analyzed February 2026)*

</project-specific-guidelines>

</guidelines>

<context>

<app-overview>

# SWAG Golf Concept Sketch Agent -- MVP Product Requirements Document

**Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** MVP
**Author:** Product Team

---

## Elevator Pitch

SWAG Golf's licensed design pipeline is bottlenecked at concept sketching -- not at creative ideation or final execution. Senior designers already know what they want to build; the friction is translating ideas into early-stage visual concepts fast enough to keep pace with approvals, iteration cycles, and volume demands. The Concept Sketch Agent is an internal AI-powered design assistant that converts a designer's natural language description into rough, draw-over-ready concept sketches in seconds, using a retrieval-augmented generation (RAG) system built on the team's own curated reference image library. It preserves designer control, enforces exact stylistic fidelity, and optimizes for speed and concept throughput -- not final polish.

---

## Problem Statement

SWAG Golf designers spend a disproportionate amount of time producing early-stage concept sketches that exist solely to communicate direction, secure internal approvals, and seed iteration. These sketches are not final art -- they are rough visual artifacts that get drawn over, annotated, and discarded once a direction is chosen. Despite their disposable nature, each sketch still requires a designer to sit down, interpret a brief, select a style vocabulary, and draw. At current volume, this manual step creates a throughput ceiling on the entire licensed design pipeline. Meanwhile, generic AI image generators produce output that is too polished, stylistically inconsistent, or completely disconnected from SWAG's proprietary visual language. Designers need a tool that speaks their style, respects their constraints, and produces intentionally rough output that accelerates -- rather than replaces -- their craft.

---

## Target Audience

**Primary User: SWAG Golf Senior Designers**

- Professional designers working on licensed golf apparel graphics
- Highly skilled in final execution; bottlenecked at early-stage concepting
- Maintain personal style libraries with curated reference images
- Need output they can draw over, not output that replaces their work
- Value speed-to-first-draft over pixel-perfect generation
- Work on macOS desktops in a studio environment

**Secondary User: SWAG Golf Design Leads / Art Directors**

- Review and approve concept directions before production
- Need to see multiple concept variations quickly to make go/no-go decisions
- Benefit from faster iteration cycles across the team

---

## Unique Selling Proposition

Unlike generic AI image generators (Midjourney, DALL-E, Stable Diffusion) that produce polished, stylistically unpredictable output from a global training set, the SWAG Concept Sketch Agent:

1. **Enforces exact stylistic fidelity** -- Every generation is scoped to a designer-curated style with isolated reference images, visual rules (line weight, looseness, complexity), and optional negative examples. The system never blends styles or drifts into generic aesthetics.
2. **Produces intentionally rough output** -- Black-and-white, loose-ink, thick-outline sketches that look like a 10-15 minute human sketch. Designed to be drawn over, not shipped.
3. **Uses the team's own reference library** -- RAG retrieval pulls from SWAG's proprietary image database, not the open internet. Generated concepts reflect real SWAG designer work.
4. **Preserves designer control at every step** -- Designers select the style, describe the concept in their own words, review multiple variations, provide feedback, and iterate until a direction is chosen. The AI accelerates; the designer decides.

---

## Target Platforms

| Platform | Technology | Purpose |
|----------|------------|---------|
| **Desktop App (Primary)** | Electron wrapping React frontend | Native macOS experience for studio use |
| **Web App (Development)** | React 18 + TypeScript + TailwindCSS + Vite | Browser-based access at `localhost:5173` during development |
| **API Layer** | Express.js (port 3001) | Middleware between frontend and Python backend; serves static generated images |
| **Backend** | Python FastAPI (port 8000) | Prompt compilation (GPT), RAG retrieval (CLIP/SigLIP), image generation (Gemini via Nano Banana adapter) |

**Architecture:**
```
React Frontend (5173) --> Express API (3001) --> Python FastAPI (8000)
                               |                       |
                         Static images           Generation Pipeline
                                            (Style -> Prompt -> RAG -> Image Gen)
```

---

## Features List

### Style Selection & Management

The left panel (25% width) is the designer's style control center. The upper half houses the StyleSelector for browsing and selecting styles; the lower half houses the StyleManager for curating the style library itself. Style selection is mandatory before any generation can occur -- it determines all downstream retrieval and generation behavior.

- [ ] As a designer, I want to browse all available styles from my style library, so that I can choose the visual language for my concept sketches.
  - [ ] StyleSelector fetches styles from `GET /api/styles` on component mount
  - [ ] Each style card displays the style name and designer-authored description
  - [ ] Styles are rendered as a radio selection list; exactly one style is selected at a time
  - [ ] Selected style is visually highlighted (green border + green background tint, per SWAG design system)
  - [ ] Loading state displays "Loading styles..." while the API call is in flight
  - [ ] Error state displays a red error message if the styles endpoint fails

- [ ] As a designer, I want to select a style before generating, so that the system scopes all retrieval and generation to my chosen visual language.
  - [ ] Selecting a style sets `selectedStyleId` in application state
  - [ ] The ChatInput generate button is disabled until a style is selected
  - [ ] A warning message ("Please select a style first") appears below the generate button when no style is selected
  - [ ] Changing the selected style mid-session does not clear previously generated sketches
  - [ ] The selected style ID is included in every `POST /api/generate` request payload

- [ ] As a designer, I want to toggle experimental mode, so that I can opt into newer or less stable generation behaviors when I want to explore.
  - [ ] A checkbox labeled "Experimental Mode" appears at the bottom of the StyleSelector panel, below the style list
  - [ ] The toggle state (`experimentalMode`) is passed through to the generate request payload
  - [ ] Experimental mode is off by default
  - [ ] The toggle persists across generation cycles within a session but resets on page reload

- [ ] As a designer, I want to initialize a new style with or without reference images, so that I can expand my style library directly from the tool.
  - [ ] StyleManager provides an "Initialize New Style" action
  - [ ] The user can provide a style name, description, and visual rules (line weight, looseness, complexity)
  - [ ] The user can optionally upload one or more reference images during initialization
  - [ ] Uploaded images are moved to `rag/reference_images/` with UUID-based filenames
  - [ ] A `style.json` file is created in `style/style_library/{style_id}/`
  - [ ] The StyleSelector list refreshes after a new style is created

- [ ] As a designer, I want to add reference images to an existing style, so that I can enrich a style's visual vocabulary over time.
  - [ ] StyleManager provides an "Add Images" action scoped to the currently selected style
  - [ ] The user can upload one or more images via file picker
  - [ ] Duplicate images (already in the style's reference set) are detected and skipped
  - [ ] New images are moved to `rag/reference_images/` and added to the style's `reference_images` array in `style.json`
  - [ ] Embeddings are rebuilt for the affected style after images are added

- [ ] As a designer, I want to delete a style from my library, so that I can remove styles I no longer use.
  - [ ] StyleManager provides a "Delete Style" action
  - [ ] A confirmation dialog appears before deletion to prevent accidental removal
  - [ ] Deleting a style removes the `style/style_library/{style_id}/` directory and its `style.json`
  - [ ] Cached embeddings for the deleted style are also cleared
  - [ ] The StyleSelector list refreshes after deletion
  - [ ] If the deleted style was currently selected, the selection resets to null

---

### Concept Input

The center panel upper half (ChatInput / UserPromptInput) is where the designer describes what they want to see. The interface is deliberately minimal -- a text area and a generate button -- because the complexity lives in the backend pipeline (GPT prompt compilation, RAG retrieval, image generation), not in the input form.

- [ ] As a designer, I want to describe my concept sketch idea in natural language, so that the system can interpret my intent and generate matching visuals.
  - [ ] A multi-line text area accepts free-form text input
  - [ ] Placeholder text provides an example prompt: "Describe your concept sketch idea... Example: playful golf ball character with cartoonish features"
  - [ ] A live character count is displayed below the text area when input is non-empty
  - [ ] The text area is disabled while a generation is in progress

- [ ] As a designer, I want to click "Generate Sketches" to trigger the pipeline, so that I can see concept sketches based on my description and selected style.
  - [ ] The generate button sends a `POST /api/generate` request with `{ input, styleId, numImages: 4, experimentalMode }`
  - [ ] The button is disabled when: no style is selected, input is empty/whitespace-only, or a generation is already in progress
  - [ ] While generating, the button shows a spinning loader icon and the text "Generating..."
  - [ ] The pipeline flow is: Frontend -> Express -> FastAPI -> (Style lookup -> Prompt Compilation via GPT -> RAG Retrieval via CLIP/SigLIP -> Image Generation via Gemini/Nano Banana)
  - [ ] Generated images are saved to `generated_outputs/{timestamp}/` with individual sketch files and a `metadata.json`

- [ ] As a designer, I want to use Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit, so that I can generate sketches without reaching for the mouse.
  - [ ] The keyboard shortcut triggers the same `handleSubmit` function as the button click
  - [ ] The shortcut is only active when the text area is focused
  - [ ] The shortcut respects all the same disabled conditions as the button (no style, empty input, generation in progress)
  - [ ] A tip is displayed below the input area: "Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate"

---

### Feedback & Iteration

The center panel lower half (UserFeedbackInput) closes the loop between generation and refinement. After sketches are generated, the designer can provide text feedback describing what to change, then either regenerate (re-run the pipeline with feedback context folded in) or submit (accept the current batch and move on). This feedback-driven iteration is critical to the designer-in-the-loop philosophy.

- [ ] As a designer, I want to provide text feedback on generated sketches, so that I can guide the next iteration toward my vision.
  - [ ] A feedback text area appears in the lower half of the center panel after sketches are generated
  - [ ] The text area accepts free-form text describing desired changes (e.g., "make the character more aggressive, thicker lines, add smoke effect")
  - [ ] Feedback is contextual -- it is appended to the generation pipeline as additional guidance, not as a replacement for the original prompt
  - [ ] Previous feedback history is retained during the session so the system remembers cumulative direction

- [ ] As a designer, I want to click "Regenerate" to re-run generation with my feedback incorporated, so that I can iterate toward the right concept without starting over.
  - [ ] The regenerate button triggers a new `POST /api/generate` call with the original prompt, style, and the appended feedback context
  - [ ] The previous batch of sketches is replaced by the new generation results
  - [ ] The regenerate button is disabled while generation is in progress
  - [ ] Feedback context is passed through the full pipeline: GPT prompt compilation takes it into account, and the generation prompt is adjusted accordingly

- [ ] As a designer, I want to click "Submit" to accept the current batch of sketches, so that I can signal that the current direction is approved and ready for draw-over.
  - [ ] The submit button marks the current generation batch as accepted
  - [ ] Accepted sketches remain visible and downloadable
  - [ ] The feedback input area resets, preparing for a new concept cycle
  - [ ] The original prompt input remains available for a new concept description

---

### Sketch Display & Actions

The right panel (50% width, SketchGrid) is the output surface. Generated sketches are displayed in a 2x2 grid, each labeled with a number (1, 2, 3, 4). Every sketch has quick actions for download, regeneration, and flagging. The grid is designed for rapid visual comparison -- the designer glances across four variations and decides which direction to pursue.

- [ ] As a designer, I want to see my generated concept sketches in a 2x2 grid, so that I can visually compare multiple variations at once.
  - [ ] The SketchGrid renders sketches in a `grid-cols-2` layout with consistent spacing
  - [ ] Each sketch cell has a minimum height of 200px and a gray background placeholder
  - [ ] Images are loaded from `GET /api/generated/{timestamp}/{filename}` via the Express static file server
  - [ ] Images use `object-contain` sizing to preserve aspect ratio without cropping
  - [ ] The grid is scrollable if more than 4 sketches are generated

- [ ] As a designer, I want each sketch labeled with a number (1, 2, 3, 4), so that I can reference specific sketches during feedback and team discussion.
  - [ ] Each sketch card displays a numeric label corresponding to its position (derived from `sketch.id`)
  - [ ] Labels are visually distinct and always visible regardless of image content

- [ ] As a designer, I want to download any individual sketch, so that I can save it locally for draw-over work in my preferred design tool.
  - [ ] Each sketch card has a "Download" button
  - [ ] Clicking download fetches the image as a blob and triggers a browser save dialog
  - [ ] The downloaded file is named `sketch-{id}.png`
  - [ ] Download works for all image formats returned by the generation pipeline

- [ ] As a designer, I want a per-sketch regenerate button, so that I can re-roll a single sketch I am not satisfied with without losing the other three.
  - [ ] Each sketch card has a regenerate button (displayed as a circular arrow icon)
  - [ ] Clicking regenerate triggers re-generation for that specific sketch slot (MVP: logs to console; full implementation deferred to post-MVP)

- [ ] As a designer, I want a per-sketch flag button, so that I can mark a sketch for review or as a negative example.
  - [ ] Each sketch card has a flag button (displayed as a flag icon)
  - [ ] Clicking flag marks the sketch for review (MVP: logs to console; full implementation deferred to post-MVP)
  - [ ] Flagged sketches could feed into the "Do Not Use" reference system in future iterations

- [ ] As a designer, I want to see a loading state while sketches are being generated, so that I know the system is working and I should wait.
  - [ ] A spinning loader animation and "Generating sketches..." message replace the grid content during generation
  - [ ] A subtitle "This may take a few moments" sets expectations for generation time
  - [ ] The loading state is shown for the entire duration of the `POST /api/generate` call

- [ ] As a designer, I want to see a clear error message if generation fails, so that I can understand what went wrong and take corrective action.
  - [ ] An error icon and "Generation Failed" heading are displayed when the API returns an error
  - [ ] The specific error message from the API response is shown below the heading
  - [ ] The error state does not prevent the designer from modifying their prompt and retrying

- [ ] As a designer, I want to see an empty state before my first generation, so that I understand the grid is ready and waiting for input.
  - [ ] A placeholder icon, "No sketches yet" heading, and "Generate your first concept sketch" subtitle are displayed when no sketches exist
  - [ ] The empty state is replaced immediately when generation begins (transitions to loading state)

---

### UX/UI Considerations

The interface is structured as a three-panel layout that maps directly to the designer's mental workflow: choose a style (left), describe a concept (center), review output (right). Every design decision prioritizes speed, clarity, and designer control.

- [ ] As a designer, I want a three-panel layout (style | input | output) that mirrors my workflow, so that I can move through the concept cycle without context-switching.
  - [ ] The layout uses a `grid-cols-[25%_25%_50%]` grid, giving the output panel the most screen real estate
  - [ ] All three panels are visible simultaneously -- no tabs, no hidden panels, no modals for core workflow
  - [ ] Each panel has its own scroll context to prevent one panel's content from affecting another
  - [ ] Panels are styled as dark elevated surfaces with subtle borders for visual separation (per SWAG design system)

- [ ] As a designer, I want a persistent header with the product name, so that the tool feels like a coherent internal product.
  - [ ] The header displays "SWAG CONCEPT SKETCH AGENT" in the display font with SWAG Green accent
  - [ ] A subtitle reads "AI-powered design assistant for concept sketching" in secondary text color
  - [ ] The header is fixed at the top and does not scroll with panel content

- [ ] As a designer, I want visual feedback for all interactive states (hover, active, disabled, loading), so that the interface feels responsive and I always know what is clickable.
  - [ ] Buttons show hover states (green glow), active states (darker green), and disabled states (gray, cursor-not-allowed)
  - [ ] Style cards show hover states (border color change) and selected states (green border + background tint)
  - [ ] The generate button transitions between three visual states: ready (green), generating (green + spinner), and disabled (gray)
  - [ ] All transitions use the SWAG transition timing functions for smooth animation

- [ ] As a designer, I want the application to run as a native desktop app via Electron, so that I can launch it from my dock and use it alongside my design tools without a browser tab.
  - [ ] The Electron wrapper packages the React frontend as a native macOS application
  - [ ] The app connects to the same Express API (port 3001) and Python backend (port 8000)
  - [ ] All services (Python API, Express API, Frontend, Electron) start from a single `start-dev.sh` script

- [ ] As a designer, I want generated output to be black-and-white, rough sketch style only, so that the output is appropriate for draw-over and does not look like finished art.
  - [ ] The generation pipeline enforces: grayscale only, no color, no gradients, no textures, no photorealism
  - [ ] Output resembles thick-outline, loose-ink, pencil-quality sketches
  - [ ] Clean backgrounds with no clutter
  - [ ] Default resolution is 1024x1024
  - [ ] No typography unless explicitly requested by the designer in their prompt

- [ ] As a designer, I want generation metadata saved alongside output images, so that I can trace back how any sketch was produced and reproduce it.
  - [ ] Each generation batch saves a `metadata.json` in the timestamped output directory
  - [ ] Metadata includes: timestamp, prompt spec (intent + refined intent), reference images used, retrieval scores, style ID, generation config (num_images, resolution, model_name, seed)
  - [ ] Image filenames follow the `sketch_{index}.png` convention
  - [ ] Timestamped directories (`generated_outputs/{YYYYMMDD_HHMMSS}/`) prevent output overwriting

---

## API Contract Summary (MVP)

| Endpoint | Method | Request | Response | Purpose |
|----------|--------|---------|----------|---------|
| `/api/health` | GET | -- | `{ status, pythonBackend, version, mode }` | Health check with backend connectivity status |
| `/api/styles` | GET | -- | `{ success, styles: Style[] }` | Fetch all styles from the style library |
| `/api/generate` | POST | `{ input, styleId, numImages?, experimentalMode? }` | `{ success, data: { timestamp, sketches, generationMetadata }, error? }` | Run the full generation pipeline |
| `/api/generated/*` | GET | -- | Static image file | Serve generated sketch images |

---

## Out of Scope for MVP

The following are explicitly deferred to post-MVP iterations:

- Per-sketch individual regeneration (button exists, logs to console only)
- Per-sketch flagging and "Do Not Use" feedback loop (button exists, logs to console only)
- Multi-turn automated style refinement (proposal exists in `proposal_sketch_style.md`)
- Batch export / ZIP download of all sketches
- User authentication and multi-designer support
- Cloud deployment (currently local-only)
- Versioned generation history / session persistence across reloads
- Direct integration with design tools (Figma, Photoshop plugins)
- Mobile or tablet support
- Analytics and usage tracking

</app-overview>

<task>
- Follow the design principles above to ensure design accuracy
- Design 2 web layout variations for each Feature area described in the PRD (this is a desktop-only web application; no mobile designs needed)
- Features should be arranged vertically; layout variations should be arranged horizontally for easy side-by-side comparison
- The Feature areas to design are:
  1. **MainLayout** -- The overall three-panel layout (style | input | output) with persistent header
  2. **StyleSelector + StyleManager** (Left Panel) -- Style browsing, selection, experimental mode toggle, and style CRUD operations
  3. **ChatInput + UserFeedbackInput** (Center Panel) -- Concept description input, generate button, feedback textarea, regenerate/submit buttons
  4. **SketchGrid** (Right Panel) -- 2x2 sketch output grid with per-sketch actions, loading/error/empty states
- Each layout variation should be implemented as a separate component at `[VariationName]/pages/[PageName].tsx`, with a brief description for easy reference
- All variations are assembled into a single showcase page for review
- Respect the existing component architecture:
  - `Layout/MainLayout.tsx`
  - `LeftPanel/StyleSelector.tsx` (includes StyleManager section)
  - `CenterPanel/ChatInput.tsx` (includes UserFeedbackInput section)
  - `RightPanel/SketchGrid.tsx`

</task>

<output>
Place your output into the existing React project at `control/frontend/`. Ensure the design showcase page is properly routed and accessible. All components should use TypeScript (.tsx), Tailwind CSS with the SWAG Golf design tokens, and Lucide React icons.
</output>
</context>
