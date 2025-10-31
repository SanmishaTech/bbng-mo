#!/usr/bin/env node

/**
 * Build iOS App using EAS Build API
 * 
 * This script triggers an iOS build using the Expo Application Services (EAS) Build API.
 * It can be used for CI/CD pipelines or manual build triggers.
 * 
 * Usage:
 *   node scripts/build-ios.js [profile] [--wait]
 * 
 * Examples:
 *   node scripts/build-ios.js preview
 *   node scripts/build-ios.js preview-simulator
 *   node scripts/build-ios.js production --wait
 *   EAS_TOKEN=your_token node scripts/build-ios.js preview
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ID = '7cfd1d65-2d39-4e08-9d87-7f1231e7baa5';
const BUILD_PROFILE = process.argv[2] || 'preview';
const WAIT_FOR_BUILD = process.argv.includes('--wait');
const EAS_API_URL = 'https://api.expo.dev';

// Get EAS token from environment or try to read from Expo CLI
function getEASToken() {
  // First try environment variable
  if (process.env.EAS_TOKEN) {
    return process.env.EAS_TOKEN;
  }

  // Try to get from expo CLI
  try {
    const token = execSync('expo whoami --json', { encoding: 'utf8' });
    const data = JSON.parse(token);
    if (data.sessionSecret) {
      return data.sessionSecret;
    }
  } catch (error) {
    // Ignore error, will handle below
  }

  // Try to read from expo config
  try {
    const homeDir = require('os').homedir();
    const expoConfig = path.join(homeDir, '.expo', 'state.json');
    if (fs.existsSync(expoConfig)) {
      const state = JSON.parse(fs.readFileSync(expoConfig, 'utf8'));
      if (state.auth && state.auth.sessionSecret) {
        return state.auth.sessionSecret;
      }
    }
  } catch (error) {
    // Ignore error
  }

  return null;
}

// Make HTTPS request
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// Trigger build via EAS API
async function triggerBuild(token) {
  console.log(`🚀 Triggering iOS build with profile: ${BUILD_PROFILE}`);
  
  const buildData = {
    projectId: PROJECT_ID,
    platform: 'ios',
    profile: BUILD_PROFILE,
  };

  const options = {
    hostname: 'api.expo.dev',
    path: '/v2/builds',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Expo-Session': token,
    },
  };

  try {
    const result = await makeRequest(options, buildData);
    console.log('✅ Build triggered successfully!');
    console.log(`📦 Build ID: ${result.id}`);
    console.log(`🔗 Build URL: https://expo.dev/accounts/sanmisha/projects/my-app/builds/${result.id}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to trigger build:', error.message);
    throw error;
  }
}

// Check build status
async function checkBuildStatus(token, buildId) {
  const options = {
    hostname: 'api.expo.dev',
    path: `/v2/builds/${buildId}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Expo-Session': token,
    },
  };

  try {
    const result = await makeRequest(options);
    return result;
  } catch (error) {
    console.error('❌ Failed to check build status:', error.message);
    throw error;
  }
}

// Wait for build completion
async function waitForBuild(token, buildId) {
  console.log('⏳ Waiting for build to complete...');
  
  const maxAttempts = 120; // 1 hour with 30s intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const build = await checkBuildStatus(token, buildId);
    
    console.log(`📊 Build status: ${build.status} (${attempts + 1}/${maxAttempts})`);
    
    if (build.status === 'finished') {
      console.log('✅ Build completed successfully!');
      if (build.artifacts && build.artifacts.buildUrl) {
        console.log(`📥 Download IPA: ${build.artifacts.buildUrl}`);
      }
      return build;
    } else if (build.status === 'errored' || build.status === 'canceled') {
      console.error(`❌ Build ${build.status}`);
      if (build.error) {
        console.error('Error details:', build.error);
      }
      process.exit(1);
    }
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
    attempts++;
  }
  
  console.warn('⏰ Timeout waiting for build');
}

// Main execution
async function main() {
  console.log('🍎 EAS iOS Build Script');
  console.log('─'.repeat(50));
  
  const token = getEASToken();
  
  if (!token) {
    console.error('❌ No EAS token found!');
    console.error('\nPlease either:');
    console.error('  1. Set EAS_TOKEN environment variable');
    console.error('  2. Login with: expo login');
    console.error('  3. Create a token at: https://expo.dev/accounts/sanmisha/settings/access-tokens');
    process.exit(1);
  }

  console.log('✅ EAS token found');
  
  try {
    const build = await triggerBuild(token);
    
    if (WAIT_FOR_BUILD) {
      await waitForBuild(token, build.id);
    } else {
      console.log('\n💡 To wait for build completion, use: --wait flag');
      console.log('💡 To check build status manually, visit the build URL above');
    }
    
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { triggerBuild, checkBuildStatus, waitForBuild };
