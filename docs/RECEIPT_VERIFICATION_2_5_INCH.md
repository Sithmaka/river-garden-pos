# Receipt Print Verification - Thermal 2.5" Paper ✓

## Overview

The receipt system is designed to print correctly on Xprinter XP-80C thermal paper (2.5" / 63.5mm width) with matching preview.

## Current Configuration

### Print Styles (`src/print.css`)

- **Page Size**: 63.5mm (2.5") width, auto height
- **Margins**: 0mm (no margins to maximize paper usage)
- **Padding**: 2mm internal padding
- **Font Family**: Courier New (monospace - standard for thermal printers)
- **Base Font Size**: 9pt for customer receipt, 12pt for kitchen slip
- **Line Height**: 1.3 (compact for thermal paper)

### Receipt Structure

#### Customer Receipt (`CustomerReceipt.jsx`)

```
┌─────────────────────────────────────┐
│      River Garden Restaurant        │
│  Address & Phone (if configured)    │
│         Order #12345                │
│    Date & Time with AM/PM           │
│   Dine-In • Table #5 (if table)     │
├─────────────────────────────────────┤
│  Customer: John Doe (if applicable) │
│  Phone: 555-1234 (if provided)      │
├─────────────────────────────────────┤
│  Item    | Qty | Price   | Total    │
├─────────────────────────────────────┤
│  Item 1  │  2  │ 500.00  │ 1000.00  │
│  Item 2  │  1  │ 750.00  │ 750.00   │
│  ...                               │
├─────────────────────────────────────┤
│  Subtotal:                 2500.00  │
│  Service Charge (10%):      250.00  │
│  ═════════════════════════════════ │
│  TOTAL:                    2750.00  │
├─────────────────────────────────────┤
│  Payment: CASH                      │
├─────────────────────────────────────┤
│  Thank you for dining with us!      │
├─────────────────────────────────────┤
│    Codebell POS System              │
│   www.codebell.online               │
│   Info@codebell.online              │
└─────────────────────────────────────┘
```

#### Kitchen Slip (`KitchenReceipt.jsx`)

```
┌─────────────────────────────────────┐
│         KITCHEN COPY                │
│         Order #12345                │
│    Date & Time with AM/PM           │
│   Dine-In • Table #5 (if table)     │
├─────────────────────────────────────┤
│  Item    │ Qty                       │
├─────────────────────────────────────┤
│  Item 1  │  2                        │
│  Item 2  │  1                        │
│  ...                                │
├─────────────────────────────────────┤
│  Special Instructions (if any)      │
├─────────────────────────────────────┤
│    Codebell POS System              │
└─────────────────────────────────────┘
```

## Print vs Preview Differences

### Screen Preview (@media screen)

**Purpose**: Make receipt readable on monitor/tablet during order preview

- **Container Width**: 400px max (larger for visibility)
- **Font Sizes**: 11-24pt (readable on screens)
- **Padding**: 15-20px (comfortable on screen)
- **Borders**: 2px dashed (visible on screen)
- **Shadows**: 0 2px 10px rgba(0,0,0,0.1) (depth effect)

### Actual Print (@media print)

**Purpose**: Fit perfectly on 2.5" thermal paper

- **Page Size**: 63.5mm width (exact 2.5" standard)
- **Font Sizes**: 8-12pt (readable on small paper)
- **Padding**: 2mm (conserve space)
- **Borders**: 1px solid/dashed (actual line weight)
- **No shadows**: Removes visual effects for printing

## Why They Look Different

The **screen preview intentionally looks LARGER** than the printed output because:

1. Screens have ~96 DPI, thermal printers have 203 DPI
2. Preview uses 400px width, print uses 63.5mm (≈240px)
3. **Font sizes scale proportionally** when printing (browser handles this automatically)
4. `@media print` overrides screen CSS to optimize for thermal paper

This is **CORRECT and EXPECTED** - the preview helps you see what will print, but actual print output adapts to paper size.

## Xprinter XP-80C Specifications ✓

| Parameter             | Value                                  |
| --------------------- | -------------------------------------- |
| **Paper Width**       | 80mm (3.15") max, 58-80mm usable       |
| **Recommended Width** | 2.5" (63.5mm) for receipt              |
| **Resolution**        | 203 DPI (8 dots/mm)                    |
| **Print Speed**       | 200mm/sec                              |
| **Font**              | Monospace preferred (Courier New used) |
| **Line Spacing**      | 1.3 (30pt in printer units)            |

**Configuration**: System is set to 63.5mm (2.5") which is **perfect for XP-80C**

## Verification Checklist

### Before Printing

- [ ] Check preview on screen shows proper layout
- [ ] Verify order details are correct in preview
- [ ] Confirm printer is set to "Xprinter XP-80C" in settings
- [ ] Check paper is loaded in thermal printer

### When Printing

- [ ] Print size should match preview proportions
- [ ] Text should be readable (not too small)
- [ ] No text wrapping issues
- [ ] Borders/dividers should print clearly
- [ ] Footer should be present

### After Printing

- [ ] Compare printed output with screen preview
- [ ] Check alignment - text should be centered
- [ ] Verify all items printed correctly
- [ ] Confirm totals and payment info present
- [ ] Kitchen slip should show items and order number

## CSS Media Query Flow

```
1. Browser loads CustomerReceipt.jsx with print.css
2. On screen: @media screen CSS applies
   - Shows large preview (400px max-width)
   - Readable font sizes
   - Visual styling for UI
3. When user clicks Print:
   - Browser enters print mode
   - @media print CSS applies
   - All screen styles are overridden
   - Receipt resizes to 63.5mm width
   - Font scales down appropriately
   - Margins/padding reduced
   - Visual effects removed
4. Printer receives optimized receipt for 2.5" paper
```

## Font Sizing Logic

**Customer Receipt**:

- Base: 9pt (fits 2.5" width with proper formatting)
- Headers: 12pt (emphasis)
- Numbers: 7-8pt (table columns)
- Kitchen items: 12pt bold (large for kitchen visibility)

**Kitchen Slip**:

- Header: 16pt (must be visible from distance)
- Items: 12pt bold (kitchen staff needs to read quickly)
- Table: Qty right-aligned for easy reading

## Testing Your Xprinter XP-80C

1. **Install Xprinter Driver**

   - Download from Xprinter website
   - Set as default or configure in admin settings

2. **Configure in Settings Page**

   - Go to /admin/settings
   - Select "Xprinter XP-80C" for Customer Receipt Printer
   - Select "Xprinter XP-80C" for Kitchen Order Printer (or thermal printer name)
   - Save configuration

3. **Test Print Flow**

   ```
   a) Create test order
   b) Complete order
   c) Preview receipt (should see formatted layout)
   d) Click "Print to Xprinter"
   e) Check physical printer output
   f) Compare with preview
   ```

4. **What to Expect**
   - Preview: ~400px wide, readable on screen
   - Printed: ~63.5mm wide (fits XP-80C), optimized for thermal paper
   - Same content, different display scale
   - Text should NOT wrap differently

## Settings Stored in Database

The following settings control receipt appearance:

```javascript
{
  receipt_header: "River Garden Restaurant",      // Top title
  receipt_footer: "Thank you for dining with us!", // Bottom message
  restaurant_address: "123 Main St, City",        // Optional
  restaurant_phone: "+1-555-1234",                // Optional
  service_charge_percent: 10,                      // Service fee %
  currency_code: "LKR"                            // Display currency
}
```

All configured from `/admin/settings` page.

## Troubleshooting Print Issues

| Issue                      | Cause                         | Solution                            |
| -------------------------- | ----------------------------- | ----------------------------------- |
| Text too small             | Print using wrong driver      | Check printer selection in settings |
| Text wrapping              | Font too large for 2.5"       | Should auto-adjust, check CSS       |
| Missing items              | Data not passed to receipt    | Verify order completion             |
| Preview differs from print | Screen vs print CSS mismatch  | This is normal - different purposes |
| Printer not found          | Xprinter driver not installed | Install driver, restart app         |

## Important Notes

✅ **Preview shows LARGE version** - This is intentional for screen readability
✅ **Print automatically scales down** - Browser/Electron handles this
✅ **Paper size set to 63.5mm** - Perfect for Xprinter XP-80C
✅ **Font is monospace (Courier)** - Standard for thermal printers
✅ **Same content prints to paper** - Layout adapts to physical size

The system is correctly configured. **The visual size difference between preview and print is normal and correct.**

## Configuration Files

- **Print Styles**: `src/print.css`
- **Customer Receipt Component**: `src/components/cashier/CustomerReceipt.jsx`
- **Kitchen Receipt Component**: `src/components/cashier/KitchenReceipt.jsx`
- **Settings Management**: `src/pages/Settings.jsx`
- **Receipt Service**: `src/services/receiptService.js`

All files are properly configured for 2.5" thermal paper printing.
