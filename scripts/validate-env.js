#!/usr/bin/env node

/**
 * Environment variable validation script
 * Run before deployment to ensure all required variables are set
 */

const requiredVariables = [
  'OPENAI_API_KEY',
  'OPENAI_ASSISTANT_UNIVERSAL',
  'OPENAI_ASSISTANT_PLATFORM_DETECTION',
  'OPENAI_ASSISTANT_SUPPORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalVariables = [
  'OPENAI_ASSISTANT_ELECTRONICS',
  'OPENAI_ASSISTANT_FASHION',
  'OPENAI_ASSISTANT_BEAUTY',
  'NEXT_PUBLIC_WAYFORPAY_MERCHANT_ACCOUNT',
  'WAYFORPAY_SECRET_KEY',
  'NEXT_PUBLIC_WAYFORPAY_DOMAIN',
  'ERROR_TRACKING_URL',
  'ERROR_TRACKING_API_KEY',
  'NEXT_PUBLIC_ANALYTICS_ID',
  'PERFORMANCE_MONITORING_URL',
  'CSRF_SECRET',
  'NEXT_PUBLIC_CDN_URL',
  'REDIS_URL'
];

// Check required variables
const missingRequired = requiredVariables.filter(
  variable => !process.env[variable]
);

// Check optional variables
const missingOptional = optionalVariables.filter(
  variable => !process.env[variable]
);

// Log results
if (missingRequired.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingRequired.forEach(variable => {
    console.error(`   - ${variable}`);
  });
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}

if (missingOptional.length > 0) {
  console.warn('⚠️ Missing optional environment variables:');
  missingOptional.forEach(variable => {
    console.warn(`   - ${variable}`);
  });
}

// Validate specific variables
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.error('❌ OPENAI_API_KEY appears to be invalid (should start with sk-)');
  process.exit(1);
}

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgresql://')) {
  console.error('❌ DATABASE_URL appears to be invalid (should be a PostgreSQL connection string)');
  process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ JWT_SECRET is too short (should be at least 32 characters)');
}

console.log('✅ Environment validation completed successfully');