# Understanding Your Revenue Dashboard

Your Revenue Dashboard is your command center for tracking sales, monitoring earnings, and understanding your photography business performance. This guide explains every feature and metric available to you.

## Table of Contents

1. [Accessing the Dashboard](#accessing-the-dashboard)
2. [Overview Metrics](#overview-metrics)
3. [Revenue Charts](#revenue-charts)
4. [Sales Table](#sales-table)
5. [Top Galleries](#top-galleries)
6. [Payouts](#payouts)
7. [Analytics](#analytics)
8. [Exporting Data](#exporting-data)
9. [Understanding Your Earnings](#understanding-your-earnings)

---

## Accessing the Dashboard

To access your Revenue Dashboard:

1. Log in to your PikSend account
2. Click **Revenue** in the left sidebar
3. You'll see your complete revenue overview

![Screenshot placeholder: Revenue dashboard overview]

> **Note**: The Revenue Dashboard is only available for Pro plan users with an active Stripe Connect account.

---

## Overview Metrics

At the top of your dashboard, you'll see key performance metrics:

### Total Revenue

Your total earnings from all gallery sales (after platform fees).

```
┌─────────────────────┐
│  Total Revenue      │
│  $2,847.50          │
│  ↑ 12% vs last month│
└─────────────────────┘
```

### This Month

Revenue earned in the current calendar month.

```
┌─────────────────────┐
│  This Month         │
│  $456.00            │
│  15 sales           │
└─────────────────────┘
```

### Total Sales

The total number of gallery purchases across all your galleries.

```
┌─────────────────────┐
│  Total Sales        │
│  127                │
│  ↑ 8 this week      │
└─────────────────────┘
```

### Average Sale

Your average revenue per sale.

```
┌─────────────────────┐
│  Average Sale       │
│  $22.42             │
│  Based on 127 sales │
└─────────────────────┘
```

### Conversion Rate

The percentage of gallery visitors who make a purchase.

```
┌─────────────────────┐
│  Conversion Rate    │
│  18.5%              │
│  ↑ 2.3% improvement │
└─────────────────────┘
```

---

## Revenue Charts

### Revenue Over Time

The main chart shows your revenue trends over time. You can view data by:

- **Last 7 days**: Daily breakdown
- **Last 30 days**: Daily breakdown
- **Last 3 months**: Weekly breakdown
- **Last 12 months**: Monthly breakdown
- **All time**: Monthly breakdown

![Screenshot placeholder: Revenue chart]

### Reading the Chart

- **Blue bars**: Revenue for each period
- **Hover**: See exact amounts and dates
- **Trend line**: Shows overall direction

### Chart Controls

- **Period selector**: Choose your time range
- **Currency toggle**: View in your preferred currency
- **Export**: Download chart data as CSV

---

## Sales Table

The sales table shows all your individual transactions with detailed information.

### Table Columns

| Column | Description |
|--------|-------------|
| Date | When the purchase was made |
| Gallery | Name of the purchased gallery |
| Client | Buyer's email address |
| Amount | Total sale price |
| Fee | Platform fee deducted |
| Net | Your earnings |
| Status | Payment status |

### Sale Statuses

- 🟢 **Completed**: Payment successful, access granted
- 🟡 **Pending**: Payment processing
- 🔴 **Refunded**: Payment was refunded
- ⚠️ **Disputed**: Client filed a dispute

### Filtering Sales

Use the filters to find specific sales:

1. **Date Range**: Select start and end dates
2. **Gallery**: Filter by specific gallery
3. **Status**: Show only certain statuses
4. **Search**: Search by client email

### Sorting

Click any column header to sort:
- Click once: Sort ascending (A-Z, oldest first)
- Click twice: Sort descending (Z-A, newest first)

### Pagination

- Navigate through pages using the arrows
- Change items per page (10, 25, 50, 100)

---

## Top Galleries

The Top Galleries widget shows your best-performing galleries:

```
┌─────────────────────────────────────────┐
│  Top Galleries                          │
├─────────────────────────────────────────┤
│  1. Wedding - Sarah & John    $1,245.00 │
│     42 sales                            │
│                                         │
│  2. Corporate Event 2025       $567.00  │
│     23 sales                            │
│                                         │
│  3. Family Portrait Session    $345.00  │
│     15 sales                            │
└─────────────────────────────────────────┘
```

### Metrics Shown

- **Gallery name**: Click to view gallery details
- **Total revenue**: Earnings from this gallery
- **Number of sales**: Total purchases

### Using This Data

- Identify your most popular content
- Understand what clients value most
- Inform pricing decisions for future galleries

---

## Payouts

The Payouts section shows money transferred to your bank account.

### Accessing Payouts

1. Click the **Payouts** tab in your Revenue Dashboard
2. View your payout history and upcoming payouts

### Payout Information

| Field | Description |
|-------|-------------|
| Date | When the payout was initiated |
| Amount | Total amount transferred |
| Status | Payout status |
| Bank | Last 4 digits of destination account |
| Arrival | Expected arrival date |

### Payout Statuses

- 🟢 **Paid**: Successfully deposited to your bank
- 🟡 **In Transit**: On the way to your bank
- 🟡 **Pending**: Scheduled but not yet initiated
- 🔴 **Failed**: Payout failed (check bank details)

### Balance Widget

```
┌─────────────────────────────────────────┐
│  Available Balance                      │
│  $234.50                                │
│                                         │
│  Pending Balance                        │
│  $89.00                                 │
│                                         │
│  Next Payout: Jan 20, 2025              │
│  Estimated: $323.50                     │
└─────────────────────────────────────────┘
```

- **Available Balance**: Ready to be paid out
- **Pending Balance**: Recent sales still processing (usually 2-7 days)
- **Next Payout**: When your next automatic payout will occur

### Changing Payout Schedule

To change when you receive payouts:

1. Click **View Stripe Dashboard**
2. Go to **Settings** → **Payouts**
3. Choose: Daily, Weekly, or Monthly

---

## Analytics

The Analytics tab provides deeper insights into your business performance.

### Conversion Funnel

See how visitors move through your sales process:

```
┌─────────────────────────────────────────┐
│  Conversion Funnel                      │
├─────────────────────────────────────────┤
│  Gallery Views     │████████████│ 1,000 │
│  Paywall Views     │████████    │   650 │
│  Checkout Started  │████        │   250 │
│  Purchases         │██          │   127 │
├─────────────────────────────────────────┤
│  Overall Conversion: 12.7%              │
└─────────────────────────────────────────┘
```

### Revenue by Gallery

Compare performance across all your monetized galleries:

```
┌─────────────────────────────────────────┐
│  Revenue by Gallery                     │
├─────────────────────────────────────────┤
│  Wedding - Sarah & John                 │
│  ████████████████████████  $1,245 (44%) │
│                                         │
│  Corporate Event 2025                   │
│  ██████████████            $567 (20%)   │
│                                         │
│  Family Portrait Session                │
│  ████████                  $345 (12%)   │
│                                         │
│  Other Galleries                        │
│  ██████████████            $690 (24%)   │
└─────────────────────────────────────────┘
```

### Key Metrics Explained

| Metric | What It Means | Good Benchmark |
|--------|---------------|----------------|
| Conversion Rate | % of visitors who buy | 10-25% |
| Average Order Value | Average sale amount | Depends on pricing |
| Revenue per Visitor | Average revenue per view | $2-5 |
| Repeat Customers | Clients who buy multiple galleries | 5-15% |

---

## Exporting Data

Export your sales data for accounting, taxes, or analysis.

### Export Options

1. **CSV**: Spreadsheet format (Excel, Google Sheets)
2. **Excel**: Native Excel format with formatting
3. **PDF**: Formatted report for printing

### How to Export

1. Go to the **Sales** tab
2. Apply any filters you want (optional)
3. Click the **Export** button
4. Choose your format
5. The file will download automatically

### What's Included

The export includes:
- Transaction date and time
- Gallery name
- Client email
- Sale amount
- Platform fee
- Your net earnings
- Payment status
- Stripe transaction ID

### Tax Reporting

For tax purposes, you can:
1. Export all sales for the tax year
2. Filter by date range (Jan 1 - Dec 31)
3. Use the totals for your tax return

> **Tip**: Stripe also provides tax documents (1099-K in the US) through your Stripe Dashboard.

---

## Understanding Your Earnings

### How Earnings Are Calculated

For each sale:

```
Sale Price:        $29.99
Platform Fee:      -$3.00 (10%)
─────────────────────────
Your Earnings:     $26.99
```

### When Money Becomes Available

1. **Sale occurs**: Client completes purchase
2. **Processing** (1-2 days): Stripe processes the payment
3. **Available**: Funds appear in your Stripe balance
4. **Payout**: Transferred to your bank on schedule

### Timeline Example

```
Day 1: Client purchases gallery ($29.99)
Day 2: Payment confirmed, funds processing
Day 3: Funds available in Stripe balance
Day 4: Automatic payout initiated (if daily schedule)
Day 5-7: Money arrives in your bank account
```

### Factors Affecting Payout Speed

- **Your payout schedule**: Daily, weekly, or monthly
- **Your bank**: Some banks process faster
- **Weekends/holidays**: May delay processing
- **New accounts**: First payouts may take longer

---

## Tips for Maximizing Revenue

### Increase Conversion Rate

1. **Use freemium preview**: Let clients see before buying
2. **Price appropriately**: Not too high, not too low
3. **Quality previews**: Show your best work in the paywall
4. **Clear value proposition**: Explain what clients get

### Increase Average Sale

1. **Bundle galleries**: Offer packages
2. **Premium pricing**: Don't undervalue your work
3. **Add more photos**: More value = higher price justified

### Track and Improve

1. **Check analytics weekly**: Spot trends early
2. **Compare galleries**: Learn what works
3. **Test pricing**: Experiment with different price points
4. **Ask for feedback**: Learn from clients

---

## Troubleshooting

### "My revenue isn't updating"

- Sales may take a few minutes to appear
- Refresh the page
- Check if the sale shows in your Stripe Dashboard

### "My payout is delayed"

- Check your Stripe Dashboard for any issues
- Verify your bank account is correct
- Contact Stripe support if it's been more than 7 days

### "Numbers don't match Stripe"

- PikSend shows your net earnings (after fees)
- Stripe shows gross amounts
- Both are correct, just different views

---

## Next Steps

- **[Learn about refunds](./refunds-disputes.md)** - Handle customer issues
- **[Read the FAQ](./monetization-faq.md)** - Common questions answered

---

## Need Help?

- **Email**: support@piksend.com
- **Help Center**: [help.piksend.com](https://help.piksend.com)

---

*Last updated: January 2025*
