# Quick Fix: Cloudflare Error 1001 pour photo.joventy.cd

## Le Problème

Vous voyez cette erreur en visitant `photo.joventy.cd` :
```
Error 1001: DNS resolution error
```

## Cause

Le domaine `photo.joventy.cd` n'a pas de configuration DNS correcte. Cloudflare ne peut pas trouver où pointer le domaine.

## Solution Rapide (5 minutes)

### Étape 1: Configurer le DNS chez votre registrar

Allez sur le site où vous avez acheté `joventy.cd` (votre registrar de domaine) et ajoutez cet enregistrement DNS :

```
Type:    CNAME
Nom:     photo
Valeur:  piksend.com
TTL:     3600
```

**Exemples selon les registrars:**

#### Namecheap
1. Allez dans "Advanced DNS"
2. Cliquez "Add New Record"
3. Type: CNAME Record
4. Host: `photo`
5. Value: `piksend.com`
6. TTL: Automatic

#### GoDaddy
1. Allez dans "DNS Management"
2. Cliquez "Add"
3. Type: CNAME
4. Name: `photo`
5. Value: `piksend.com`
6. TTL: 1 Hour

#### Cloudflare (si c'est aussi votre registrar)
1. Allez dans "DNS" → "Records"
2. Cliquez "Add record"
3. Type: CNAME
4. Name: `photo`
5. Target: `piksend.com`
6. Proxy status: Proxied (nuage orange)
7. TTL: Auto

#### OVH
1. Allez dans "Zone DNS"
2. Cliquez "Ajouter une entrée"
3. Type: CNAME
4. Sous-domaine: `photo`
5. Cible: `piksend.com`
6. TTL: 3600

### Étape 2: Attendre la propagation DNS

⏱️ **Temps d'attente:** 5 minutes à 2 heures (parfois jusqu'à 48h)

Pendant ce temps:
- ☕ Prenez un café
- 🚫 Ne faites PAS d'autres modifications DNS
- 🔄 Ne rafraîchissez pas constamment la page

### Étape 3: Vérifier la propagation

Utilisez cet outil en ligne:
👉 https://dnschecker.org

1. Entrez: `photo.joventy.cd`
2. Type: CNAME
3. Cliquez "Search"

**Résultat attendu:** Devrait montrer `piksend.com` en vert ✅

### Étape 4: Tester votre domaine

Une fois que dnschecker.org montre des résultats verts:

1. Videz le cache de votre navigateur (Ctrl+Shift+Delete)
2. Essayez en navigation privée
3. Visitez: `https://photo.joventy.cd`

## Vérification Rapide

Ouvrez un terminal et tapez:

```bash
nslookup photo.joventy.cd
```

**Si ça marche, vous verrez:**
```
Server:  ...
Address: ...

Non-authoritative answer:
photo.joventy.cd    canonical name = piksend.com
```

**Si ça ne marche pas encore, vous verrez:**
```
*** Can't find photo.joventy.cd: Non-existent domain
```
→ Attendez encore un peu pour la propagation DNS

## Problèmes Courants

### "Je ne trouve pas où configurer le DNS"

Cherchez dans votre registrar de domaine:
- "DNS Management"
- "DNS Settings"
- "Zone DNS"
- "Advanced DNS"
- "Name Servers"

### "J'ai ajouté le CNAME mais ça ne marche toujours pas"

1. Vérifiez que vous avez bien mis:
   - Nom: `photo` (pas `photo.joventy.cd`)
   - Valeur: `piksend.com` (pas `https://piksend.com`)

2. Attendez au moins 30 minutes

3. Vérifiez sur dnschecker.org

### "Ça marche sur mon téléphone mais pas sur mon ordinateur"

C'est normal pendant la propagation DNS. Solutions:
- Videz le cache DNS de votre ordinateur
- Attendez encore un peu
- Essayez avec un VPN ou un autre réseau

### "J'ai un message d'erreur SSL après"

C'est normal ! Une fois le DNS configuré:
1. Retournez dans votre application PikSend
2. Allez dans Paramètres → Branding
3. Cliquez sur "Provisionner SSL"
4. Attendez 5-10 minutes

## Commandes pour Vider le Cache DNS

Si le domaine fonctionne sur d'autres appareils mais pas le vôtre:

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

## Timeline Typique

| Temps | Étape |
|-------|-------|
| 0 min | Ajout du CNAME chez le registrar |
| 5-10 min | Premiers serveurs DNS voient le changement |
| 30 min | La plupart des serveurs DNS sont à jour |
| 1-2h | Propagation complète dans la plupart des cas |
| 24-48h | Propagation garantie partout dans le monde |

## Besoin d'Aide ?

Si après 48 heures le problème persiste:

1. Vérifiez que le CNAME est bien configuré chez votre registrar
2. Consultez le guide complet: `docs/troubleshooting/cloudflare-error-1001.md`
3. Contactez le support de votre registrar de domaine
4. Vérifiez que votre domaine `joventy.cd` est actif et payé

## Résumé en 3 Étapes

1. ✅ Ajoutez un CNAME `photo` → `piksend.com` chez votre registrar
2. ⏱️ Attendez 30 minutes à 2 heures
3. 🎉 Testez `https://photo.joventy.cd`

**C'est tout !** La propagation DNS prend du temps, c'est normal. Soyez patient.
