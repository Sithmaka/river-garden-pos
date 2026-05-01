# Admin Dashboard Print Feature - Documentation

## Overview

The Admin Dashboard now includes a comprehensive **Print Report** feature that allows administrators to print daily, weekly, or monthly sales reports directly from the dashboard. Reports are formatted as professional receipts using the existing receipt printing system.

---

## Features

### 1. **Multi-Period Print Support**

- Print Daily Sales Report (7 days of data)
- Print Weekly Sales Report (4 weeks of data)
- Print Monthly Sales Report (12 months of data)
- Report automatically adapts based on selected view

### 2. **Detailed Report Contents**

Each printed report includes:

- **Report Type**: Daily/Weekly/Monthly label
- **Period Coverage**: All periods included in the current view
- **Items Sold**: Complete list of top-selling items
  - Item name
  - Quantity sold
  - Unit price
  - Line total
- **Financial Summary**:
  - Subtotal (sales minus service charges)
  - Service charge breakdown (if applicable)
  - Total sales amount
- **Report Header**: Restaurant name and date
- **Report Footer**: "Daily/Weekly/Monthly Sales Summary Report"

### 3. **Professional Formatting**

- Uses the unified receipt printing system
- Thermal printer optimized (72mm width)
- Clean, professional layout
- Consistent with existing receipt design
- Perfect for filing or email distribution

### 4. **Print Preview Modal**

- Visual preview before printing
- Shows exactly what will be printed
- "Cancel" button to close without printing
- "Print Now" button to open browser print dialog
- Responsive design for all screen sizes

### 5. **User-Friendly Controls**

- Green "🖨️ Print Report" button in the analytics section
- Button disabled when:
  - No data available
  - Data is still loading
  - Print is being prepared
- Loading indicator shows status
- Clear button text with emoji icon

---

## How to Use

### Step 1: Select Time Period

Click one of the view selector buttons:

- **Daily** - Last 7 days
- **Weekly** - Last 4 weeks
- **Monthly** - Last 12 months

### Step 2: View the Analytics

Review the sales chart, statistics, and item breakdown to verify the data looks correct.

### Step 3: Click Print Report

Click the green **🖨️ Print Report** button in the top-right area of the Sales Summary section.

### Step 4: Preview the Report

The print preview modal will open showing:

- Formatted sales report
- All items and totals
- Professional receipt layout

### Step 5: Choose Action

- **Cancel**: Close the preview without printing
- **Print Now**: Open the browser print dialog

### Step 6: Complete Printing

In the browser print dialog:

1. Select your printer
2. Adjust print settings if needed
3. Click **Print**

---

## Technical Implementation

### New Function: `handlePrintReport()`

Located in `AdminDashboard.jsx`, this function:

```javascript
const handlePrintReport = async () => {
  // Validates data availability
  // Prepares receipt data structure
  // Aggregates sales information
  // Formats items with pricing
  // Generates HTML using ReceiptGeneratorService
  // Sets print preview state
};
```

### Key Components

**1. Data Preparation**

- Extracts current period label
- Calculates total sales
- Counts total orders
- Aggregates service charges
- Formats item list

**2. Receipt Generation**

- Uses existing `ReceiptGeneratorService`
- Calls `generateCustomerReceipt()` method
- Provides settings (header, footer, currency)
- Returns complete HTML with CSS

**3. Print Preview Modal**

- Fixed positioning overlay
- Scrollable receipt preview
- Action buttons (Cancel/Print)
- Responsive sizing

### Related Code Files

- `src/pages/AdminDashboard.jsx` - Main component with print logic
- `src/services/receiptGeneratorService.js` - Receipt generation
- `src/print.css` - Thermal printing styles
- `src/utils/formatting.js` - Currency formatting

---

## Report Structure

### Receipt Header

```
🌳 River Garden Resort
Order #SALES-DAILY-[timestamp]
[Current Date & Time]
Daily Sales Report - [Period Coverage]
```

### Items Table

```
Item Name          Qty    Price        Total
─────────────────────────────────────────
Fried Rice         45     Rs. 400.00   Rs. 18,000.00
Noodles            38     Rs. 400.00   Rs. 15,200.00
Grilled Chicken    32     Rs. 800.00   Rs. 25,600.00
... (more items)
```

### Financial Summary

```
Subtotal:        Rs. XX,XXX.00
Service Charge:  Rs. X,XXX.00
─────────────────────────────────────
TOTAL:           Rs. XX,XXX.00
```

### Receipt Footer

```
Daily Sales Summary Report
Codebell POS System
www.codebell.online
Info@codebell.online
```

---

## Features by View Type

### Daily Report

- **Data**: Last 7 days
- **Group**: By individual day
- **Purpose**: Daily performance tracking
- **Use Case**: Daily manager briefing, daily reconciliation

### Weekly Report

- **Data**: Last 4 weeks
- **Group**: By week (Monday-Sunday)
- **Purpose**: Weekly trend analysis
- **Use Case**: Weekly staff meeting, weekly financial review

### Monthly Report

- **Data**: Last 12 months
- **Group**: By calendar month
- **Purpose**: Annual performance review
- **Use Case**: Monthly financial reporting, year-end analysis

---

## Print Workflow

```
User Clicks
"Print Report"
    ↓
handlePrintReport()
Called
    ↓
Validates Data
Available
    ↓
Prepares Receipt
Data Structure
    ↓
Calls Receipt
GeneratorService
    ↓
Generates HTML
with CSS
    ↓
Sets Print
Preview State
    ↓
Modal Opens
with Preview
    ↓
User Reviews
(Preview or Cancel)
    ↓
├─ Cancel: Close modal
│
└─ Print Now: Open browser print dialog
    ↓
Printer Selected
    ↓
Browser Print
CSS Applied
    ↓
Receipt Printed
(72mm thermal)
```

---

## Styling & Appearance

### Print Button

- **Color**: Emerald green (#059669)
- **Size**: Medium button
- **Icon**: 🖨️ Printer emoji
- **State**: Disabled when loading or no data
- **Hover**: Darker emerald on hover

### Preview Modal

- **Size**: 90% of viewport height, 2xl width
- **Background**: Transparent dark overlay
- **Header**: White with border, title and close button
- **Content**: Scrollable receipt preview
- **Footer**: Action buttons (Cancel/Print)
- **Style**: Professional, clean design

### Receipt Preview

- **Background**: White with padding
- **Font**: Courier New (monospace)
- **Width**: Simulates 72mm thermal paper
- **Formatting**: Matches printed receipt exactly

---

## Performance Considerations

### Data Optimization

- No additional database queries
- Uses existing summary data
- Fast preparation time
- Minimal memory usage

### UI Responsiveness

- Print button doesn't block interactions
- Modal is non-blocking
- Preview loads instantly
- Print dialog opens immediately

### Browser Support

- Works on all modern browsers
- Uses standard print API
- CSS print media queries
- No special plugins needed

---

## Error Handling

### Validation

- Checks if data is available
- Validates summary data length
- Handles missing items gracefully

### Error Messages

- "No data available to print" - No sales in selected period
- "Error generating report" - Service generation failed

### Recovery

- User can retry by clicking button again
- Can select different period
- Modal closes on error

---

## Customization Options

### To Change Report Header

Edit `handlePrintReport()` function:

```javascript
receipt_header: '🌳 Your Restaurant Name',
```

### To Change Report Footer

```javascript
receipt_footer: `${periodLabel} Sales Summary Report`,
```

### To Change Currency

```javascript
currency_code: 'USD', // or 'LKR'
```

### To Change Report Format

Edit `ReceiptGeneratorService.generateCustomerReceipt()` method in `src/services/receiptGeneratorService.js`

---

## Printer Compatibility

### Recommended Printers

- Xprinter XP-80C (72mm thermal)
- Xprinter XP-N160II
- Other 72mm thermal printers

### Print Settings

- **Paper Size**: 72mm (automatic)
- **Margins**: None (automatic)
- **Orientation**: Portrait
- **Scale**: Fit to page

### Quality Notes

- Thermal printers: Perfect output
- Inkjet printers: Good output
- Laser printers: Good output
- PDF printer: Creates PDF file

---

## Troubleshooting

### Button is Disabled

**Reason**: No data available or still loading
**Solution**:

- Ensure you have sales data for the selected period
- Wait for data to load
- Try a different time period

### Print Preview Not Showing

**Reason**: Data generation failed
**Solution**:

- Check browser console for errors
- Verify Supabase connection
- Try again with different period

### Printed Receipt Looks Wrong

**Reason**: Printer settings not optimal
**Solution**:

- Use recommended printer
- Check print settings in browser dialog
- Ensure 72mm paper width
- Check thermal printer alignment

### Wrong Data in Report

**Reason**: Data not synchronized
**Solution**:

- Refresh the dashboard
- Verify data in database
- Check date range selection

---

## Security & Privacy

### Data Handling

- No sensitive customer data printed
- Report shows only aggregated data
- Items and totals are safe to display
- No personal information included

### Print Security

- Local printing only
- No cloud transmission
- Browser print dialog used
- User controls where data goes

---

## Future Enhancements

### Potential Features

1. **Export to PDF** - Save reports as PDF files
2. **Email Reports** - Send reports via email
3. **Custom Date Range** - Select specific date ranges
4. **Report Filters** - Filter by category or item type
5. **Comparison Reports** - Compare two periods side-by-side
6. **Email Integration** - Automated daily/weekly/monthly reports
7. **Archive Reports** - Store printed reports in database
8. **Custom Templates** - Multiple report formats

### Roadmap

- Phase 2: PDF export functionality
- Phase 3: Email distribution
- Phase 4: Custom date ranges
- Phase 5: Report archive system

---

## FAQ

**Q: Can I print a custom date range?**
A: Not yet. Currently supports Daily (7 days), Weekly (4 weeks), Monthly (12 months). Custom ranges coming in future updates.

**Q: Does printing include all items or just top 10?**
A: The report includes the top 10 best-selling items to keep the receipt compact and readable.

**Q: Can I email the report instead of printing?**
A: Not in this version. Email distribution is planned for a future release.

**Q: What if the report is very long?**
A: Reports fit on thermal paper. Multiple thermal rolls may be needed for monthly reports with many items.

**Q: Can I modify the report format?**
A: Yes, see "Customization Options" section above.

**Q: Does it work with all printers?**
A: Yes, it uses the browser print dialog. Works with any printer you can print to from the browser.

**Q: Can I save the report as PDF?**
A: Yes, use "Print to PDF" from the browser print dialog.

---

## Support Resources

### Related Documentation

- `ADMIN_DASHBOARD_ENHANCEMENTS.md` - Dashboard features overview
- `ADMIN_DASHBOARD_VISUAL_GUIDE.md` - Dashboard layout guide
- `UNIFIED_RECEIPT_TECHNICAL_REFERENCE.md` - Receipt printing system
- `RECEIPT_VERIFICATION_2_5_INCH.md` - Thermal printer specifications

### Code Files

- `src/pages/AdminDashboard.jsx` - Print implementation
- `src/services/receiptGeneratorService.js` - Receipt generation
- `src/print.css` - Print styling

---

## Version History

| Version | Date        | Changes                                                             |
| ------- | ----------- | ------------------------------------------------------------------- |
| 1.0     | Jan 2, 2026 | Initial release with print support for daily/weekly/monthly reports |

---

**Last Updated:** January 2, 2026  
**Status:** ✅ Production Ready  
**Feature:** Print Sales Reports - Daily/Weekly/Monthly
