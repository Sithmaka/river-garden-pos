# Sales Reports - Dine-In vs Take-Away Breakdown

## 📊 Overview

The Admin Dashboard now displays detailed sales reports with complete breakdown of dine-in and take-away sales across all three time periods: Daily, Weekly, and Monthly.

---

## 🎯 Features

### 1. **Separate Dine-In & Take-Away Tracking**

All sales are now automatically categorized and displayed separately:

- **🍽️ Dine-In Sales** - Orders served at restaurant tables
- **🛍️ Take-Away Sales** - Orders packaged for customer pickup

### 2. **Dashboard Display**

The Sales Summary section shows two new cards below the overall statistics:

```
┌─────────────────────────────────────────────────────┐
│         Dine-In vs Take-Away                         │
├────────────────────────┬────────────────────────────┤
│ 🍽️ Dine-In            │ 🛍️ Take-Away              │
│ 25 orders             │ 18 orders                 │
│ Rs. 45,600.00         │ Rs. 28,900.00             │
└────────────────────────┴────────────────────────────┘
```

Each card displays:

- Category icon and name
- Order count for that category
- Total sales revenue

### 3. **Statistics Captured**

For each time period (daily/weekly/monthly), the following data is tracked:

| Metric         | Dine-In | Take-Away | Total |
| -------------- | ------- | --------- | ----- |
| Sales Amount   | ✅      | ✅        | ✅    |
| Order Count    | ✅      | ✅        | ✅    |
| Service Charge | ✅      | ✅        | ✅    |
| Top Items      | ✅      | ✅        | ✅    |

---

## 🖨️ Print Reports

### What's Included

When you print a sales report, it includes:

✅ **Report Header**

- Restaurant name
- Report type (Daily/Weekly/Monthly)
- Date range

✅ **Sales Items**

- Item names
- Quantities sold
- Unit prices
- Line totals

✅ **Financial Summary**

- Subtotal (excluding service charge)
- **Total Service Charge Amount** ⭐ NEW
- Grand total
- Service charge breakdown by percentage

✅ **Report Information**

- Order counts (dine-in and take-away combined)
- Average order value
- Report generation timestamp

### Print Format Example

```
╔════════════════════════════════════════╗
║    🌳 River Garden Resort              ║
║    Daily Sales Report                  ║
║    Jan 2, 2026                         ║
╠════════════════════════════════════════╣
║ Item          │ Qty │ Price  │ Total  ║
╠════════════════════════════════════════╣
║ Fried Rice    │ 25  │ 400.00 │ 10,000 ║
║ Noodles       │ 18  │ 400.00 │  7,200 ║
║ Grilled Chick │ 14  │ 800.00 │ 11,200 ║
║ ... more items ...                    ║
╠════════════════════════════════════════╣
║ Subtotal:           Rs. 40,000.00     ║
║ Service Charge:     Rs.  8,000.00  ⭐ ║
║ ────────────────────────────────────  ║
║ TOTAL:              Rs. 48,000.00     ║
╠════════════════════════════════════════╣
║ Service Charge Breakdown:              ║
║ 10% - 5 orders - Rs. 2,000.00          ║
║ 20% - 8 orders - Rs. 6,000.00          ║
╚════════════════════════════════════════╝
```

---

## 📈 Data Flow

### How Orders Are Categorized

1. **During Order Entry**

   - Staff selects order type: Dine-In or Take-Away
   - Order saved with `order_type` field

2. **During Report Generation**

   - Dashboard fetches all paid orders
   - Orders filtered and aggregated by:
     - Time period (Daily/Weekly/Monthly)
     - Order type (Dine-In/Take-Away)
   - Service charges only applied to dine-in orders

3. **Display & Printing**
   - Dashboard shows both categories with totals
   - Print report includes complete breakdown
   - Service charge amount clearly displayed

---

## 🎨 UI Components

### Summary Stats Cards

**Before**: 4 cards (Total Sales, Total Orders, Service Charge, Avg Order Value)

**After**: 6 cards (above 4 + Dine-In and Take-Away cards)

The new cards appear in a dedicated "Dine-In vs Take-Away" section with:

- Blue color scheme for Dine-In 🍽️
- Orange color scheme for Take-Away 🛍️
- Order count badges
- Currency formatting

### Visual Hierarchy

```
Sales Summary & Analytics
├── Sales Chart
├── Overall Stats (4 cards)
│   ├── Total Sales
│   ├── Total Orders
│   ├── Service Charge
│   └── Avg Order Value
├── 🆕 Dine-In vs Take-Away (2 cards)
│   ├── 🍽️ Dine-In
│   └── 🛍️ Take-Away
├── Service Charge Collection
└── Top Items Sold
```

---

## 💡 Use Cases

### Use Case 1: Daily Sales Analysis

"What was our dine-in vs take-away performance today?"

- Select **Daily** view
- See dine-in and take-away totals
- Identify which service type is more profitable

### Use Case 2: Weekly Trend Report

"How did dine-in and take-away perform this week?"

- Select **Weekly** view
- Compare with previous weeks
- Print report for staff meeting

### Use Case 3: Monthly Financial Summary

"Generate monthly report with service charge details"

- Select **Monthly** view
- View 12-month trends
- Print with complete service charge breakdown

### Use Case 4: Report Generation

"Print sales report for accounting"

- Select desired time period
- Click "Print Report"
- Review preview
- Print to thermal, inkjet, or PDF

---

## ⚙️ Technical Implementation

### Database Queries

Orders are fetched with these fields:

```javascript
.select('id, created_at, total, subtotal, service_charge_amount, service_charge_percent, order_type')
```

### State Management

Dashboard maintains:

```javascript
serviceChargeData: {
  totalCollected, // Total service charge collected
    totalOrders, // All orders
    dineInTotal, // 🆕 Dine-in revenue
    takeAwayTotal, // 🆕 Take-away revenue
    dineInCount, // 🆕 Number of dine-in orders
    takeAwayCount, // 🆕 Number of take-away orders
    breakdown; // Service charge by percentage
}
```

### Data Aggregation

For each time period:

```javascript
periodMap[periodKey] = {
  // Existing fields
  period,
  display,
  total,
  subtotal,
  serviceCharge,
  orderCount,
  // New fields
  dineInTotal, // Revenue from dine-in orders
  dineInCount, // Number of dine-in orders
  takeAwayTotal, // Revenue from take-away orders
  takeAwayCount, // Number of take-away orders
};
```

---

## 🔍 Data Accuracy

### Service Charge Rules

- ✅ Applied to **Dine-In** orders only
- ✅ NOT applied to Take-Away orders
- ✅ Percentage based on settings
- ✅ Amount calculated and stored in database

### Report Accuracy

- ✅ Includes all paid orders
- ✅ Respects selected time period
- ✅ Separates dine-in from take-away
- ✅ Shows accurate service charge amounts
- ✅ Calculates correct totals

---

## 🚀 Benefits

1. **Better Business Insights**

   - Understand which service type generates more revenue
   - Identify trends by service type
   - Make data-driven decisions

2. **Accurate Financial Reporting**

   - Service charge amounts clearly displayed
   - Separated by order type
   - Easy to reconcile with payments

3. **Professional Reports**

   - Print professional-looking sales reports
   - Include all necessary financial details
   - Suitable for accounting/management

4. **Staff Accountability**
   - Show dine-in vs take-away performance
   - Help staff understand customer patterns
   - Support management decisions

---

## 📋 Checklist for Users

Before printing a report:

- [ ] Select correct time period (Daily/Weekly/Monthly)
- [ ] Verify sales data appears in dashboard
- [ ] Check dine-in and take-away totals look reasonable
- [ ] Review service charge amount
- [ ] Click "Print Report" to preview

After printing:

- [ ] Verify all items appear in print preview
- [ ] Check service charge amount is displayed
- [ ] Confirm printer selection
- [ ] Print the report

---

## 🆘 Troubleshooting

### "Dine-In and Take-Away cards show 0"

**Possible causes:**

- No sales data for selected period
- All orders are of one type

**Solution:**

- Try a different time period
- Check that orders exist in the database
- Verify orders have correct order_type

### "Service charge amount not showing in print"

**Possible causes:**

- Service charge not configured
- Orders don't have service charges
- Print preview issue

**Solution:**

- Check Settings → Service Charge configuration
- Verify dine-in orders have service charge applied
- Try printing to a different printer/PDF

### "Numbers don't match previous reports"

**Possible causes:**

- Now showing dine-in/take-away separately
- Service charge calculation different
- Data was recent added/modified

**Solution:**

- Compare total row to previous reports
- Check individual period breakdown
- Verify order types are correctly entered

---

## 📞 Support

For issues with the sales reports:

1. Check the troubleshooting section above
2. Verify data in Sales Summary appears correct
3. Try selecting a different time period
4. Restart the dashboard if needed
5. Contact system administrator if problems persist

---

## 📝 Version History

| Version | Date        | Changes                                                                     |
| ------- | ----------- | --------------------------------------------------------------------------- |
| 2.1     | Jan 2, 2026 | Added dine-in/take-away breakdown and total service charge to print reports |
| 2.0     | Earlier     | Initial sales reports with daily/weekly/monthly views                       |

---

**Last Updated**: January 2, 2026
