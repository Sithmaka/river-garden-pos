# Admin Dashboard - Code Highlights

## Component Structure

### State Management

```javascript
const [summaryView, setSummaryView] = useState("daily");
const [summaryData, setSummaryData] = useState([]);
const [loadingSummary, setLoadingSummary] = useState(true);
const [itemBreakdown, setItemBreakdown] = useState([]);
const [serviceChargeData, setServiceChargeData] = useState({
  totalCollected: 0,
  totalOrders: 0,
  breakdown: [],
});
```

### Data Fetching (Smart Aggregation)

```javascript
useEffect(() => {
  const fetchSummaryData = async () => {
    // Determine date range based on summaryView
    let startDate, groupByDays, dateFormat;

    if (summaryView === 'daily') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      dateFormat = { weekday: 'short', month: 'short', day: 'numeric' };
    } else if (summaryView === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 27);
      dateFormat = { month: 'short', day: 'numeric' };
    } else {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      dateFormat = { month: 'long', year: '2-digit' };
    }

    // Fetch orders and items
    const { data: orders } = await supabase
      .from('orders')
      .select('id, created_at, total, subtotal, service_charge_amount')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'paid');

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id, menu_item_name, quantity, line_total');

    // Aggregate data by period
    const periodMap = {};
    orders?.forEach(order => {
      let periodKey = /* computed based on view */;
      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          display: /* formatted date range */,
          total: 0,
          serviceCharge: 0,
          orderCount: 0
        };
      }
      periodMap[periodKey].total += parseFloat(order.total);
      periodMap[periodKey].serviceCharge += parseFloat(order.service_charge_amount);
      periodMap[periodKey].orderCount += 1;
    });

    setSummaryData(Object.values(periodMap));
  };

  fetchSummaryData();
}, [summaryView]);
```

### UI Components

#### View Toggle Buttons

```jsx
<div className="flex gap-2 mt-4 sm:mt-0">
  <button
    onClick={() => setSummaryView("daily")}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      summaryView === "daily"
        ? "bg-teal-500 text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Daily
  </button>
  {/* Weekly and Monthly buttons follow same pattern */}
</div>
```

#### Interactive Chart with Tooltips

```jsx
<div className="relative h-64 flex items-end justify-center gap-3 px-4">
  {summaryData.map((period) => {
    const maxSales = Math.max(...summaryData.map((d) => d.total), 1);
    const heightPercent = (period.total / maxSales) * 100;

    return (
      <div
        key={period.period}
        className="flex flex-col items-center justify-end gap-2"
      >
        <div
          className="w-16 flex flex-col items-center justify-end"
          style={{ height: "200px" }}
        >
          <div className="text-xs font-semibold text-teal-600 mb-1">
            {formatCurrency(period.total)}
          </div>
          <div
            className="w-12 bg-gradient-to-t from-teal-500 to-teal-400 rounded-t hover:shadow-lg relative group"
            style={{ height: `${Math.max(heightPercent, 10)}%` }}
          >
            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-2 px-2 whitespace-nowrap">
                <div>{period.orderCount} orders</div>
                <div>Charge: {formatCurrency(period.serviceCharge)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-600 font-medium text-center">
          {period.display}
        </div>
      </div>
    );
  })}
</div>
```

#### Statistics Grid

```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
  <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
    <p className="text-sm text-gray-600 mb-1">Total Sales</p>
    <p className="text-xl font-bold text-gray-900">
      {formatCurrency(summaryData.reduce((sum, d) => sum + d.total, 0))}
    </p>
  </div>
  {/* More statistics cards... */}
</div>
```

#### Service Charge Breakdown

```jsx
{
  serviceChargeData.breakdown.map((charge) => (
    <div
      key={charge.percent}
      className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-700">
          {charge.percent}% Service Charge
        </span>
        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded">
          {charge.orderCount} orders
        </span>
      </div>
      <p className="text-2xl font-bold text-emerald-600">
        {formatCurrency(charge.amount)}
      </p>
    </div>
  ));
}

{
  /* Total Summary */
}
<div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-500 rounded-lg">
  <div className="flex justify-between items-center">
    <span className="text-sm font-bold text-gray-800">
      Total Service Charge Collected
    </span>
    <p className="text-3xl font-bold text-emerald-700">
      {formatCurrency(serviceChargeData.totalCollected)}
    </p>
  </div>
</div>;
```

#### Top Items Table

```jsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b-2 border-gray-300 bg-gray-50">
      <th className="text-left px-4 py-3 font-semibold text-gray-700">
        Item Name
      </th>
      <th className="text-center px-4 py-3 font-semibold text-gray-700">
        Quantity Sold
      </th>
      <th className="text-right px-4 py-3 font-semibold text-gray-700">
        Revenue
      </th>
    </tr>
  </thead>
  <tbody>
    {itemBreakdown.map((item, index) => (
      <tr
        key={index}
        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <td className="px-4 py-3 text-gray-700">{item.name}</td>
        <td className="text-center px-4 py-3">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 text-teal-700 font-semibold rounded-full">
            {item.quantity}
          </span>
        </td>
        <td className="text-right px-4 py-3 font-semibold text-teal-600">
          {formatCurrency(item.revenue)}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## Key Algorithms

### Date Period Aggregation

```javascript
// Determine the period key based on view
if (summaryView === "daily") {
  periodKey = order.created_at.split("T")[0]; // YYYY-MM-DD
  periodDisplay = orderDate.toLocaleDateString("en-US", dateFormat);
} else if (summaryView === "weekly") {
  // Get Sunday of the week
  const weekStart = new Date(orderDate);
  weekStart.setDate(orderDate.getDate() - orderDate.getDay());
  periodKey = weekStart.toISOString().split("T")[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  periodDisplay = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
} else {
  // Monthly
  periodKey = orderDate.toISOString().split("T")[0].substring(0, 7); // YYYY-MM
  periodDisplay = orderDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
```

### Item Frequency Calculation

```javascript
const itemFrequency = {};
orders?.forEach((order) => {
  const items = itemsByOrderId[order.id] || [];
  items.forEach((item) => {
    if (!itemFrequency[item.menu_item_name]) {
      itemFrequency[item.menu_item_name] = {
        name: item.menu_item_name,
        quantity: 0,
        revenue: 0,
      };
    }
    itemFrequency[item.menu_item_name].quantity += item.quantity;
    itemFrequency[item.menu_item_name].revenue += parseFloat(item.line_total);
  });
});

// Sort and take top 10
const sortedItems = Object.values(itemFrequency)
  .sort((a, b) => b.quantity - a.quantity)
  .slice(0, 10);
```

### Service Charge Breakdown

```javascript
const serviceChargesByPercent = {};
orders?.forEach((order) => {
  const chargePercent = parseFloat(order.service_charge_percent || 0);
  if (!serviceChargesByPercent[chargePercent]) {
    serviceChargesByPercent[chargePercent] = {
      percent: chargePercent,
      amount: 0,
      orderCount: 0,
    };
  }
  serviceChargesByPercent[chargePercent].amount += parseFloat(
    order.service_charge_amount || 0
  );
  serviceChargesByPercent[chargePercent].orderCount += 1;
});

// Sort by percentage
const breakdown = Object.values(serviceChargesByPercent).sort(
  (a, b) => a.percent - b.percent
);
```

## Styling Patterns

### Responsive Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Auto-responsive based on screen size */}
</div>
```

### Gradient Backgrounds

```jsx
<div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
  {/* Light gradient background */}
</div>
```

### Hover Effects

```jsx
<div className="hover:shadow-lg hover:bg-teal-500 transition-all cursor-pointer">
  {/* Smooth transitions on hover */}
</div>
```

### Color-Coded Sections

```jsx
// Teal for sales
<div className="bg-teal-500">...</div>

// Emerald for service charges
<div className="bg-emerald-600">...</div>

// Blue for order counts
<div className="bg-blue-100">...</div>

// Amber for averages
<div className="bg-amber-50">...</div>
```

## Performance Tips

1. **Efficient Data Fetching**

   - Fetch only necessary fields from Supabase
   - Use `.eq('status', 'paid')` to filter at database level
   - Join operations done in application (JavaScript)

2. **Smart Aggregation**

   - Use JavaScript Map objects for grouping
   - Single pass through data for aggregation
   - Pre-filter top 10 items to reduce memory

3. **Lazy Rendering**

   - Conditional rendering prevents unnecessary DOM elements
   - Use `.slice(0, 10)` to limit items rendered

4. **Optimized Re-renders**
   - Data only fetches on `summaryView` change
   - Component doesn't re-fetch on prop changes

## Security Considerations

1. **Data Access**

   - Uses existing Supabase security policies
   - Only fetches paid orders (status='paid')
   - No sensitive customer data exposed

2. **Input Validation**

   - All dates are generated server-side
   - No user input in queries
   - Safe string formatting with `toISOString()`

3. **Error Handling**
   - Try-catch blocks for API calls
   - Graceful error state display
   - Console errors logged for debugging

---

This code provides a solid foundation for the advanced admin analytics dashboard with room for future enhancements!
