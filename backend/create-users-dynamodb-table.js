import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createUsersTable() {
  const params = {
    TableName: 'CodeBattleUsers',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'cognitoSub', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'CognitoSubIndex',
        KeySchema: [{ AttributeName: 'cognitoSub', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
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
    console.log('📝 Creating CodeBattleUsers table...');
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log('✅ Table created successfully!');
    console.log('Table ARN:', response.TableDescription.TableArn);
    console.log('Table Status:', response.TableDescription.TableStatus);
    console.log('\n⏳ Waiting for table to become ACTIVE...');
    console.log('This may take 30-60 seconds.');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ Table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

createUsersTable()
  .then(() => {
    console.log('\n🎉 Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
