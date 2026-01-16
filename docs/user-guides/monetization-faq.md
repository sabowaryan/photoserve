# Monetization FAQ

Find answers to the most frequently asked questions about selling your photography galleries on PikSend.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Stripe Connect](#stripe-connect)
3. [Pricing & Fees](#pricing--fees)
4. [Paywalls](#paywalls)
5. [Payments & Payouts](#payments--payouts)
6. [Client Experience](#client-experience)
7. [Refunds & Disputes](#refunds--disputes)
8. [Taxes & Legal](#taxes--legal)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Q: What do I need to start selling my galleries?

**A:** You need three things:
1. A **Pro plan** subscription on PikSend
2. A connected **Stripe account** (free to create)
3. At least one **gallery with photos** uploaded

### Q: Is there a cost to use the monetization feature?

**A:** There's no additional subscription cost. You only pay a 10% platform fee on successful sales. If you don't sell anything, you don't pay anything.

### Q: How long does it take to set up?

**A:** Most photographers complete the setup in 10-15 minutes:
- Stripe account connection: 5-10 minutes
- First paywall setup: 2-5 minutes

### Q: Can I try it before committing?

**A:** Yes! You can:
- Set up your Stripe account for free
- Create a test paywall
- Share with a friend to test the purchase flow
- Use Stripe's test mode for practice

---

## Stripe Connect

### Q: What is Stripe Connect?

**A:** Stripe Connect is a secure payment platform that handles all the payment processing. It allows you to receive payments directly to your bank account while PikSend handles the gallery access.

### Q: Is Stripe safe?

**A:** Yes, Stripe is one of the most trusted payment processors in the world. They:
- Process billions of dollars annually
- Are PCI-DSS Level 1 certified (highest security standard)
- Are used by companies like Amazon, Google, and Shopify
- Never share your banking information with PikSend

### Q: Do I need a business to use Stripe?

**A:** No, you can sign up as an individual. Stripe supports:
- Individuals/sole proprietors
- LLCs
- Corporations
- Non-profits

### Q: What information does Stripe require?

**A:** Stripe needs:
- Your legal name and address
- Date of birth
- Last 4 digits of SSN (US) or equivalent ID
- Bank account for payouts
- Sometimes a photo ID for verification

### Q: Can I use my existing Stripe account?

**A:** Yes! If you already have a Stripe account, you can connect it to PikSend during the setup process.

### Q: What if I'm outside the US?

**A:** Stripe Connect is available in 40+ countries. Check [Stripe's supported countries](https://stripe.com/global) to see if your country is supported.

---

## Pricing & Fees

### Q: What fees does PikSend charge?

**A:** PikSend charges a flat **10% platform fee** on each sale. This covers:
- Stripe payment processing fees
- Platform infrastructure costs
- Customer support

### Q: How is my earnings calculated?

**A:** Simple math:
```
Your Earnings = Sale Price × 90%

Example: $29.99 sale
Your Earnings = $29.99 × 0.90 = $26.99
```

### Q: What's the minimum price I can set?

**A:** The minimum price is **$5.00** (or equivalent in EUR/CAD).

### Q: What's the maximum price I can set?

**A:** The maximum price is **$500.00** (or equivalent in EUR/CAD).

### Q: What currencies are supported?

**A:** Currently supported currencies:
- USD (US Dollar)
- EUR (Euro)
- CAD (Canadian Dollar)

### Q: Can I offer discounts or promo codes?

**A:** Promo codes are not currently supported. However, you can:
- Manually lower the price temporarily
- Create a separate gallery with a lower price
- Offer direct discounts outside the platform

### Q: Are there any hidden fees?

**A:** No hidden fees. The 10% platform fee is all-inclusive. You'll never be surprised by additional charges.

---

## Paywalls

### Q: What's the difference between Full Paywall and Freemium Preview?

**A:** 

| Feature | Full Paywall | Freemium Preview |
|---------|--------------|------------------|
| What clients see | Blurred preview images | All photos in low-res |
| Watermarks | On preview only | On all photos |
| Downloads | Blocked | Blocked |
| Best for | Exclusive content | Letting clients browse first |

### Q: Can I change the paywall type after setting it up?

**A:** Yes, you can switch between Full Paywall and Freemium Preview anytime. Changes take effect immediately.

### Q: Can I have different prices for different galleries?

**A:** Yes! Each gallery has its own monetization settings. You can price each gallery independently.

### Q: What happens if I disable the paywall?

**A:** The gallery becomes free to access. Clients who already purchased will still have access (they paid for it, after all).

### Q: Can I enable a paywall on an existing gallery?

**A:** Yes, you can add a paywall to any existing gallery. Clients who previously viewed it for free will need to purchase to continue accessing.

### Q: How many photos should I show in the preview?

**A:** For Full Paywall mode, we recommend 3-5 of your best photos as blurred previews. Choose images that showcase the variety and quality of the gallery.

---

## Payments & Payouts

### Q: When do I get paid?

**A:** The timeline is:
1. **Instant**: Client pays, sale recorded
2. **1-2 days**: Payment processed by Stripe
3. **Your schedule**: Payout sent to your bank (daily, weekly, or monthly)
4. **2-5 days**: Money arrives in your bank account

### Q: How do I change my payout schedule?

**A:** 
1. Go to Settings → Stripe Connect
2. Click "View Stripe Dashboard"
3. Navigate to Settings → Payouts
4. Choose Daily, Weekly, or Monthly

### Q: Is there a minimum payout amount?

**A:** Stripe has a minimum payout of $1.00. Below that, funds accumulate until the minimum is reached.

### Q: What if my payout fails?

**A:** Common causes and solutions:
- **Wrong bank details**: Update in Stripe Dashboard
- **Account closed**: Add a new bank account
- **Bank rejection**: Contact your bank

Failed payouts are automatically retried. Check your Stripe Dashboard for details.

### Q: Can I receive payouts to PayPal?

**A:** No, Stripe only supports bank account payouts. You'll need to provide bank account details.

### Q: Do I need a business bank account?

**A:** No, you can use a personal bank account. Just make sure the account name matches your Stripe account name.

---

## Client Experience

### Q: What does my client see when they visit a paywalled gallery?

**A:** Depending on your settings:
- **Full Paywall**: A beautiful locked screen with blurred previews, price, and purchase button
- **Freemium**: All photos in low resolution with watermarks and an "Unlock HD" banner

### Q: How does the payment process work for clients?

**A:** 
1. Client clicks "Purchase Access" or "Unlock HD"
2. Redirected to secure Stripe checkout
3. Enters email and payment info
4. Completes payment
5. Instantly redirected to unlocked gallery
6. Receives confirmation email

### Q: What payment methods can clients use?

**A:** Stripe accepts:
- Credit cards (Visa, Mastercard, Amex, Discover)
- Debit cards
- Apple Pay
- Google Pay
- Bank transfers (in some regions)

### Q: Do clients need to create an account?

**A:** No! Clients can purchase as guests using just their email address. No account creation required.

### Q: How long does client access last?

**A:** By default, access is **lifetime** (never expires). You can optionally set an expiration (e.g., 30 days) when configuring the paywall.

### Q: Can clients download photos after purchasing?

**A:** Yes! After purchase, clients get:
- Full HD resolution photos
- No watermarks
- Unlimited downloads
- Access to all photos in the gallery

### Q: What if a client loses access?

**A:** Clients can regain access by:
1. Using the same email to visit the gallery
2. Clicking the link in their confirmation email
3. Contacting you for assistance

---

## Refunds & Disputes

### Q: Can I issue refunds?

**A:** Yes, you can issue full or partial refunds within 30 days of purchase through your Revenue Dashboard.

### Q: What happens when I refund a client?

**A:** 
- Client receives their money back (5-10 business days)
- Client's gallery access is revoked
- The sale is marked as "Refunded"
- The amount is deducted from your balance

### Q: Do I get the platform fee back on refunds?

**A:** No, the platform fee covers payment processing costs that have already occurred and is not refundable.

### Q: What's a dispute/chargeback?

**A:** A dispute occurs when a client contacts their bank to reverse a charge instead of requesting a refund from you. Disputes are more serious and can result in additional fees.

### Q: How do I avoid disputes?

**A:** 
- Respond quickly to refund requests
- Clearly describe what clients will receive
- Use a recognizable business name
- Send confirmation emails
- Make your refund policy clear

### Q: What if I receive a dispute?

**A:** 
1. You'll be notified immediately
2. Gather evidence (access logs, emails, terms)
3. Respond through Stripe Dashboard
4. Wait for the bank's decision (60-90 days)

See our [Refunds & Disputes Guide](./refunds-disputes.md) for detailed instructions.

---

## Taxes & Legal

### Q: Do I need to pay taxes on my sales?

**A:** Yes, income from gallery sales is typically taxable. Consult a tax professional for advice specific to your situation.

### Q: Does PikSend provide tax documents?

**A:** Stripe provides tax documents:
- **US**: 1099-K if you exceed thresholds
- **Other countries**: Varies by location

Access tax documents through your Stripe Dashboard.

### Q: Do I need to collect sales tax?

**A:** Sales tax requirements vary by location. Stripe can help with tax calculation in some regions. Consult a tax professional for guidance.

### Q: Do I need a business license?

**A:** Requirements vary by location. Many photographers operate as sole proprietors without a formal business license. Check your local regulations.

### Q: What about client contracts?

**A:** PikSend's terms cover the platform usage. For your photography services, consider having your own:
- Service agreement
- Usage rights terms
- Refund policy

### Q: Who owns the photos after a client purchases?

**A:** You retain copyright. Clients purchase access to view and download, not ownership of the images. Define usage rights in your terms.

---

## Troubleshooting

### Q: My Stripe account is stuck on "Pending"

**A:** 
1. Check your email for messages from Stripe
2. Log into Stripe Dashboard to see if more info is needed
3. Complete any outstanding verification steps
4. Contact Stripe support if it's been more than 48 hours

### Q: Client says they can't access after paying

**A:** 
1. Verify the payment in your Revenue Dashboard
2. Check if they're using the same email
3. Send them the direct gallery link
4. If issues persist, contact support

### Q: My revenue numbers don't match Stripe

**A:** 
- PikSend shows your **net earnings** (after 10% fee)
- Stripe shows **gross amounts** (before fees)
- Both are correct, just different views

### Q: Paywall isn't showing on my gallery

**A:** Check that:
1. Paywall is enabled in gallery settings
2. Your Stripe account is active
3. You've saved the monetization settings
4. You're viewing as a client (not logged in as owner)

### Q: Client was charged but didn't get access

**A:** 
1. Check your Revenue Dashboard for the sale
2. Verify the payment status is "Completed"
3. Have the client clear their browser cache
4. Send them the direct gallery link
5. Contact support if the issue persists

### Q: I can't connect my Stripe account

**A:** Try:
1. Using a different browser
2. Disabling ad blockers
3. Allowing pop-ups for stripe.com
4. Clearing your browser cache
5. Contacting support if issues continue

---

## Still Have Questions?

### Contact Support

- **Email**: support@piksend.com
- **Help Center**: [help.piksend.com](https://help.piksend.com)
- **Response Time**: Within 24 hours

### Related Guides

- [Getting Started with Stripe Connect](./stripe-connect-setup.md)
- [Setting Up Gallery Paywalls](./gallery-paywall-setup.md)
- [Understanding Your Revenue](./revenue-dashboard.md)
- [Managing Refunds & Disputes](./refunds-disputes.md)

---

*Last updated: January 2025*
