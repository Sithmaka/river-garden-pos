# Admin Dashboard - Visual Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DASHBOARD HEADER                             │
│                  Welcome & System Status                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  QUICK NAVIGATION CARDS (Menu, Settings, Users, Orders)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               📊 SALES SUMMARY & ANALYTICS                       │
│                                                                   │
│  [ Daily ] [ Weekly ] [ Monthly ]  ← View Toggle Buttons        │
│                                                                   │
│  SALES TREND CHART (Visual Bar Chart)                            │
│  ▓▓▓   ▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓▓▓▓▓ ▓▓▓  ← Bars with hover info   │
│  Mon   Tue   Wed    Thu   Fri    Sat  Sun                        │
│                                                                   │
│  SUMMARY STATISTICS (4-Column Grid)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Sales    │ │ Orders   │ │ Service  │ │ Avg      │            │
│  │ Rs.XXX   │ │ 150      │ │ Rs.XXX   │ │ Rs.XXX   │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│  💳 SERVICE CHARGE COLLECTION                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ 10% Service Charge   │  │ 15% Service Charge   │             │
│  │ Rs. 5,000 (50 orders)│  │ Rs. 3,000 (30 orders)│             │
│  └──────────────────────┘  └──────────────────────┘             │
│  ┌───────────────────────────────────────────────┐              │
│  │ Total Service Charge Collected: Rs. 8,000     │              │
│  └───────────────────────────────────────────────┘              │
│                                                                   │
│  🍽️ TOP ITEMS SOLD                                              │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Item Name        │ Qty Sold │ Revenue          │            │
│  ├─────────────────────────────────────────────────┤            │
│  │ Fried Rice       │   45     │ Rs. 18,000       │            │
│  │ Noodles          │   38     │ Rs. 15,200       │            │
│  │ Grilled Chicken  │   32     │ Rs. 25,600       │            │
│  │ ...              │ ...      │ ...              │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Features in Detail

### 1. View Toggle Buttons

```
Active State:   [ Daily ▓]  [ Weekly ]  [ Monthly ]
Inactive State: [ Daily ]  [ Weekly ]  [ Monthly ]
```

Click to switch between:

- **Daily** → Shows last 7 days
- **Weekly** → Shows last 4 weeks
- **Monthly** → Shows last 12 months

### 2. Sales Trend Chart

```
Y-Axis: Sales Amount (Auto-scaled)
X-Axis: Time Periods (Daily/Weekly/Monthly)

Hover on Bar Shows:
┌─────────────────┐
│ 42 orders       │ ← Number of orders
│ Charge: Rs.4200 │ ← Service charge amount
└─────────────────┘
```

### 3. Summary Statistics Grid

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Total      │  │    Total     │  │   Service    │  │     Avg      │
│   Sales      │  │    Orders    │  │    Charge    │  │  Order Value │
│              │  │              │  │              │  │              │
│ Rs. 50,000   │  │    345       │  │  Rs. 8,000   │  │  Rs. 145     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
  Teal Theme       Blue Theme       Emerald Theme     Amber Theme
```

### 4. Service Charge Collection

```
By Rate Breakdown:
┌─────────────────────┐  ┌─────────────────────┐
│ 10% Service Charge  │  │ 15% Service Charge  │
│                     │  │                     │
│ 50 orders          │  │ 30 orders          │
│ Rs. 5,000          │  │ Rs. 3,000          │
└─────────────────────┘  └─────────────────────┘

Total Summary:
┌───────────────────────────────────────────┐
│ Total Service Charge Collected: Rs. 8,000 │
└───────────────────────────────────────────┘
```

### 5. Top Items Table

```
Columns:
1. Item Name          - Name of the menu item
2. Quantity Sold      - Units sold (in badge)
3. Revenue           - Total earnings from item

Example Row:
┌──────────────────┬─────────────┬──────────────────┐
│ Fried Rice       │ ⓗ 45        │ Rs. 18,000       │
└──────────────────┴─────────────┴──────────────────┘

Default: Top 10 items by quantity sold
```

## Color Scheme

- **Teal** (#14b8a6) - Primary action buttons, main charts
- **Emerald** (#059669) - Service charge related items
- **Blue** (#3b82f6) - Order count statistics
- **Amber** (#d97706) - Average values
- **Cyan** (#06b6d4) - Hover states and accents
- **Gray** (#6b7280) - Text and secondary info

## Responsive Behavior

### Desktop (1024px+)

- 4-column statistics grid
- All controls visible
- Full-width chart

### Tablet (768px - 1023px)

- 2-column statistics grid
- Service charge cards in 2 columns
- Scrollable chart if needed

### Mobile (< 768px)

- 2-column statistics grid
- Service charge cards stack vertically
- Toggle buttons wrap or resize
- Horizontal scroll for table

## Data Refresh

- Data automatically fetches when component mounts
- Refetch occurs when view (Daily/Weekly/Monthly) changes
- Loading spinner displays during fetch
- Error states handled gracefully

## Time Periods Explained

### Daily View

- Shows: Last 7 calendar days
- Format: Mon, Jan 2
- Best for: Daily performance tracking
- Use case: Identify peak days

### Weekly View

- Shows: Last 4 complete weeks
- Format: Jan 1 - Jan 7 (week range)
- Best for: Weekly trend analysis
- Use case: Compare week-over-week performance

### Monthly View

- Shows: Last 12 calendar months
- Format: January 2025
- Best for: Long-term trend analysis
- Use case: Annual performance review, growth patterns

## Interaction Tips

1. **Hover on Chart Bars** → See order count and service charge
2. **Click View Buttons** → Switch between Daily/Weekly/Monthly
3. **Scroll Table Right** → See all columns on small screens
4. **Check Color Coding** → Different colors for different metrics

## Data Insights

### What This Dashboard Shows

- When you make the most sales
- Which items are popular
- How much service charge is collected
- Average transaction value
- Order distribution across time

### Business Decisions

- Identify peak hours/days for staffing
- Determine which items to stock more
- Analyze service charge effectiveness
- Plan promotions based on trends
- Monitor revenue growth
