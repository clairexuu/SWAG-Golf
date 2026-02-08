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
