-- Update free plan max expiration days from 30 to 7
UPDATE subscription_plans 
SET max_expiration_days = 7 
WHERE name = 'free';