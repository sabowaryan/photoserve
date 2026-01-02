# Requirements Document

## Introduction

Cette fonctionnalité ajoute l'intégration de SerdipPay comme passerelle de paiement mobile money pour les utilisateurs en RDC (République Démocratique du Congo). SerdipPay permet d'accepter les paiements via Orange Money, Airtel Money et M-Pesa (Vodacom), en complément du système Stripe existant.

## Glossary

- **SerdipPay**: Passerelle de paiement mobile money opérant en RDC, supportant Orange Money, Airtel Money et M-Pesa
- **Mobile_Money**: Service de paiement mobile permettant aux utilisateurs d'effectuer des transactions via leur téléphone
- **Payment_Provider**: Opérateur de paiement (Orange, Airtel, Vodacom/M-Pesa)
- **Transaction**: Opération de paiement initiée par un utilisateur
- **Webhook**: Callback HTTP envoyé par SerdipPay pour notifier le statut d'une transaction
- **Checkout_Session**: Session de paiement temporaire créée pour une transaction
- **Payment_Service**: Service backend gérant les opérations de paiement

## Requirements

### Requirement 1: Configuration du Client SerdipPay

**User Story:** As a developer, I want to configure the SerdipPay API client, so that the application can communicate with the SerdipPay payment gateway.

#### Acceptance Criteria

1. THE Payment_Service SHALL require SERDIPAY_API_KEY and SERDIPAY_MERCHANT_ID environment variables
2. THE Payment_Service SHALL provide a configured HTTP client for SerdipPay API calls
3. IF SERDIPAY_API_KEY is missing, THEN THE Payment_Service SHALL throw a configuration error
4. THE Payment_Service SHALL support both sandbox and production environments via SERDIPAY_ENVIRONMENT variable

### Requirement 2: Initiation de Paiement Mobile Money

**User Story:** As a user, I want to initiate a payment using my mobile money account (Orange, Airtel, or M-Pesa), so that I can subscribe to a plan without needing a credit card.

#### Acceptance Criteria

1. WHEN a user selects mobile money payment, THE Payment_Service SHALL display Orange Money, Airtel Money, and M-Pesa as options
2. WHEN a user initiates a mobile money payment, THE Payment_Service SHALL collect the user's phone number
3. WHEN a payment is initiated, THE Payment_Service SHALL create a transaction with SerdipPay API
4. WHEN a transaction is created, THE Payment_Service SHALL return a transaction reference to the user
5. IF the phone number format is invalid, THEN THE Payment_Service SHALL reject the payment request with a validation error

### Requirement 3: Traitement des Webhooks SerdipPay

**User Story:** As a system, I want to receive and process payment status updates from SerdipPay, so that user subscriptions are activated upon successful payment.

#### Acceptance Criteria

1. WHEN SerdipPay sends a webhook notification, THE Payment_Service SHALL validate the webhook signature
2. WHEN a payment is successful, THE Payment_Service SHALL update the user's subscription status
3. WHEN a payment fails, THE Payment_Service SHALL mark the transaction as failed and notify the user
4. IF the webhook signature is invalid, THEN THE Payment_Service SHALL reject the webhook with 401 status
5. THE Payment_Service SHALL store all webhook events for audit purposes

### Requirement 4: Vérification du Statut de Transaction

**User Story:** As a user, I want to check the status of my mobile money payment, so that I know if my subscription is active.

#### Acceptance Criteria

1. WHEN a user requests transaction status, THE Payment_Service SHALL query SerdipPay API for the current status
2. THE Payment_Service SHALL return one of: pending, success, failed, or expired
3. WHEN a transaction is pending, THE Payment_Service SHALL display instructions for completin