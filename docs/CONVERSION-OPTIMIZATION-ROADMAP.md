# Roadmap d'Optimisation des Conversions

## 🎯 Objectif Global

**Augmenter le taux de conversion de 30-50% sur 4 semaines**

---

## 📊 Baseline Actuelle (à mesurer)

### Métriques Clés à Établir
```
Landing Page → Upload : ___%
Upload → Pricing Modal : ___%
Pricing Modal → Gratuit : ___%
Pricing Modal → Unlock : ___%
Pricing Modal → Premium : ___%
Paywall → Paiement : ___%
Lead Magnet → Email : ___%
```

---

## 🚀 Phase 1 : Quick Wins (Semaine 1)

### 1.1 Réorganiser le Modal Pricing ⭐⭐⭐

**Problème** : L'option "Gratuit" est trop visible, "Unlock" pas assez mise en avant

**Solution** :
```typescript
// src/components/guest/pricing-modal.tsx

// AVANT (ligne 150-250)
<div className="grid gap-4 md:grid-cols-3">
  {/* FREE - Order 1 */}
  {/* SUBSCRIBE - Order 2, center */}
  {/* UNLOCK - Order 3 */}
</div>

// APRÈS
<div className="grid gap-4 md:grid-cols-3">
  {/* FREE - Order 1, de-emphasized */}
  <div className="order-1 opacity-75">
    {/* Réduire visuellement */}
  </div>
  
  {/* UNLOCK - Order 2, center, POPULAR */}
  <div className="order-2 md:scale-105 ring-4 ring-emerald-500/20">
    <div className="badge">⚡ Populaire</div>
    {/* Mettre en avant */}
  </div>
  
  {/* SUBSCRIBE - Order 3, best value */}
  <div className="order-3">
    <div className="badge">💎 Meilleure valeur</div>
  </div>
</div>
```

**Changements visuels** :
- Gratuit : Opacité 75%, taille normale, badge "Essai"
- Unlock : Centre, scale 105%, ring emerald, badge "Populaire"
- Premium : Droite, badge "Meilleure valeur"

**Effort** : 2h  
**Impact** : +15-20% conversion vers Unlock

---

### 1.2 Améliorer les CTA de la Landing Page ⭐⭐

**Problème** : CTA trop générique, pas de valeur claire

**Solution** :
```typescript
// src/components/landing/landing-page-client.tsx (ligne 80-90)

// AVANT
<button onClick={onScrollToUpload}>
  <Upload size={16} />
  {t('landing.cta.primary')} // "Upload gratuit"
</button>

// APRÈS
<button onClick={onScrollToUpload}>
  <Sparkles size={16} />
  Créer ma galerie HD en 2 min
  <span className="text-xs opacity-80">
    Sans compression • Gratuit
  </span>
</button>
```

**Ajouter sous-texte rassurant** :
```typescript
<div className="flex items-center gap-4 text-xs text-slate-500">
  <span>✓ Aucune carte requise</span>
  <span>✓ Qualité originale préservée</span>
  <span>✓ Prêt en 2 minutes</span>
</div>
```

**Effort** : 1h  
**Impact** : +5-10% taux de clic CTA

---

### 1.3 Ajouter Urgence au Paywall ⭐⭐⭐

**Problème** : Pas de raison d'acheter maintenant vs plus tard

**Solution** :
```typescript
// src/components/gallery-view/gallery-paywall.tsx (après ligne 150)

// Ajouter section urgence
{hoursRemaining > 0 && hoursRemaining <= 48 && (
  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
        <Clock className="w-6 h-6 text-amber-600" />
      </div>
      <div>
        <p className="font-bold text-amber-900">
          ⏰ Cette galerie expire dans {hoursRemaining}h
        </p>
        <p className="text-sm text-amber-700">
          Débloquez maintenant pour ne rien manquer
        </p>
      </div>
    </div>
  </div>
)}

// Ajouter social proof
<div className="flex items-center justify-center gap-3 mb-6">
  <div className="flex -space-x-2">
    {[1,2,3,4].map(i => (
      <div 
        key={i} 
        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white"
      />
    ))}
  </div>
  <p className="text-sm text-slate-600">
    <span className="font-bold text-slate-900">127 clients</span> ont déjà débloqué leurs galeries
  </p>
</div>
```

**Effort** : 2h  
**Impact** : +10-15% conversion paywall

---

### 1.4 Optimiser la Validation Email ⭐⭐

**Problème** : Pas de feedback en temps réel, utilisateur ne sait pas si l'email est valide

**Solution** :
```typescript
// src/components/gallery-view/gallery-paywall.tsx (ligne 100-120)

const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setEmail(value);
  
  if (!value) {
    setEmailStatus('idle');
    return;
  }
  
  if (validateEmail(value)) {
    setEmailStatus('valid');
    setEmailError(null);
  } else {
    setEmailStatus('invalid');
    setEmailError('Email invalide');
  }
};

// Dans le JSX
<div className="relative">
  <input
    type="email"
    value={email}
    onChange={handleEmailChange}
    className={cn(
      "w-full px-4 py-3 pr-12 rounded-xl",
      emailStatus === 'valid' && "border-emerald-500 bg-emerald-50",
      emailStatus === 'invalid' && "border-rose-500 bg-rose-50"
    )}
  />
  {emailStatus === 'valid' && (
    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
  )}
</div>

{/* Message rassurant */}
<p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
  <Shield className="w-3 h-3" />
  Votre email sert uniquement à vous envoyer le lien d'accès. Aucun spam.
</p>
```

**Effort** : 1h  
**Impact** : +5% conversion (réduction friction)

---

## 🔥 Phase 2 : Remarketing (Semaine 2)

### 2.1 Créer Table Abandoned Checkouts ⭐⭐⭐

**Migration SQL** :
```sql
-- supabase/migrations/20260130_abandoned_checkouts.sql

CREATE TABLE abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Buyer info
  email VARCHAR(255) NOT NULL,
  buyer_session_id VARCHAR(255),
  
  -- Gallery info
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  gallery_title VARCHAR(255),
  photographer_name VARCHAR(255),
  
  -- Pricing
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Status
  status VARCHAR(50) DEFAULT 'abandoned', -- 'abandoned' | 'recovered' | 'expired'
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  recovered_at TIMESTAMP,
  email_sent_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_email_gallery UNIQUE(email, gallery_id)
);

CREATE INDEX idx_abandoned_checkouts_email ON abandoned_checkouts(email);
CREATE INDEX idx_abandoned_checkouts_status ON abandoned_checkouts(status);
CREATE INDEX idx_abandoned_checkouts_created_at ON abandoned_checkouts(created_at);
```

**Effort** : 30min  
**Impact** : Infrastructure pour remarketing

---

### 2.2 Sauvegarder Email Avant Stripe ⭐⭐⭐

**Modification API** :
```typescript
// src/app/api/stripe/checkout/gallery-purchase/route.ts (ligne 40-50)

export async function POST(request: NextRequest) {
  try {
    const { galleryId, buyerEmail, buyerSessionId } = validatedData.data;
    
    // NOUVEAU : Sauvegarder pour remarketing
    const { data: gallery } = await supabase
      .from('galleries')
      .select('title, user_id, profiles(display_name)')
      .eq('id', galleryId)
      .single();
    
    const { data: monetization } = await supabase
      .from('gallery_monetization')
      .select('price, currency')
      .eq('gallery_id', galleryId)
      .single();
    
    // Enregistrer l'abandon potentiel
    await supabase.from('abandoned_checkouts').upsert({
      email: buyerEmail,
      buyer_session_id: buyerSessionId,
      gallery_id: galleryId,
      gallery_title: gallery?.title,
      photographer_name: gallery?.profiles?.display_name,
      amount_cents: monetization?.price * 100,
      currency: monetization?.currency || 'usd',
      status: 'abandoned',
    }, {
      onConflict: 'email,gallery_id',
    });
    
    // Créer session Stripe...
    const result = await purchaseService.createCheckoutSession(...);
    
    return createApiResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Effort** : 1h  
**Impact** : Capture des abandons

---

### 2.3 Email de Relance Automatique ⭐⭐⭐

**Template Email** :
```typescript
// src/emails/abandoned-checkout.tsx

import { Html, Head, Body, Container, Section, Text, Button, Img } from '@react-email/components';

interface AbandonedCheckoutEmailProps {
  buyerEmail: string;
  galleryTitle: string;
  photographerName: string;
  price: string;
  galleryUrl: string;
  discountCode?: string;
}

export function AbandonedCheckoutEmail({
  galleryTitle,
  photographerName,
  price,
  galleryUrl,
  discountCode,
}: AbandonedCheckoutEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          
          {/* Header */}
          <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Img
              src="https://piksend.com/logo.png"
              alt="PikSend"
              width="120"
              height="40"
            />
          </Section>
          
          {/* Main Content */}
          <Section style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '16px', 
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Vous avez oublié quelque chose ? 🎁
            </Text>
            
            <Text style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>
              Vous étiez sur le point de débloquer la galerie <strong>{galleryTitle}</strong> de {photographerName}.
            </Text>
            
            {discountCode && (
              <Section style={{ 
                backgroundColor: '#fef3c7', 
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }}>
                  🎉 OFFRE SPÉCIALE : -20% AUJOURD'HUI
                </Text>
                <Text style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#92400e',
                  letterSpacing: '2px',
                  fontFamily: 'monospace'
                }}>
                  {discountCode}
                </Text>
              </Section>
            )}
            
            <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
              Prix : <strong style={{ fontSize: '20px', color: '#4f46e5' }}>{price}</strong>
              {discountCode && <span style={{ color: '#10b981', marginLeft: '8px' }}>(-20% avec le code)</span>}
            </Text>
            
            <Button
              href={galleryUrl}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
                fontSize: '16px'
              }}
            >
              Débloquer ma galerie
            </Button>
            
            <Text style={{ fontSize: '14px', color: '#94a3b8', marginTop: '24px' }}>
              ✓ Accès instantané<br />
              ✓ Photos HD sans watermark<br />
              ✓ Téléchargement illimité
            </Text>
          </Section>
          
          {/* Footer */}
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Text style={{ fontSize: '12px', color: '#94a3b8' }}>
              Ce lien expire dans 48 heures
            </Text>
          </Section>
          
        </Container>
      </Body>
    </Html>
  );
}
```

**Effort** : 2h  
**Impact** : Template professionnel

---

### 2.4 Cron Job de Relance ⭐⭐⭐

**Edge Function** :
```typescript
// supabase/functions/send-abandoned-cart-emails/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Récupérer les abandons de 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: abandonedCheckouts, error } = await supabase
      .from('abandoned_checkouts')
      .select('*')
      .eq('status', 'abandoned')
      .is('email_sent_at', null)
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .limit(100);
    
    if (error) throw error;
    
    // Générer code promo unique pour chaque email
    const results = [];
    for (const checkout of abandonedCheckouts || []) {
      const discountCode = `COMEBACK20-${checkout.id.substring(0, 8).toUpperCase()}`;
      
      // Envoyer email (via SendGrid, Resend, etc.)
      const emailSent = await sendEmail({
        to: checkout.email,
        subject: `Vous avez oublié quelque chose ? 🎁 -20% sur ${checkout.gallery_title}`,
        template: 'abandoned-checkout',
        data: {
          galleryTitle: checkout.gallery_title,
          photographerName: checkout.photographer_name,
          price: `$${(checkout.amount_cents / 100).toFixed(2)}`,
          galleryUrl: `https://piksend.com/g/${checkout.gallery_id}`,
          discountCode,
        },
      });
      
      if (emailSent) {
        // Marquer comme envoyé
        await supabase
          .from('abandoned_checkouts')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', checkout.id);
        
        results.push({ id: checkout.id, status: 'sent' });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.length,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Cron Config** :
```toml
# supabase/config.toml

[functions.send-abandoned-cart-emails]
schedule = "0 10 * * *" # Tous les jours à 10h
```

**Effort** : 3h  
**Impact** : +30-40% récupération abandons

---

## 🎨 Phase 3 : Lead Magnet Progressif (Semaine 3)

### 3.1 Aperçu Avant Lead Magnet ⭐⭐

**Problème** : Modal bloque immédiatement, frustrant

**Solution** :
```typescript
// src/app/g/[slug]/page.tsx

export default async function GalleryPage({ params }: { params: { slug: string } }) {
  const gallery = await getGallery(params.slug);
  const hasLeadMagnet = gallery.lead_magnet_enabled;
  
  // Afficher 3-5 photos en aperçu si lead magnet activé
  const previewImages = hasLeadMagnet 
    ? gallery.images.slice(0, 5) 
    : gallery.images;
  
  return (
    <>
      {hasLeadMagnet && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-center">
          <p className="text-sm font-bold text-amber-900">
            🔒 Entrez votre email pour voir les {gallery.images.length - 5} photos restantes
          </p>
        </div>
      )}
      
      <MasonryGrid images={previewImages} />
      
      {hasLeadMagnet && (
        <LeadMagnetTrigger 
          galleryId={gallery.id}
          totalImages={gallery.images.length}
          previewCount={5}
        />
      )}
    </>
  );
}
```

**Effort** : 2h  
**Impact** : +20-25% soumissions email

---

### 3.2 Déclenchement Progressif ⭐⭐

**Solution** :
```typescript
// src/components/gallery-view/lead-magnet-trigger.tsx

'use client';

import { useState, useEffect } from 'react';
import { LeadMagnetModal } from './lead-magnet-modal';

export function LeadMagnetTrigger({ galleryId, totalImages, previewCount }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    // Vérifier si email déjà soumis
    const hasSubmitted = localStorage.getItem(`lead_magnet_${galleryId}`);
    if (hasSubmitted) return;
    
    // Option 1: Après 30 secondes
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 30000);
    
    // Option 2: Après 50% scroll
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setScrollProgress(scrolled);
      
      if (scrolled > 50 && !showModal) {
        setShowModal(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [galleryId, showModal]);
  
  const handleSubmit = async (email: string) => {
    // Sauvegarder email
    await submitLeadMagnet(galleryId, email);
    
    // Marquer comme soumis
    localStorage.setItem(`lead_magnet_${galleryId}`, 'true');
    
    // Fermer modal
    setShowModal(false);
    
    // Recharger page pour afficher toutes les photos
    window.location.reload();
  };
  
  return showModal ? (
    <LeadMagnetModal
      galleryId={galleryId}
      onSubmit={handleSubmit}
      onSkip={() => setShowModal(false)}
    />
  ) : null;
}
```

**Effort** : 2h  
**Impact** : Meilleure UX, moins de frustration

---

## 💎 Phase 4 : Cross-sell Post-Achat (Semaine 4)

### 4.1 Page de Succès Dédiée ⭐⭐

**Nouvelle page** :
```typescript
// src/app/g/[slug]/success/page.tsx

export default async function GallerySuccessPage({ 
  params, 
  searchParams 
}: { 
  params: { slug: string };
  searchParams: { session_id: string };
}) {
  const gallery = await getGallery(params.slug);
  const session = await getStripeSession(searchParams.session_id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-20">
      <div className="container mx-auto max-w-2xl px-4">
        
        {/* Success Message */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-black text-center mb-4">
            Galerie débloquée ! 🎉
          </h1>
          
          <p className="text-slate-600 text-center mb-6">
            Vous avez maintenant accès à toutes les photos de <strong>{gallery.title}</strong>
          </p>
          
          <Button href={`/g/${params.slug}`} className="w-full">
            Voir mes photos
          </Button>
        </div>
        
        {/* Cross-sell: Devenir photographe */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-white mb-6">
          <h2 className="text-2xl font-black mb-3">
            Vous êtes photographe ?
          </h2>
          <p className="mb-6 opacity-90">
            Créez vos propres galeries HD et vendez-les à vos clients comme {gallery.photographer_name}
          </p>
          <Button variant="white" href="/auth">
            Essayer gratuitement
          </Button>
        </div>
        
        {/* Parrainage */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black mb-3">
            Parrainez un ami, gagnez $10 💰
          </h2>
          <p className="text-slate-600 mb-6">
            Votre ami reçoit $10 de crédit, vous aussi !
          </p>
          <Button variant="outline" onClick={handleShare}>
            Partager mon lien
          </Button>
        </div>
        
      </div>
    </div>
  );
}
```

**Effort** : 3h  
**Impact** : +5-10% conversion guest → photographe

---

## 📊 Dashboard de Suivi

### Métriques à Ajouter

```typescript
// src/app/(dashboard)/dashboard/analytics/page.tsx

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      
      {/* Funnel Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tunnel de Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart data={[
            { stage: 'Landing Page', visitors: 10000, conversion: 100 },
            { stage: 'Upload Started', visitors: 3000, conversion: 30 },
            { stage: 'Gallery Created', visitors: 2500, conversion: 25 },
            { stage: 'Pricing Modal', visitors: 2500, conversion: 25 },
            { stage: 'Unlock Selected', visitors: 500, conversion: 5 },
            { stage: 'Payment Completed', visitors: 400, conversion: 4 },
          ]} />
        </CardContent>
      </Card>
      
      {/* Pricing Modal Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Choix dans le Modal Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart data={[
            { label: 'Gratuit', value: 60, color: '#94a3b8' },
            { label: 'Unlock', value: 25, color: '#10b981' },
            { label: 'Premium', value: 15, color: '#6366f1' },
          ]} />
        </CardContent>
      </Card>
      
      {/* Remarketing Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Remarketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Abandons" value="150" />
            <Stat label="Emails envoyés" value="120" />
            <Stat label="Récupérés" value="45" trend="+37.5%" />
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
```

---

## 🎯 Objectifs Chiffrés

### Semaine 1
- [ ] Taux de sélection Unlock : 15% → 25% (+67%)
- [ ] Taux de clic CTA landing : 25% → 30% (+20%)
- [ ] Conversion paywall : 40% → 50% (+25%)

### Semaine 2
- [ ] Emails de relance envoyés : 100+
- [ ] Taux de récupération : 30-40%
- [ ] Revenus additionnels : +$500-1000

### Semaine 3
- [ ] Taux de soumission lead magnet : 20% → 40% (+100%)
- [ ] Réduction du taux de rebond : -15%

### Semaine 4
- [ ] Conversion guest → photographe : +5-10%
- [ ] Taux de parrainage : 5%

---

## ✅ Checklist de Déploiement

### Avant de Déployer
- [ ] Tests A/B configurés (Optimizely/VWO)
- [ ] Analytics events trackés (Mixpanel/Amplitude)
- [ ] Emails testés (preview + spam check)
- [ ] Cron jobs configurés
- [ ] Rollback plan préparé

### Après Déploiement
- [ ] Monitorer les métriques en temps réel (24h)
- [ ] Vérifier les emails de relance (logs)
- [ ] Collecter feedback utilisateurs
- [ ] Ajuster si nécessaire

---

**Prochaine révision** : Chaque lundi pendant 4 semaines  
**Responsable** : Product Team
