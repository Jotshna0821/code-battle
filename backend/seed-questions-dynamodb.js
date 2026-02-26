// Seed Questions to DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'CodeBattleQuestions';

// Sample questions
const questions = [
  // Easy Problems
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/two-sum/',
    tags: ['Array', 'Hash Table'],
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/valid-parentheses/',
    tags: ['String', 'Stack'],
  },
  {
    title: 'Reverse Integer',
    description: 'Given a signed 32-bit integer x, return x with its digits reversed.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/reverse-integer/',
    tags: ['Math'],
  },
  {
    title: 'Palindrome Number',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/palindrome-number/',
    tags: ['Math'],
  },
  {
    title: 'Roman to Integer',
    description: 'Given a roman numeral, convert it to an integer.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/roman-to-integer/',
    tags: ['Hash Table', 'Math', 'String'],
  },
  {
    title: 'Longest Common Prefix',
    description: 'Write a function to find the longest common prefix string amongst an array of strings.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/longest-common-prefix/',
    tags: ['String'],
  },
  {
    title: 'Valid Anagram',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/valid-anagram/',
    tags: ['Hash Table', 'String', 'Sorting'],
  },
  {
    title: 'Contains Duplicate',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array.',
    difficulty: 'easy',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/contains-duplicate/',
    tags: ['Array', 'Hash Table', 'Sorting'],
  },
  
  // Moderate Problems
  {
    title: 'Add Two Numbers',
    description: 'You are given two non-empty linked lists representing two non-negative integers.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/add-two-numbers/',
    tags: ['Linked List', 'Math', 'Recursion'],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    tags: ['Hash Table', 'String', 'Sliding Window'],
  },
  {
    title: '3Sum',
    description: 'Given an integer array nums, return all the triplets that sum to zero.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/3sum/',
    tags: ['Array', 'Two Pointers', 'Sorting'],
  },
  {
    title: 'Container With Most Water',
    description: 'Find two lines that together with the x-axis form a container that holds the most water.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/container-with-most-water/',
    tags: ['Array', 'Two Pointers', 'Greedy'],
  },
  {
    title: 'Letter Combinations of a Phone Number',
    description: 'Given a string containing digits from 2-9, return all possible letter combinations.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/',
    tags: ['Hash Table', 'String', 'Backtracking'],
  },
  {
    title: 'Generate Parentheses',
    description: 'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/generate-parentheses/',
    tags: ['String', 'Dynamic Programming', 'Backtracking'],
  },
  {
    title: 'Merge Intervals',
    description: 'Given an array of intervals, merge all overlapping intervals.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/merge-intervals/',
    tags: ['Array', 'Sorting'],
  },
  {
    title: 'Rotate Image',
    description: 'You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees.',
    difficulty: 'moderate',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/rotate-image/',
    tags: ['Array', 'Math', 'Matrix'],
  },
  
  // Hard Problems
  {
    title: 'Median of Two Sorted Arrays',
    description: 'Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
  },
  {
    title: 'Merge k Sorted Lists',
    description: 'You are given an array of k linked-lists, each linked-list is sorted in ascending order.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    tags: ['Linked List', 'Divide and Conquer', 'Heap'],
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map, compute how much water it can trap.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/trapping-rain-water/',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
  },
  {
    title: 'Regular Expression Matching',
    description: 'Given an input string s and a pattern p, implement regular expression matching.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/regular-expression-matching/',
    tags: ['String', 'Dynamic Programming', 'Recursion'],
  },
  {
    title: 'Longest Valid Parentheses',
    description: 'Given a string containing just the characters \'(\' and \')\', find the length of the longest valid parentheses substring.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/longest-valid-parentheses/',
    tags: ['String', 'Dynamic Programming', 'Stack'],
  },
  {
    title: 'Sudoku Solver',
    description: 'Write a program to solve a Sudoku puzzle by filling the empty cells.',
    difficulty: 'hard',
    platform: 'LeetCode',
    problemUrl: 'https://leetcode.com/problems/sudoku-solver/',
    tags: ['Array', 'Backtracking', 'Matrix'],
  },
];

async function seedQuestions() {
  console.log('🌱 Starting to seed questions to DynamoDB...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const question of questions) {
    try {
      const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const item = {
        questionId,
        ...question,
        createdAt: now,
        updatedAt: now,
      };
      
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      });
      
      await docClient.send(command);
      console.log(`✅ Added: ${question.title} (${question.difficulty})`);
      successCount++;
      
      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error adding ${question.title}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Seeding Summary:');
  console.log(`✅ Successfully added: ${successCount} questions`);
  console.log(`❌ Failed: ${errorCount} questions`);
  console.log(`📝 Total: ${questions.length} questions`);
}

// Run the seed function
seedQuestions()
  .then(() => {
    console.log('\n✅ Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
