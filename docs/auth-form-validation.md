# Validation de formulaire d'authentification

## Vue d'ensemble

La page d'authentification utilise **React Hook Form** combiné avec **Zod** pour une validation en temps réel performante et une excellente expérience utilisateur.

## Technologies utilisées

- **React Hook Form** (`react-hook-form`) - Gestion de formulaires performante avec validation
- **Zod** (`zod`) - Schémas de validation TypeScript-first
- **@hookform/resolvers** - Intégration entre React Hook Form et Zod

## Architecture

### Schémas de validation Zod

Trois schémas distincts pour chaque étape du processus d'authentification:

```typescript
// Sign In - Email + Password
const signInSchema = z.object({
  email: z.string().email({ message: t('auth.errors.invalidEmail') }),
  password: z.string().min(6, { message: t('auth.errors.passwordTooShort') }),
});

// Sign Up Step 1 - Email uniquement
const signUpStep1Schema = z.object({
  email: z.string().email({ message: t('auth.errors.invalidEmail') }),
});

// Sign Up Step 2 - Password + Confirmation + Terms
const signUpStep2Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, { message: t('auth.errors.passwordTooShort') }),
  confirmPassword: z.string(),
  name: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: t('auth.errors.termsRequired'),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: t('auth.errors.passwordMismatch'),
  path: ['confirmPassword'],
});
```

### Instances React Hook Form

Trois instances de formulaire séparées pour une meilleure isolation:

```typescript
// Sign In Form
const signInForm = useForm({
  resolver: zodResolver(signInSchema),
  mode: 'onChange', // Validation en temps réel
  defaultValues: {
    email: '',
    password: '',
  },
});

// Sign Up Step 1 Form
const signUpStep1Form = useForm({
  resolver: zodResolver(signUpStep1Schema),
  mode: 'onChange',
  defaultValues: {
    email: '',
  },
});

// Sign Up Step 2 Form
const signUpStep2Form = useForm({
  resolver: zodResolver(signUpStep2Schema),
  mode: 'onChange',
  defaultValues: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeTerms: false,
  },
});
```

## Fonctionnalités

### 1. Validation en temps réel

- **Mode `onChange`**: La validation se déclenche à chaque modification de champ
- **Feedback immédiat**: Les erreurs s'affichent instantanément
- **Bordures colorées**: Rouge pour les erreurs, bleu pour le focus normal

### 2. Messages d'erreur contextuels

Chaque champ affiche son propre message d'erreur:

```tsx
{signInForm.formState.errors.email && (
  <p className="mt-2 text-sm text-red-600">
    {signInForm.formState.errors.email.message}
  </p>
)}
```

### 3. Validation personnalisée

#### Correspondance des mots de passe

```typescript
.refine(data => data.password === data.confirmPassword, {
  message: t('auth.errors.passwordMismatch'),
  path: ['confirmPassword'], // L'erreur s'affiche sur le champ confirmPassword
});
```

#### Acceptation des conditions

```typescript
agreeTerms: z.boolean().refine(val => val === true, {
  message: t('auth.errors.termsRequired'),
})
```

### 4. Gestion des étapes (Sign Up)

Le formulaire d'inscription est divisé en 3 étapes:

1. **Step 1**: Email uniquement
2. **Step 2**: Password + Confirmation + Terms
3. **Step 3**: Vérification email (affichage uniquement)

Le transfert de données entre les étapes:

```typescript
const handleSignUpStep1 = async (data: z.infer<typeof signUpStep1Schema>) => {
  // Transfer email to step 2 form
  signUpStep2Form.setValue('email', data.email);
  setSignupStep(2);
};
```

## Avantages

### Performance

- **Pas de re-renders inutiles**: React Hook Form utilise des refs non contrôlés
- **Validation optimisée**: Zod est extrêmement rapide
- **Debouncing automatique**: Pas besoin de setTimeout manuel

### Expérience utilisateur

- **Feedback instantané**: L'utilisateur sait immédiatement si sa saisie est valide
- **Messages clairs**: Erreurs traduites et contextuelles
- **Indicateurs visuels**: Bordures colorées, icônes, animations

### Maintenabilité

- **Type-safe**: TypeScript infère les types depuis les schémas Zod
- **Centralisé**: Toute la logique de validation dans les schémas
- **Réutilisable**: Les schémas peuvent être partagés avec le backend

## Exemple d'utilisation

### Enregistrement d'un champ

```tsx
<input
  type="email"
  {...signInForm.register('email')}
  className={`... ${
    signInForm.formState.errors.email
      ? 'border-red-300'
      : 'border-slate-300'
  }`}
/>
```

### Soumission du formulaire

```tsx
<form onSubmit={signInForm.handleSubmit(handleSignIn)}>
  {/* ... */}
</form>
```

### Handler de soumission

```typescript
const handleSignIn = async (data: z.infer<typeof signInSchema>) => {
  // data est typé et validé automatiquement
  const result = await signIn('credentials', {
    email: data.email,
    password: data.password,
    redirect: false,
  });
};
```

## Comparaison avec l'ancienne implémentation

### Avant (validation manuelle)

```typescript
// ❌ Complexe, verbeux, sujet aux erreurs
const [emailError, setEmailError] = useState<string | null>(null);
const emailValidationTimerRef = useRef<NodeJS.Timeout | null>(null);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (emailValidationTimerRef.current) {
    clearTimeout(emailValidationTimerRef.current);
  }
  emailValidationTimerRef.current = setTimeout(() => {
    try {
      emailSchema.parse(value);
      setEmailError(null);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.issues[0].message);
      }
    }
  }, 500);
};
```

### Après (React Hook Form + Zod)

```typescript
// ✅ Simple, déclaratif, type-safe
const signInForm = useForm({
  resolver: zodResolver(signInSchema),
  mode: 'onChange',
});

<input {...signInForm.register('email')} />
```

## Ressources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
