# Troubleshooting: Cloudflare Error 1001 - DNS Resolution Error

## Error Message

```
Error 1001: DNS resolution error
You've requested a page on a website (photo.joventy.cd) that is on the Cloudflare network. 
Cloudflare is currently unable to resolve your requested domain.
```

## What This Means

Cloudflare cannot find the DNS records for your custom domain. This happens when:
1. DNS records are not properly configured
2. DNS propagation is still in progress (can take up to 48 hours)
3. The domain is not correctly added to Cloudflare
4. The CNAME/A record is missing or incorrect

## Solution Steps

### Step 1: Verify DNS Configuration at Your Domain Registrar

You need to configure DNS records at your domain registrar (where you bought `joventy.cd`).

#### Option A: CNAME Record (Recommended)

Add this CNAME record at your domain registrar:

```
Type:    CNAME
Name:    photo (or photo.joventy.cd)
Value:   piksend.com
TTL:     3600 (or Auto)
```

**Important:** 
- Some registrars want just `photo`
- Others want the full subdomain `photo.joventy.cd`
- Check your registrar's documentation

#### Option B: A Record (Alternative)

If CNAME doesn't work, use an A record pointing to your app's IP:

```
Type:    A
Name:    photo (or photo.joventy.cd)
Value:   [Your Vercel/Server IP Address]
TTL:     3600 (or Auto)
```

**To find your IP address:**
```bash
# On your local machine
nslookup piksend.com
# or
dig piksend.com
```

### Step 2: Verify DNS Propagation

After adding DNS records, check if they're propagating:

#### Online Tools
- https://dnschecker.org - Check DNS propagation globally
- https://www.whatsmydns.net - See DNS records worldwide
- https://mxtoolbox.com/SuperTool.aspx - Comprehensive DNS lookup

#### Command Line
```bash
# Check CNAME record
nslookup -type=CNAME photo.joventy.cd

# Check A record
nslookup photo.joventy.cd

# Detailed DNS query
dig photo.joventy.cd
```

**Expected Results:**
- CNAME should point to `piksend.com`
- A record should show an IP address
- No "NXDOMAIN" or "server can't find" errors

### Step 3: Wait for DNS Propagation

DNS changes can take time:
- **Minimum:** 5-10 minutes
- **Average:** 1-2 hours
- **Maximum:** 24-48 hours

**Why so long?**
- DNS servers cache records based on TTL (Time To Live)
- Global DNS servers need to update
- Your ISP's DNS cache needs to refresh

**Tips while waiting:**
- Don't make multiple DNS changes (this resets the timer)
- Clear your browser cache
- Try accessing from different networks (mobile data, VPN)
- Use incognito/private browsing mode

### Step 4: Verify Cloudflare Configuration

If DNS is propagating but still getting Error 1001:

#### Check Cloudflare Zone Status

1. Log into Cloudflare dashboard
2. Find your zone for `joventy.cd`
3. Check status - should be "Active"
4. Verify nameservers are correctly set

#### Check DNS Records in Cloudflare

In Cloudflare DNS settings, you should see:

```
Type:    CNAME
Name:    photo
Content: piksend.com
Proxy:   Enabled (orange cloud)
TTL:     Auto
```

**Important Settings:**
- **Proxy Status:** Should be "Proxied" (orange cloud icon)
- **SSL/TLS Mode:** Should be "Full" or "Full (strict)"

### Step 5: Verify SSL/TLS Settings

1. Go to Cloudflare Dashboard → SSL/TLS
2. Set encryption mode to **"Full"** or **"Full (strict)"**
3. Enable **"Always Use HTTPS"**
4. Enable **"Automatic HTTPS Rewrites"**

### Step 6: Check Application Configuration

Verify your app is configured to handle the custom domain:

#### Environment Variables

```env
NEXT_PUBLIC_APP_DOMAIN=piksend.com
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

#### Database Configuration

Check that your domain is saved correctly:

```sql
-- Check your profile's branding configuration
SELECT 
  id,
  branding->>'customDomain' as custom_domain,
  branding->>'domainVerified' as verified,
  branding->>'sslProvider' as ssl_provider
FROM profiles
WHERE id = 'your-user-id';
```

Expected results:
- `custom_domain`: `photo.joventy.cd`
- `verified`: `true`
- `ssl_provider`: `cloudflare` or `letsencrypt`

## Common Issues and Solutions

### Issue 1: "NXDOMAIN" Error

**Problem:** Domain doesn't exist in DNS
**Solution:** 
- Add DNS records at your domain registrar
- Wait for propagation (up to 48 hours)
- Verify you're adding records to the correct domain

### Issue 2: CNAME Points to Wrong Target

**Problem:** CNAME points to wrong domain
**Solution:**
- Update CNAME to point to `piksend.com`
- Remove any conflicting A records
- Wait for DNS propagation

### Issue 3: Cloudflare Zone Not Active

**Problem:** Cloudflare zone status is "Pending"
**Solution:**
- Update nameservers at your domain registrar
- Point to Cloudflare's nameservers (shown in Cloudflare dashboard)
- Wait for nameserver propagation (can take 24-48 hours)

### Issue 4: SSL/TLS Errors After DNS Works

**Problem:** DNS resolves but SSL fails
**Solution:**
- Set SSL/TLS mode to "Full" in Cloudflare
- Wait for SSL certificate provisioning (5-10 minutes)
- Enable "Always Use HTTPS"

### Issue 5: Works on Some Networks, Not Others

**Problem:** Domain works on mobile but not WiFi (or vice versa)
**Solution:**
- This is normal during DNS propagation
- Clear DNS cache on affected network
- Wait for full propagation

## Quick Checklist

Use this checklist to verify your setup:

- [ ] DNS records added at domain registrar
- [ ] CNAME or A record points to correct target
- [ ] DNS propagation checked (dnschecker.org)
- [ ] Cloudflare zone is "Active"
- [ ] Cloudflare DNS record exists and is proxied
- [ ] SSL/TLS mode set to "Full"
- [ ] "Always Use HTTPS" enabled
- [ ] Domain verified in application
- [ ] SSL certificate provisioned
- [ ] Waited at least 1-2 hours for propagation

## Testing Commands

### Test DNS Resolution
```bash
# Test CNAME
nslookup -type=CNAME photo.joventy.cd

# Test A record
nslookup photo.joventy.cd

# Detailed query
dig photo.joventy.cd ANY

# Test from specific DNS server
nslookup photo.joventy.cd 8.8.8.8
```

### Test HTTP/HTTPS
```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://photo.joventy.cd

# Test HTTPS
curl -I https://photo.joventy.cd

# Test with verbose output
curl -v https://photo.joventy.cd
```

### Clear DNS Cache

**Windows:**
```cmd
ipconfig /flushdns
```

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Linux:**
```bash
sudo systemd-resolve --flush-caches
```

## When to Contact Support

Contact support if:
- DNS records are correct but error persists after 48 hours
- Cloudflare zone shows as "Active" but domain doesn't resolve
- SSL certificate fails to provision after multiple attempts
- You see different errors (not 1001)

## Additional Resources

- [Cloudflare Error 1001 Documentation](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1001/)
- [DNS Propagation Checker](https://dnschecker.org)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Custom Domain Setup Guide](../development/custom-domain-implementation.md)

## Summary

**Most Common Cause:** DNS records not configured at domain registrar

**Quick Fix:**
1. Add CNAME record: `photo` → `piksend.com`
2. Wait 1-2 hours for propagation
3. Verify with `nslookup photo.joventy.cd`
4. Clear browser cache and try again

**Remember:** DNS propagation takes time. Be patient and don't make multiple changes while waiting.
