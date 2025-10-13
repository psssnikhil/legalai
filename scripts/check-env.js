#!/usr/bin/env node

/**
 * Environment Variables Checker
 * 
 * This script verifies that all required environment variables are set
 * Run before deployment or when troubleshooting configuration issues
 * 
 * Usage: node scripts/check-env.js
 */

const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
];

const optionalEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'AWS_S3_REGION',
];

console.log('🔍 Checking Environment Variables...\n');
console.log('═'.repeat(60));

// Check required variables
console.log('\n📋 REQUIRED VARIABLES:\n');
let missingRequired = [];
let allRequired = true;

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    const status = isSet ? '✅' : '❌';

    if (isSet) {
        // Show partial value for security
        const displayValue = value.length > 20
            ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
            : '***';
        console.log(`${status} ${varName.padEnd(20)} : ${displayValue}`);
    } else {
        console.log(`${status} ${varName.padEnd(20)} : MISSING`);
        missingRequired.push(varName);
        allRequired = false;
    }
});

// Check optional variables
console.log('\n📦 OPTIONAL VARIABLES:\n');
let hasOptional = false;

optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    const isSet = !!value;
    const status = isSet ? '✅' : '⚪';

    if (isSet) {
        hasOptional = true;
        const displayValue = '***';
        console.log(`${status} ${varName.padEnd(20)} : ${displayValue}`);
    } else {
        console.log(`${status} ${varName.padEnd(20)} : Not set (optional)`);
    }
});

// Validate DATABASE_URL format
console.log('\n🔍 VALIDATION CHECKS:\n');

if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl.startsWith('postgresql://')) {
        console.log('✅ DATABASE_URL format: PostgreSQL (correct for production)');

        if (dbUrl.includes('sslmode=require')) {
            console.log('✅ DATABASE_URL includes SSL (recommended)');
        } else {
            console.log('⚠️  DATABASE_URL missing SSL mode (add ?sslmode=require)');
        }
    } else if (dbUrl.startsWith('file:')) {
        console.log('⚠️  DATABASE_URL format: SQLite (not suitable for Vercel production)');
        console.log('   Migrate to PostgreSQL for production deployment');
    } else {
        console.log('❌ DATABASE_URL format: Unknown or invalid');
    }
} else {
    console.log('❌ DATABASE_URL not set');
}

// Validate OpenAI API Key format
if (process.env.OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey.startsWith('sk-')) {
        console.log('✅ OPENAI_API_KEY format: Valid');
    } else {
        console.log('❌ OPENAI_API_KEY format: Invalid (should start with sk-)');
    }
} else {
    console.log('❌ OPENAI_API_KEY not set');
}

// Validate NEXTAUTH_URL format
if (process.env.NEXTAUTH_URL) {
    const authUrl = process.env.NEXTAUTH_URL;

    if (authUrl.startsWith('http://') || authUrl.startsWith('https://')) {
        console.log('✅ NEXTAUTH_URL format: Valid');

        if (authUrl.endsWith('/')) {
            console.log('⚠️  NEXTAUTH_URL has trailing slash (remove it)');
        }

        if (authUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
            console.log('⚠️  NEXTAUTH_URL points to localhost in production environment');
        }
    } else {
        console.log('❌ NEXTAUTH_URL format: Invalid (should start with http:// or https://)');
    }
} else {
    console.log('❌ NEXTAUTH_URL not set');
}

// Validate NEXTAUTH_SECRET length
if (process.env.NEXTAUTH_SECRET) {
    const secret = process.env.NEXTAUTH_SECRET;

    if (secret.length >= 32) {
        console.log('✅ NEXTAUTH_SECRET length: Sufficient');
    } else {
        console.log('⚠️  NEXTAUTH_SECRET length: Too short (should be 32+ characters)');
    }
} else {
    console.log('❌ NEXTAUTH_SECRET not set');
}

// Check S3 configuration completeness
if (hasOptional) {
    const s3Vars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_S3_BUCKET_NAME',
        'AWS_S3_REGION'
    ];

    const s3VarsSet = s3Vars.filter(v => process.env[v]);

    if (s3VarsSet.length > 0 && s3VarsSet.length < s3Vars.length) {
        console.log(`⚠️  S3 configuration incomplete (${s3VarsSet.length}/${s3Vars.length} variables set)`);
        console.log('   Either set all S3 variables or remove all S3 variables');
    } else if (s3VarsSet.length === s3Vars.length) {
        console.log('✅ S3 configuration: Complete');
    }
}

// Environment detection
console.log('\n🌍 ENVIRONMENT DETECTION:\n');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Vercel: ${process.env.VERCEL ? 'Yes' : 'No'}`);
if (process.env.VERCEL_ENV) {
    console.log(`Vercel Environment: ${process.env.VERCEL_ENV}`);
}

// Final summary
console.log('\n═'.repeat(60));
console.log('\n📊 SUMMARY:\n');

if (allRequired) {
    console.log('✅ All required environment variables are set!');
    console.log('✅ Your configuration looks good.');

    if (hasOptional) {
        console.log('✅ Optional S3 variables are configured.');
    } else {
        console.log('ℹ️  S3 variables not configured (documents stored in memory).');
    }

    console.log('\n🚀 You\'re ready to deploy!\n');
    process.exit(0);
} else {
    console.log(`❌ Missing ${missingRequired.length} required environment variable(s):`);
    missingRequired.forEach(v => console.log(`   - ${v}`));

    console.log('\n📖 How to fix:');
    console.log('\n   Local Development:');
    console.log('   1. Create .env.local file in project root');
    console.log('   2. Add missing variables with their values');
    console.log('   3. Restart your development server');

    console.log('\n   Vercel Production:');
    console.log('   1. Go to Vercel Dashboard → Your Project');
    console.log('   2. Navigate to Settings → Environment Variables');
    console.log('   3. Add missing variables');
    console.log('   4. Redeploy your application');

    console.log('\n📚 Documentation:');
    console.log('   See ENVIRONMENT_VARIABLES.md for detailed instructions\n');

    process.exit(1);
}

