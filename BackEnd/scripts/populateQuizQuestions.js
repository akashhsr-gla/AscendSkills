const mongoose = require('mongoose');
const QuizQuestion = require('../models/QuizQuestion');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ascend-skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  await populateQuizQuestions();
});

// Sample user ID (you may need to replace this with an actual user ID from your database)
const SAMPLE_USER_ID = '507f1f77bcf86cd799439011';

const quizQuestionsData = [
  // ===== COMPANY CATEGORY QUESTIONS =====
  
  // Amazon - Company Questions
  {
    title: "Amazon Leadership Principles",
    content: "Which Amazon leadership principle emphasizes making decisions based on data and analysis?",
    type: "mcqs",
    category: "Amazon",
    categoryType: "company",
    difficulty: "medium",
    explanation: "Dive Deep is the Amazon leadership principle that emphasizes making decisions based on data and analysis rather than gut feelings.",
    correctAnswer: "Dive Deep",
    mcqs: {
      options: ["Customer Obsession", "Dive Deep", "Think Big", "Bias for Action"],
      correctOptionIndex: 1
    },
    points: 2,
    timeLimit: 45,
    tags: ["leadership", "amazon"]
  },
  {
    title: "AWS S3 Storage Classes",
    content: "Which AWS S3 storage class is designed for frequently accessed data?",
    type: "fill_in_blanks",
    category: "Amazon",
    categoryType: "company",
    difficulty: "medium",
    explanation: "S3 Standard is designed for frequently accessed data, while S3 Standard-IA is for infrequently accessed data.",
    correctAnswer: "S3 Standard",
    fillInBlanks: {
      placeholder: "Enter the storage class name",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 2,
    timeLimit: 60,
    tags: ["aws", "s3"]
  },
  {
    title: "Amazon DynamoDB Consistency",
    content: "DynamoDB provides strong consistency for all read operations by default.",
    type: "true_false",
    category: "Amazon",
    categoryType: "company",
    difficulty: "hard",
    explanation: "DynamoDB provides eventual consistency by default. Strong consistency must be explicitly requested.",
    correctAnswer: "false",
    trueFalse: {
      correctAnswer: false
    },
    points: 2,
    timeLimit: 45,
    tags: ["dynamodb", "nosql"]
  },

  // Google - Company Questions
  {
    title: "Google PageRank Algorithm",
    content: "What is the primary factor that determines a page's PageRank score?",
    type: "mcqs",
    category: "Google",
    categoryType: "company",
    difficulty: "hard",
    explanation: "PageRank is primarily based on the number and quality of incoming links to a page.",
    correctAnswer: "Incoming links",
    mcqs: {
      options: ["Page content", "Incoming links", "Page load speed", "User engagement"],
      correctOptionIndex: 1
    },
    points: 3,
    timeLimit: 60,
    tags: ["pagerank", "algorithm"]
  },
  {
    title: "Google BigQuery",
    content: "BigQuery is a fully managed _____ data warehouse.",
    type: "fill_in_blanks",
    category: "Google",
    categoryType: "company",
    difficulty: "medium",
    explanation: "BigQuery is Google's fully managed, serverless data warehouse for analytics.",
    correctAnswer: "serverless",
    fillInBlanks: {
      placeholder: "Enter the key characteristic",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 2,
    timeLimit: 45,
    tags: ["bigquery", "data"]
  },
  {
    title: "Google Kubernetes Engine",
    content: "GKE automatically manages container orchestration.",
    type: "true_false",
    category: "Google",
    categoryType: "company",
    difficulty: "easy",
    explanation: "GKE (Google Kubernetes Engine) automatically manages the Kubernetes cluster infrastructure.",
    correctAnswer: "true",
    trueFalse: {
      correctAnswer: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["gke", "kubernetes"]
  },

  // Microsoft - Company Questions
  {
    title: "Azure Virtual Machines",
    content: "Which Azure VM type is optimized for memory-intensive applications?",
    type: "mcqs",
    category: "Microsoft",
    categoryType: "company",
    difficulty: "medium",
    explanation: "M-series VMs are optimized for memory-intensive applications with high memory-to-CPU ratios.",
    correctAnswer: "M-series",
    mcqs: {
      options: ["A-series", "D-series", "M-series", "F-series"],
      correctOptionIndex: 2
    },
    points: 2,
    timeLimit: 45,
    tags: ["azure", "vm"]
  },
  {
    title: "Microsoft .NET Framework",
    content: ".NET Core is _____ platform.",
    type: "fill_in_blanks",
    category: "Microsoft",
    categoryType: "company",
    difficulty: "easy",
    explanation: ".NET Core is cross-platform, meaning it can run on Windows, macOS, and Linux.",
    correctAnswer: "cross-platform",
    fillInBlanks: {
      placeholder: "Enter the platform characteristic",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["dotnet", "core"]
  },
  {
    title: "Microsoft Teams Integration",
    content: "Microsoft Teams supports third-party app integrations.",
    type: "true_false",
    category: "Microsoft",
    categoryType: "company",
    difficulty: "easy",
    explanation: "Microsoft Teams supports a wide range of third-party app integrations through its app store.",
    correctAnswer: "true",
    trueFalse: {
      correctAnswer: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["teams", "integration"]
  },

  // Meta (Facebook) - Company Questions
  {
    title: "React Performance Optimization",
    content: "Which React hook is used to prevent unnecessary re-renders?",
    type: "mcqs",
    category: "Meta",
    categoryType: "company",
    difficulty: "medium",
    explanation: "useMemo is used to memoize expensive calculations and prevent unnecessary re-renders.",
    correctAnswer: "useMemo",
    mcqs: {
      options: ["useState", "useEffect", "useMemo", "useContext"],
      correctOptionIndex: 2
    },
    points: 2,
    timeLimit: 45,
    tags: ["react", "performance"]
  },
  {
    title: "GraphQL Schema",
    content: "GraphQL uses a _____ schema definition language.",
    type: "fill_in_blanks",
    category: "Meta",
    categoryType: "company",
    difficulty: "medium",
    explanation: "GraphQL uses a strongly-typed schema definition language to define the API structure.",
    correctAnswer: "strongly-typed",
    fillInBlanks: {
      placeholder: "Enter the schema characteristic",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 2,
    timeLimit: 45,
    tags: ["graphql", "schema"]
  },
  {
    title: "Facebook News Feed Algorithm",
    content: "The Facebook News Feed algorithm prioritizes user engagement.",
    type: "true_false",
    category: "Meta",
    categoryType: "company",
    difficulty: "easy",
    explanation: "The Facebook News Feed algorithm prioritizes content that generates user engagement.",
    correctAnswer: "true",
    trueFalse: {
      correctAnswer: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["newsfeed", "algorithm"]
  },

  // ===== SUBJECTIVE CATEGORY QUESTIONS =====
  
  // Programming Fundamentals - Subjective Questions
  {
    title: "Variable Declaration Keywords",
    content: "What is the difference between 'let' and 'const' in JavaScript?",
    type: "mcqs",
    category: "Programming Fundamentals",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "let allows reassignment while const creates a read-only reference. However, const objects can have their properties modified.",
    correctAnswer: "let allows reassignment, const doesn't",
    mcqs: {
      options: [
        "let allows reassignment, const doesn't",
        "const allows reassignment, let doesn't",
        "There is no difference",
        "let is for numbers, const is for strings"
      ],
      correctOptionIndex: 0
    },
    points: 1,
    timeLimit: 45,
    tags: ["javascript", "variables"]
  },
  {
    title: "Function Declaration vs Expression",
    content: "What is the key difference between function declaration and function expression?",
    type: "fill_in_blanks",
    category: "Programming Fundamentals",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "Function declarations are hoisted and can be called before they are defined, while function expressions are not hoisted.",
    correctAnswer: "hoisting",
    fillInBlanks: {
      placeholder: "Enter the key difference",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 2,
    timeLimit: 60,
    tags: ["javascript", "functions"]
  },
  {
    title: "Object-Oriented Programming",
    content: "Inheritance is a fundamental concept of object-oriented programming.",
    type: "true_false",
    category: "Programming Fundamentals",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "Inheritance is indeed a fundamental concept of OOP, allowing classes to inherit properties and methods from other classes.",
    correctAnswer: "true",
    trueFalse: {
      correctAnswer: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["oop", "inheritance"]
  },

  // Web Technologies - Subjective Questions
  {
    title: "HTTP vs HTTPS",
    content: "Which protocol provides encrypted communication between client and server?",
    type: "mcqs",
    category: "Web Technologies",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "HTTPS (HTTP Secure) provides encrypted communication using SSL/TLS protocols, while HTTP sends data in plain text.",
    correctAnswer: "HTTPS",
    mcqs: {
      options: ["HTTP", "HTTPS", "FTP", "SMTP"],
      correctOptionIndex: 1
    },
    points: 1,
    timeLimit: 30,
    tags: ["http", "https"]
  },
  {
    title: "CSS Box Model",
    content: "The CSS box model consists of content, padding, border, and _____.",
    type: "fill_in_blanks",
    category: "Web Technologies",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "The CSS box model consists of content, padding, border, and margin. Margin is the outermost layer that creates space outside the border.",
    correctAnswer: "margin",
    fillInBlanks: {
      placeholder: "Enter the missing component",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["css", "box-model"]
  },
  {
    title: "Cookies vs Local Storage",
    content: "Local Storage can store more data than cookies.",
    type: "true_false",
    category: "Web Technologies",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "Local Storage can store significantly more data (usually 5-10MB) compared to cookies (4KB), and the data persists until explicitly cleared.",
    correctAnswer: "true",
    trueFalse: {
      correctAnswer: true
    },
    points: 2,
    timeLimit: 45,
    tags: ["local-storage", "cookies"]
  },

  // Database Concepts - Subjective Questions
  {
    title: "ACID Properties",
    content: "What does the 'A' in ACID stand for in database transactions?",
    type: "mcqs",
    category: "Database Concepts",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "The 'A' in ACID stands for Atomicity, which ensures that all operations in a transaction are completed successfully or none of them are.",
    correctAnswer: "Atomicity",
    mcqs: {
      options: ["Availability", "Atomicity", "Authentication", "Authorization"],
      correctOptionIndex: 1
    },
    points: 2,
    timeLimit: 45,
    tags: ["database", "acid"]
  },
  {
    title: "Primary Key Constraint",
    content: "A primary key must be unique and _____.",
    type: "fill_in_blanks",
    category: "Database Concepts",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "A primary key must be unique and not null. It serves as a unique identifier for each record in a table.",
    correctAnswer: "not null",
    fillInBlanks: {
      placeholder: "Enter the required property",
      caseSensitive: false,
      ignoreSpaces: true
    },
    points: 1,
    timeLimit: 30,
    tags: ["database", "primary-key"]
  },
  {
    title: "Index Performance",
    content: "Adding indexes to a database always improves query performance.",
    type: "true_false",
    category: "Database Concepts",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "While indexes generally improve query performance, they can slow down write operations (INSERT, UPDATE, DELETE) and take up additional storage space.",
    correctAnswer: "false",
    trueFalse: {
      correctAnswer: false
    },
    points: 2,
    timeLimit: 45,
    tags: ["database", "indexes"]
  },

  // ===== CODING QUESTIONS =====
  
  // Two Sum Problem - Classic Algorithm
  {
    title: "Two Sum Problem",
    content: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    type: "coding",
    category: "Data Structures & Algorithms",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "This is a classic two-pointer or hash map problem. Use a hash map to store visited numbers and their indices.",
    correctAnswer: "def twoSum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []",
    coding: {
      problemDescription: "Find two numbers in the array that add up to the target value and return their indices.",
      inputFormat: "nums: List[int], target: int",
      outputFormat: "List[int] - indices of the two numbers",
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists"
      ],
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]"
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
          explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]"
        }
      ],
      starterCode: "def twoSum(nums, target):\n    # Write your solution here\n    pass",
      testCases: [
        {
          input: "[2,7,11,15]\n9",
          expectedOutput: "[0,1]",
          isHidden: false
        },
        {
          input: "[3,2,4]\n6",
          expectedOutput: "[1,2]",
          isHidden: false
        },
        {
          input: "[3,3]\n6",
          expectedOutput: "[0,1]",
          isHidden: true
        }
      ]
    },
    points: 3,
    timeLimit: 300,
    tags: ["array", "hashmap", "algorithms"]
  },

  // Valid Parentheses - Stack Problem
  {
    title: "Valid Parentheses",
    content: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    type: "coding",
    category: "Data Structures & Algorithms",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "Use a stack to keep track of opening brackets and match them with closing brackets.",
    correctAnswer: "def isValid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return False\n        else:\n            stack.append(char)\n    return not stack",
    coding: {
      problemDescription: "Check if brackets are properly matched and nested.",
      inputFormat: "s: string containing only brackets",
      outputFormat: "boolean - true if valid, false otherwise",
      constraints: [
        "1 <= s.length <= 10^4",
        "s consists of parentheses only '()[]{}'."
      ],
      examples: [
        {
          input: "s = \"()\"",
          output: "true",
          explanation: "Valid pair of parentheses"
        },
        {
          input: "s = \"()[]{}\"",
          output: "true",
          explanation: "All brackets are properly matched"
        },
        {
          input: "s = \"(]\"",
          output: "false",
          explanation: "Mismatched brackets"
        }
      ],
      starterCode: "def isValid(s):\n    # Write your solution here\n    pass",
      testCases: [
        {
          input: "()",
          expectedOutput: "true",
          isHidden: false
        },
        {
          input: "()[]{}",
          expectedOutput: "true",
          isHidden: false
        },
        {
          input: "(]",
          expectedOutput: "false",
          isHidden: false
        },
        {
          input: "([)]",
          expectedOutput: "false",
          isHidden: true
        }
      ]
    },
    points: 3,
    timeLimit: 300,
    tags: ["stack", "string", "algorithms"]
  },

  // Reverse String - Basic String Manipulation
  {
    title: "Reverse String",
    content: "Write a function that reverses a string. The input string is given as an array of characters s.",
    type: "coding",
    category: "Data Structures & Algorithms",
    categoryType: "subjective",
    difficulty: "easy",
    explanation: "Use two pointers to swap characters from both ends, moving towards the center.",
    correctAnswer: "def reverseString(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1\n        right -= 1",
    coding: {
      problemDescription: "Reverse the string in-place by modifying the input array.",
      inputFormat: "s: List[str] - array of characters",
      outputFormat: "None - modify s in-place",
      constraints: [
        "1 <= s.length <= 10^5",
        "s[i] is a printable ascii character"
      ],
      examples: [
        {
          input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]",
          output: "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
          explanation: "Reverse the string in-place"
        },
        {
          input: "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
          output: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]",
          explanation: "Reverse the string in-place"
        }
      ],
      starterCode: "def reverseString(s):\n    # Write your solution here\n    pass",
      testCases: [
        {
          input: "[\"h\",\"e\",\"l\",\"l\",\"o\"]",
          expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
          isHidden: false
        },
        {
          input: "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
          expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]",
          isHidden: false
        },
        {
          input: "[\"a\"]",
          expectedOutput: "[\"a\"]",
          isHidden: true
        }
      ]
    },
    points: 2,
    timeLimit: 200,
    tags: ["string", "two-pointers", "algorithms"]
  },

  // Maximum Subarray - Dynamic Programming
  {
    title: "Maximum Subarray",
    content: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
    type: "coding",
    category: "Data Structures & Algorithms",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "Use Kadane's algorithm to find the maximum subarray sum in O(n) time.",
    correctAnswer: "def maxSubArray(nums):\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
    coding: {
      problemDescription: "Find the contiguous subarray with the largest sum.",
      inputFormat: "nums: List[int] - array of integers",
      outputFormat: "int - maximum subarray sum",
      constraints: [
        "1 <= nums.length <= 10^5",
        "-10^4 <= nums[i] <= 10^4"
      ],
      examples: [
        {
          input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
          output: "6",
          explanation: "The subarray [4,-1,2,1] has the largest sum 6"
        },
        {
          input: "nums = [1]",
          output: "1",
          explanation: "Single element array"
        },
        {
          input: "nums = [5,4,-1,7,8]",
          output: "23",
          explanation: "The subarray [5,4,-1,7,8] has the largest sum 23"
        }
      ],
      starterCode: "def maxSubArray(nums):\n    # Write your solution here\n    pass",
      testCases: [
        {
          input: "[-2,1,-3,4,-1,2,1,-5,4]",
          expectedOutput: "6",
          isHidden: false
        },
        {
          input: "[1]",
          expectedOutput: "1",
          isHidden: false
        },
        {
          input: "[5,4,-1,7,8]",
          expectedOutput: "23",
          isHidden: false
        },
        {
          input: "[-1,-2,-3,-4]",
          expectedOutput: "-1",
          isHidden: true
        }
      ]
    },
    points: 4,
    timeLimit: 400,
    tags: ["dynamic-programming", "array", "algorithms"]
  },

  // Binary Tree Inorder Traversal - Tree Traversal
  {
    title: "Binary Tree Inorder Traversal",
    content: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    type: "coding",
    category: "Data Structures & Algorithms",
    categoryType: "subjective",
    difficulty: "medium",
    explanation: "Inorder traversal visits nodes in the order: left subtree, root, right subtree. Can be done recursively or iteratively.",
    correctAnswer: "def inorderTraversal(root):\n    result = []\n    def inorder(node):\n        if node:\n            inorder(node.left)\n            result.append(node.val)\n            inorder(node.right)\n    inorder(root)\n    return result",
    coding: {
      problemDescription: "Traverse a binary tree in inorder fashion and return the values.",
      inputFormat: "root: TreeNode - root of binary tree",
      outputFormat: "List[int] - inorder traversal values",
      constraints: [
        "The number of nodes in the tree is in the range [0, 100]",
        "-100 <= Node.val <= 100"
      ],
      examples: [
        {
          input: "root = [1,null,2,3]",
          output: "[1,3,2]",
          explanation: "Inorder: left -> root -> right"
        },
        {
          input: "root = []",
          output: "[]",
          explanation: "Empty tree"
        }
      ],
      starterCode: "# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\ndef inorderTraversal(root):\n    # Write your solution here\n    pass",
      testCases: [
        {
          input: "[1,null,2,3]",
          expectedOutput: "[1,3,2]",
          isHidden: false
        },
        {
          input: "[]",
          expectedOutput: "[]",
          isHidden: false
        },
        {
          input: "[1]",
          expectedOutput: "[1]",
          isHidden: true
        }
      ]
    },
    points: 4,
    timeLimit: 400,
    tags: ["tree", "recursion", "algorithms"]
  },

  // LRU Cache Implementation - System Design
  {
    title: "LRU Cache Implementation",
    content: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
    type: "coding",
    category: "System Design",
    categoryType: "subjective",
    difficulty: "hard",
    explanation: "Use a combination of doubly linked list and hash map for O(1) operations.",
    correctAnswer: "class LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = {}\n        self.head = Node(0, 0)\n        self.tail = Node(0, 0)\n        self.head.next = self.tail\n        self.tail.prev = self.head\n    \n    def get(self, key):\n        if key in self.cache:\n            node = self.cache[key]\n            self._remove(node)\n            self._add(node)\n            return node.value\n        return -1\n    \n    def put(self, key, value):\n        if key in self.cache:\n            self._remove(self.cache[key])\n        node = Node(key, value)\n        self._add(node)\n        self.cache[key] = node\n        if len(self.cache) > self.capacity:\n            lru = self.head.next\n            self._remove(lru)\n            del self.cache[lru.key]",
    coding: {
      problemDescription: "Implement LRU Cache with get and put operations in O(1) time complexity.",
      inputFormat: "capacity: int - maximum capacity of cache",
      outputFormat: "LRUCache class with get() and put() methods",
      constraints: [
        "1 <= capacity <= 3000",
        "0 <= key <= 10^4",
        "0 <= value <= 10^5",
        "At most 2 * 10^5 calls will be made to get and put"
      ],
      examples: [
        {
          input: "LRUCache(2)\nput(1, 1)\nput(2, 2)\nget(1)\nput(3, 3)\nget(2)",
          output: "null\nnull\nnull\n1\nnull\n-1",
          explanation: "Cache capacity is 2, key 2 is evicted when key 3 is added"
        }
      ],
      starterCode: "class Node:\n    def __init__(self, key, value):\n        self.key = key\n        self.value = value\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        # Initialize your data structure here\n        pass\n    \n    def get(self, key: int) -> int:\n        # Get the value of the key if it exists\n        pass\n    \n    def put(self, key: int, value: int) -> None:\n        # Set or insert the value if the key is not already present\n        pass",
      testCases: [
        {
          input: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2",
          expectedOutput: "1\n-1",
          isHidden: false
        }
      ]
    },
    points: 5,
    timeLimit: 600,
    tags: ["design", "hashmap", "linked-list"]
  }
];

async function populateQuizQuestions() {
  try {
    console.log('🗑️ Clearing existing quiz questions...');
    await QuizQuestion.deleteMany({});
    console.log('✅ Existing quiz questions cleared');

    console.log('📝 Creating new quiz questions...');
    const createdQuestions = [];

    for (const questionData of quizQuestionsData) {
      const question = new QuizQuestion({
        ...questionData,
        createdBy: SAMPLE_USER_ID
      });
      
      const savedQuestion = await question.save();
      createdQuestions.push(savedQuestion);
      console.log(`✅ Created: ${savedQuestion.title} (${savedQuestion.type})`);
    }

    console.log('\n📊 Population Summary:');
    console.log(`Total questions created: ${createdQuestions.length}`);
    
    // Group by category and type
    const categoryStats = {};
    const typeStats = {};
    
    createdQuestions.forEach(q => {
      // Category stats
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { company: 0, subjective: 0 };
      }
      categoryStats[q.category][q.categoryType]++;
      
      // Type stats
      if (!typeStats[q.type]) {
        typeStats[q.type] = 0;
      }
      typeStats[q.type]++;
    });

    console.log('\n📁 By Category:');
    Object.entries(categoryStats).forEach(([category, stats]) => {
      console.log(`  ${category}:`);
      console.log(`    Company: ${stats.company} questions`);
      console.log(`    Subjective: ${stats.subjective} questions`);
    });

    console.log('\n🎯 By Question Type:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} questions`);
    });

    console.log('\n🎉 Quiz questions population completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error populating quiz questions:', error);
    process.exit(1);
  }
} 