# Guide de Tests d'Accessibilité WCAG 2.1 AA - PikSend Sales Funnel

**Task:** 4.9 Tests accessibilité WCAG 2.1 AA  
**Requirements:** 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7

## Vue d'ensemble

Ce document fournit un guide complet pour tester l'accessibilité du tunnel de vente PikSend selon les standards WCAG 2.1 niveau AA.

## Tests Automatisés

### Tests Implémentés

✅ **Tests vitest-axe** - Tests automatisés d'accessibilité utilisant axe-core:
- `src/components/conversion/__tests__/accessibility.test.tsx` - 40+ tests
- `src/components/landing/__tests__/accessibility.test.tsx` - 35+ tests  
- `src/components/dashboard/__tests__/accessibility.test.tsx` - 48+ tests

**Exécution:**
```bash
npm test -- accessibility.test.tsx
```

### Couverture des Tests Automatisés

| Requirement | Description | Tests Automatisés | Tests Manuels Requis |
|-------------|-------------|-------------------|----------------------|
| 22.1 | WCAG 2.1 AA minimum | ✅ axe-core | ✅ Validation complète |
| 22.2 | Navigation clavier | ✅ Partiel | ✅ Tests complets |
| 22.3 | Labels ARIA | ✅ Oui | ⚠️ Vérification |
| 22.4 | Contraste 4.5:1 | ✅ axe-core | ✅ Vérification visuelle |
| 22.5 | Alt text images/vidéos | ✅ Oui | ✅ Vérification contenu |
| 22.6 | Zoom 200% | ⚠️ Partiel | ✅ Tests navigateur |
| 22.7 | Screen readers | ❌ Non | ✅ Tests complets |

## Tests Manuels Requis

### 1. Navigation Clavier Complète (Req 22.2)

#### Composants à Tester

**PersonaQuiz Modal:**
- [ ] Tab pour naviguer entre les options radio
- [ ] Flèches haut/bas pour sélectionner les options
- [ ] Enter/Space pour sélectionner
- [ ] Tab pour atteindre le bouton "Suivant"
- [ ] Enter pour soumettre
- [ ] Escape pour fermer le modal
- [ ] Focus piégé dans le modal (ne sort pas)

**ROI Calculator:**
- [ ] Tab pour naviguer entre les 3 inputs
- [ ] Flèches haut/bas pour incrémenter/décrémenter
- [ ] Entrée directe au clavier fonctionne
- [ ] Tab pour atteindre les résultats (si interactifs)

**ComparisonTable:**
- [ ] Tab pour naviguer entre les liens/boutons
- [ ] Lecture logique de gauche à droite, haut en bas
- [ ] Pas de piège de focus

**SoftSignupModal:**
- [ ] Tab entre email, password, profil
- [ ] Enter pour soumettre chaque étape
- [ ] Escape pour fermer
- [ ] Focus piégé dans le modal
- [ ] Bouton "Afficher mot de passe" accessible au clavier

**OnboardingGuide:**
- [ ] Tab entre les tâches
- [ ] Enter/Space pour cocher les tâches
- [ ] Tab vers le bouton "Fermer"
- [ ] Tous les liens d'action accessibles

**SupportWidget:**
- [ ] Tab pour focus sur le bouton
- [ ] Enter/Space pour ouvrir
- [ ] Tab dans le widget ouvert
- [ ] Escape pour fermer
- [ ] Focus retourne au bouton après fermeture

#### Checklist Générale Navigation Clavier

- [ ] Tous les éléments interactifs accessibles au clavier
- [ ] Ordre de tabulation logique
- [ ] Indicateurs de focus visibles (ring, outline)
- [ ] Pas de pièges de clavier
- [ ] Raccourcis clavier documentés (si applicable)
- [ ] Skip links fonctionnels ("Aller au contenu")

### 2. Tests Screen Readers (Req 22.7)

#### Screen Readers à Tester

**Windows:**
- [ ] NVDA (gratuit) - https://www.nvaccess.org/
- [ ] JAWS (payant, essai disponible) - https://www.freedomscientific.com/

**macOS:**
- [ ] VoiceOver (intégré) - Cmd+F5

**Mobile:**
- [ ] TalkBack (Android)
- [ ] VoiceOver (iOS)

#### Tests par Composant

**PersonaQuiz:**
- [ ] Titre du modal annoncé
- [ ] Questions annoncées clairement
- [ ] Options radio annoncées avec état (sélectionné/non sélectionné)
- [ ] Progression annoncée ("Étape 1 sur 3")
- [ ] Boutons annoncés avec leur fonction

**ROI Calculator:**
- [ ] Labels des inputs annoncés
- [ ] Valeurs actuelles annoncées
- [ ] Résultats annoncés (aria-live)
- [ ] Unités annoncées (€, %, mois)

**ComparisonTable:**
- [ ] Caption du tableau annoncé
- [ ] En-têtes de colonnes annoncés
- [ ] En-têtes de lignes annoncés
- [ ] Cellules associées aux en-têtes
- [ ] Checkmarks/crosses annoncés (pas juste l'icône)

**Landing Pages:**
- [ ] Structure de page claire (header, nav, main, footer)
- [ ] Headings hiérarchiques (h1 → h2 → h3)
- [ ] Images avec alt text descriptif
- [ ] Liens avec texte descriptif (pas "cliquez ici")
- [ ] Badges et trust indicators annoncés

**Testimonial Video:**
- [ ] Contrôles vidéo accessibles
- [ ] Bouton play annoncé
- [ ] Auteur et rôle annoncés
- [ ] Citation annoncée comme blockquote
- [ ] Métriques annoncées

**OnboardingGuide:**
- [ ] Titre annoncé
- [ ] Progress bar annoncée avec pourcentage
- [ ] Liste de tâches annoncée
- [ ] État des tâches annoncé (complété/non complété)
- [ ] Célébrations annoncées (aria-live)

#### Checklist Générale Screen Readers

- [ ] Landmarks correctement identifiés (banner, navigation, main, complementary, contentinfo)
- [ ] Headings hiérarchiques (pas de saut de niveau)
- [ ] Liens descriptifs (contexte clair)
- [ ] Boutons vs liens utilisés correctement
- [ ] Images décoratives ignorées (alt="" ou aria-hidden)
- [ ] Images informatives avec alt descriptif
- [ ] Formulaires avec labels associés
- [ ] Erreurs annoncées (aria-live, role="alert")
- [ ] Changements dynamiques annoncés (aria-live)
- [ ] Langue de la page définie (lang="fr")

### 3. Contraste de Couleurs (Req 22.4)

#### Outils de Test

**Automatiques:**
- [ ] axe DevTools (extension Chrome/Firefox)
- [ ] WAVE (extension Chrome/Firefox)
- [ ] Lighthouse (Chrome DevTools)

**Manuels:**
- [ ] WebAIM Contrast Checker - https://webaim.org/resources/contrastchecker/
- [ ] Colour Contrast Analyser (CCA) - https://www.tpgi.com/color-contrast-checker/

#### Combinaisons à Vérifier

**Texte Normal (4.5:1 minimum):**
- [ ] Texte noir sur blanc (slate-900 sur white)
- [ ] Texte gris sur blanc (gray-600 sur white)
- [ ] Texte blanc sur indigo (white sur indigo-600)
- [ ] Texte blanc sur slate foncé (white sur slate-900)
- [ ] Liens bleus sur blanc (blue-600 sur white)

**Texte Large (3:1 minimum, 18pt+ ou 14pt+ gras):**
- [ ] Headings sur fond clair
- [ ] Headings sur fond foncé
- [ ] Boutons avec texte large

**Éléments UI (3:1 minimum):**
- [ ] Bordures de formulaires (focus et non-focus)
- [ ] Icônes fonctionnelles
- [ ] Indicateurs de focus
- [ ] Graphiques et visualisations

**États Interactifs:**
- [ ] Hover states
- [ ] Focus states
- [ ] Active states
- [ ] Disabled states (si utilisé)

#### Zones Critiques

- [ ] Hero sections (texte sur images/gradients)
- [ ] Badges et trust indicators
- [ ] Boutons CTA primaires et secondaires
- [ ] Texte dans les modals
- [ ] Messages d'erreur
- [ ] Liens dans le texte
- [ ] Navigation (active vs inactive)

### 4. Zoom 200% (Req 22.6)

#### Procédure de Test

**Chrome/Edge:**
1. Ouvrir DevTools (F12)
2. Ctrl/Cmd + pour zoomer à 200%
3. Ou: Menu → Zoom → 200%

**Firefox:**
1. Ctrl/Cmd + pour zoomer à 200%
2. Ou: Menu → Zoom → Zoom In

**Safari:**
1. Cmd + pour zoomer à 200%
2. Ou: View → Zoom In

#### Checklist par Page

**Homepage:**
- [ ] Hero section lisible
- [ ] Badges visibles
- [ ] CTAs accessibles
- [ ] Navigation utilisable
- [ ] Pas de scroll horizontal
- [ ] Texte ne se chevauche pas

**Landing Pages Persona:**
- [ ] Hero personnalisé lisible
- [ ] ROI Calculator utilisable
- [ ] Tableau comparatif lisible (scroll horizontal OK)
- [ ] Testimonials lisibles
- [ ] FAQ lisible
- [ ] Footer accessible

**Pricing Page:**
- [ ] Plans tarifaires lisibles
- [ ] ROI Calculator utilisable
- [ ] Boutons accessibles
- [ ] Tableau comparatif lisible

**Dashboard:**
- [ ] Navigation latérale utilisable
- [ ] OnboardingGuide lisible
- [ ] Cartes de galeries accessibles
- [ ] Support widget accessible
- [ ] Pas de contenu caché

**Modals:**
- [ ] PersonaQuiz lisible
- [ ] SoftSignupModal utilisable
- [ ] UpgradeModal lisible
- [ ] Boutons accessibles

#### Critères de Réussite

- [ ] Pas de scroll horizontal (sauf tableaux)
- [ ] Tout le contenu visible
- [ ] Tous les boutons cliquables
- [ ] Tous les formulaires utilisables
- [ ] Texte ne se chevauche pas
- [ ] Images ne débordent pas
- [ ] Navigation fonctionnelle

### 5. Alternatives Textuelles (Req 22.5)

#### Images

**Checklist:**
- [ ] Toutes les images ont un attribut alt
- [ ] Images décoratives: alt="" ou aria-hidden="true"
- [ ] Images informatives: alt descriptif (>10 caractères)
- [ ] Logos: alt avec nom de l'entreprise
- [ ] Photos de personnes: alt avec nom et rôle
- [ ] Screenshots: alt décrivant le contenu
- [ ] Graphiques: alt + description longue si complexe

**Composants à Vérifier:**
- [ ] Hero images (landing pages)
- [ ] Testimonial author photos
- [ ] Competitor logos (ComparisonTable)
- [ ] Trust badges
- [ ] Gallery thumbnails
- [ ] Avatar images

#### Vidéos

**Checklist:**
- [ ] Contrôles natifs accessibles
- [ ] Bouton play avec aria-label
- [ ] Sous-titres disponibles (captions)
- [ ] Transcription disponible ou lien vers transcription
- [ ] Pas de lecture automatique
- [ ] Pause/play au clavier

**Composants à Vérifier:**
- [ ] TestimonialVideo component
- [ ] Demo videos (si applicable)
- [ ] Tutorial videos (si applicable)

#### Icônes

**Checklist:**
- [ ] Icônes décoratives: aria-hidden="true"
- [ ] Icônes fonctionnelles: aria-label sur le parent
- [ ] Icônes dans boutons: texte visible ou aria-label
- [ ] Icônes de statut: texte sr-only ou aria-label

### 6. Labels ARIA (Req 22.3)

#### Attributs ARIA à Vérifier

**Roles:**
- [ ] dialog (modals)
- [ ] navigation (nav)
- [ ] banner (header)
- [ ] main (main content)
- [ ] contentinfo (footer)
- [ ] complementary (sidebar)
- [ ] alert (erreurs)
- [ ] status (succès, info)
- [ ] progressbar (OnboardingGuide)
- [ ] tablist, tab, tabpanel (si tabs)

**Labels:**
- [ ] aria-label sur éléments sans texte visible
- [ ] aria-labelledby pour associer labels
- [ ] aria-describedby pour descriptions/erreurs

**États:**
- [ ] aria-expanded (dropdowns, accordions)
- [ ] aria-hidden (éléments cachés)
- [ ] aria-current="page" (navigation)
- [ ] aria-invalid (erreurs de formulaire)
- [ ] aria-required (champs requis)
- [ ] aria-disabled (éléments désactivés)
- [ ] aria-checked (checkboxes, radios)

**Live Regions:**
- [ ] aria-live="polite" (notifications)
- [ ] aria-live="assertive" (erreurs critiques)
- [ ] role="alert" (erreurs)
- [ ] role="status" (succès)

## Outils de Test Recommandés

### Extensions Navigateur

1. **axe DevTools** (Chrome, Firefox, Edge)
   - Tests automatiques complets
   - Suggestions de correction
   - Gratuit

2. **WAVE** (Chrome, Firefox)
   - Visualisation des problèmes
   - Annotations sur la page
   - Gratuit

3. **Lighthouse** (Chrome DevTools intégré)
   - Score d'accessibilité
   - Audit complet
   - Gratuit

4. **HeadingsMap** (Chrome, Firefox)
   - Visualise la hiérarchie des headings
   - Gratuit

5. **Colour Contrast Analyser** (Application desktop)
   - Test de contraste précis
   - Pipette de couleur
   - Gratuit

### Screen Readers

1. **NVDA** (Windows) - Gratuit
   - https://www.nvaccess.org/
   - Raccourcis: Insert pour modifier, Flèches pour naviguer

2. **JAWS** (Windows) - Payant (essai gratuit)
   - https://www.freedomscientific.com/
   - Le plus utilisé professionnellement

3. **VoiceOver** (macOS, iOS) - Intégré
   - macOS: Cmd+F5 pour activer
   - iOS: Réglages → Accessibilité → VoiceOver

4. **TalkBack** (Android) - Intégré
   - Réglages → Accessibilité → TalkBack

### Outils en Ligne

1. **WebAIM Contrast Checker**
   - https://webaim.org/resources/contrastchecker/
   - Test de contraste rapide

2. **WAVE Web Accessibility Evaluation Tool**
   - https://wave.webaim.org/
   - Test d'une URL complète

3. **HTML Validator**
   - https://validator.w3.org/
   - Validation HTML (base de l'accessibilité)

## Procédure de Test Complète

### Phase 1: Tests Automatisés (30 min)

1. **Exécuter les tests vitest-axe:**
   ```bash
   npm test -- accessibility.test.tsx
   ```
   - Vérifier que tous les tests passent
   - Corriger les violations détectées

2. **Lighthouse dans Chrome DevTools:**
   - Ouvrir chaque page clé
   - Exécuter l'audit Accessibility
   - Viser score 90+
   - Corriger les problèmes détectés

3. **axe DevTools extension:**
   - Scanner chaque page
   - Corriger les violations critiques
   - Documenter les faux positifs

### Phase 2: Tests Clavier (1h)

1. **Débrancher la souris** (recommandé)
2. **Tester chaque composant** selon checklist ci-dessus
3. **Documenter les problèmes:**
   - Éléments non accessibles
   - Ordre de tabulation incorrect
   - Focus non visible
   - Pièges de clavier

### Phase 3: Tests Screen Reader (2h)

1. **NVDA (Windows) ou VoiceOver (macOS)**
2. **Tester chaque page** selon checklist ci-dessus
3. **Enregistrer les sessions** (optionnel mais recommandé)
4. **Documenter:**
   - Annonces manquantes
   - Annonces confuses
   - Structure incorrecte
   - Labels manquants

### Phase 4: Tests Visuels (1h)

1. **Contraste de couleurs:**
   - Utiliser Colour Contrast Analyser
   - Vérifier toutes les combinaisons
   - Documenter les ratios

2. **Zoom 200%:**
   - Tester chaque page
   - Vérifier responsive
   - Documenter les débordements

3. **Alternatives textuelles:**
   - Vérifier toutes les images
   - Vérifier toutes les vidéos
   - Vérifier toutes les icônes

### Phase 5: Rapport et Corrections (variable)

1. **Compiler les résultats**
2. **Prioriser les problèmes:**
   - Critiques (bloquants)
   - Majeurs (impact significatif)
   - Mineurs (améliorations)
3. **Créer des tickets**
4. **Implémenter les corrections**
5. **Re-tester**

## Critères de Réussite

### Minimum Viable (WCAG 2.1 AA)

- [ ] Score Lighthouse Accessibility: 90+
- [ ] Aucune violation critique axe-core
- [ ] Navigation clavier complète fonctionnelle
- [ ] Screen reader utilisable (NVDA/VoiceOver)
- [ ] Contraste 4.5:1 minimum (texte normal)
- [ ] Contraste 3:1 minimum (texte large, UI)
- [ ] Zoom 200% sans perte de fonctionnalité
- [ ] Alt text sur toutes les images informatives
- [ ] Labels ARIA appropriés

### Idéal (WCAG 2.1 AAA)

- [ ] Score Lighthouse Accessibility: 95+
- [ ] Contraste 7:1 minimum (texte normal)
- [ ] Contraste 4.5:1 minimum (texte large)
- [ ] Support de tous les screen readers majeurs
- [ ] Zoom 400% fonctionnel
- [ ] Descriptions longues pour images complexes
- [ ] Transcriptions pour toutes les vidéos
- [ ] Sous-titres pour toutes les vidéos

## Ressources

### Documentation WCAG

- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/
- **A11y Project:** https://www.a11yproject.com/
- **MDN Accessibility:** https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Formations

- **Web Accessibility by Google (Udacity):** Gratuit
- **Introduction to Web Accessibility (W3C):** Gratuit
- **Deque University:** Payant, très complet

### Communauté

- **A11y Slack:** https://web-a11y.slack.com/
- **WebAIM Discussion List:** https://webaim.org/discussion/
- **Twitter #a11y:** Communauté active

## Notes de Mise en Œuvre

### Composants Prioritaires

1. **PersonaQuiz** - Point d'entrée critique
2. **SoftSignupModal** - Conversion critique
3. **ROI Calculator** - Différenciateur clé
4. **OnboardingGuide** - Activation utilisateur
5. **Landing Pages** - SEO et conversion

### Problèmes Connus

- [ ] SoftSignupModal: Focus trap à implémenter
- [ ] PersonaQuiz: Annonces aria-live à améliorer
- [ ] TestimonialVideo: Sous-titres à ajouter
- [ ] ComparisonTable: Scroll horizontal à optimiser pour zoom

### Prochaines Étapes

1. Exécuter tous les tests automatisés
2. Corriger les violations critiques
3. Effectuer les tests manuels clavier
4. Effectuer les tests screen reader
5. Vérifier le contraste et le zoom
6. Documenter les résultats
7. Créer un plan de correction
8. Implémenter les corrections
9. Re-tester
10. Valider avec des utilisateurs réels (si possible)

---

**Dernière mise à jour:** 2024
**Responsable:** Équipe PikSend
**Status:** ✅ Tests créés, ⏳ Tests manuels en attente
