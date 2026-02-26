// Load environment variables FIRST
import '../config/env.js';

// Mock data store for testing without AWS credentials
// This is used when AWS credentials are not configured or invalid

// Check if we're in mock mode - only check for missing or placeholder values
const hasPlaceholderCredentials = 
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.AWS_ACCESS_KEY_ID === 'YOUR_ACCESS_KEY_ID_HERE' ||
  process.env.AWS_ACCESS_KEY_ID === 'your_access_key_id' ||
  process.env.AWS_SECRET_ACCESS_KEY === 'YOUR_SECRET_ACCESS_KEY_HERE' ||
  process.env.AWS_SECRET_ACCESS_KEY === 'your_secret_access_key';

export let MOCK_MODE = hasPlaceholderCredentials;

// In-memory mock database
export const mockUsers = new Map<string, any>();

// Function to enable mock mode if credentials fail
export function enableMockMode(reason: string) {
  if (!MOCK_MODE) {
    console.log('⚠️  Switching to MOCK MODE:', reason);
    MOCK_MODE = true;
  }
}

if (MOCK_MODE) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ⚠️  WARNING: Running in MOCK MODE                        ║');
  console.log('║     AWS credentials not configured                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📝 To fix this:');
  console.log('');
  console.log('1. Go to AWS IAM Console: https://console.aws.amazon.com/iam');
  console.log('2. Create new access keys');
  console.log('3. Update backend/.env with:');
  console.log('   AWS_ACCESS_KEY_ID=your_new_key');
  console.log('   AWS_SECRET_ACCESS_KEY=your_new_secret');
  console.log('');
  console.log('📖 For detailed setup instructions, see DEPLOYMENT-GUIDE.md');
  console.log('');
} else {
  console.log('✅ AWS credentials configured - attempting to use DynamoDB');
}
