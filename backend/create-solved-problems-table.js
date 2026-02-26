import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createSolvedProblemsTable = async () => {
  const params = {
    TableName: 'SolvedProblems',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'solvedAt', KeyType: 'RANGE' }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'solvedAt', AttributeType: 'N' },
      { AttributeName: 'problemId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserProblemIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'problemId', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log('✅ SolvedProblems table created successfully!');
    console.log('Table ARN:', response.TableDescription.TableArn);
    console.log('Table Status:', response.TableDescription.TableStatus);
    console.log('\n📊 Table Details:');
    console.log('- Partition Key: userId (String)');
    console.log('- Sort Key: solvedAt (Number - Unix timestamp)');
    console.log('- GSI: UserProblemIndex (userId + problemId) for duplicate prevention');
    console.log('\nWait a few moments for the table to become ACTIVE before using it.');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
};

createSolvedProblemsTable();
