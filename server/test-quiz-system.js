const axios = require("axios");
const mongoose = require("mongoose");

// Configuration
const BASE_URL = "http://localhost:5001";
const TEST_USER = {
  userName: `testuser_${Date.now()}`,
  userEmail: `testuser_${Date.now()}@example.com`,
  password: "TestPass123!",
  role: "student",
};

let authToken = "";
let instructorToken = "";
let testCourseId = "";
let testQuizId = "";
let testAttemptId = "";

// Test data
const TEST_INSTRUCTOR = {
  userName: `testinstructor_${Date.now()}`,
  userEmail: `testinstructor_${Date.now()}@example.com`,
  password: "TestPass123!",
  role: "instructor",
};

const TEST_COURSE = {
  instructorId: "", // Will be set after instructor login
  instructorName: "Test Instructor",
  date: new Date(),
  title: "Test Course for Quiz System",
  category: "Technology",
  level: "beginner",
  primaryLanguage: "English",
  subtitle: "Test Course Subtitle",
  description: "A test course to validate quiz functionality",
  image: "https://example.com/test-image.jpg",
  welcomeMessage: "Welcome to the test course!",
  pricing: 99,
  courseType: "paid",
  objectives: "Learn quiz functionality",
  students: [],
  curriculum: [
    {
      title: "Introduction",
      videoUrl: "https://example.com/test-video.mp4",
      public_id: "test-public-id",
      freePreview: true,
    },
  ],
  isPublished: true,
};

const TEST_QUIZ = {
  title: "Test Quiz",
  description: "A test quiz to validate functionality",
  courseId: "", // Will be set after course creation
  quizType: "final",
  questions: [
    {
      type: "multiple-choice",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "2",
      points: 1,
      requiresReview: false,
    },
    {
      type: "true-false",
      question: "Is JavaScript a programming language?",
      options: ["True", "False"],
      correctAnswer: "0",
      points: 1,
      requiresReview: false,
    },
    {
      type: "multiple-choice",
      question: "Select all programming languages",
      options: ["JavaScript", "HTML", "Python", "CSS"],
      correctAnswer: "0",
      points: 1,
      requiresReview: false,
    },
  ],
  timeLimit: 30,
  passingScore: 70,
  attemptsAllowed: 3,
  createdBy: "", // Will be set after instructor login
};

// Helper functions
async function makeRequest(method, url, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

async function log(message, result = null) {
  console.log(`\n[${new Date().toISOString()}] ${message}`);
  if (result) {
    if (result.success) {
      console.log("✅ SUCCESS:", JSON.stringify(result.data, null, 2));
    } else {
      console.log("❌ ERROR:", JSON.stringify(result.error, null, 2));
    }
  }
}

// Test functions
async function testUserRegistration() {
  log("Testing user registration...");
  const result = await makeRequest("POST", "/auth/register", TEST_USER);
  log("Registration result:", result);
  return result.success;
}

async function testUserLogin() {
  log("Testing user login...");
  const result = await makeRequest("POST", "/auth/login", {
    userEmail: TEST_USER.userEmail,
    password: TEST_USER.password,
  });
  if (result.success) {
    authToken = result.data.data.accessToken;
    log("Login successful, token obtained");
  }
  log("Login result:", result);
  return result.success;
}

async function testInstructorRegistration() {
  log("Testing instructor registration...");
  const result = await makeRequest("POST", "/auth/register", TEST_INSTRUCTOR);
  log("Instructor registration result:", result);
  return result.success;
}

async function testInstructorLogin() {
  log("Testing instructor login...");
  const result = await makeRequest("POST", "/auth/login", {
    userEmail: TEST_INSTRUCTOR.userEmail,
    password: TEST_INSTRUCTOR.password,
  });
  if (result.success) {
    instructorToken = result.data.data.accessToken;
    TEST_COURSE.instructorId = result.data.data.user._id;
    TEST_QUIZ.createdBy = result.data.data.user._id;
    log("Instructor login successful, token obtained");
  }
  log("Instructor login result:", result);
  return result.success;
}

async function testCourseCreation() {
  log("Testing course creation...");
  const result = await makeRequest(
    "POST",
    "/instructor/course/add",
    TEST_COURSE,
    instructorToken
  );
  if (result.success) {
    testCourseId = result.data.data._id;
    TEST_QUIZ.courseId = testCourseId;
    log(`Course created with ID: ${testCourseId}`);
  }
  log("Course creation result:", result);
  return result.success;
}

async function testCourseEnrollment() {
  log("Testing course enrollment...");
  const enrollmentData = {
    userId: "", // Will be set after login
    userName: TEST_USER.userName,
    userEmail: TEST_USER.userEmail,
    orderStatus: "confirmed",
    paymentMethod: "card", // Since course is paid
    paymentStatus: "completed",
    orderDate: new Date(),
    paymentId: "TEST_PAYMENT_ID",
    payerId: "TEST_PAYER_ID",
    instructorId: TEST_COURSE.instructorId,
    instructorName: TEST_COURSE.instructorName,
    courseImage: TEST_COURSE.image,
    courseTitle: TEST_COURSE.title,
    courseId: testCourseId,
    coursePricing: TEST_COURSE.pricing,
  };

  // Get user ID from login response (assuming we have it stored)
  // We need to get the user ID from the login response
  const userLoginResult = await makeRequest("POST", "/auth/login", {
    userEmail: TEST_USER.userEmail,
    password: TEST_USER.password,
  });
  if (userLoginResult.success) {
    enrollmentData.userId = userLoginResult.data.data.user._id;
  } else {
    log("Failed to get user ID for enrollment");
    return false;
  }

  const result = await makeRequest(
    "POST",
    "/student/order/create",
    enrollmentData,
    authToken
  );
  log("Course enrollment result:", result);
  return result.success;
}

async function testQuizCreation() {
  log("Testing quiz creation...");
  const result = await makeRequest(
    "POST",
    "/instructor/quiz/create",
    TEST_QUIZ,
    instructorToken
  );
  if (result.success) {
    testQuizId = result.data.data._id;
    log(`Quiz created with ID: ${testQuizId}`);
  }
  log("Quiz creation result:", result);
  return result.success;
}

async function testQuizRetrieval() {
  log("Testing quiz retrieval for students...");
  const result = await makeRequest(
    "GET",
    `/student/quiz/course/${testCourseId}`,
    null,
    authToken
  );
  log("Quiz retrieval result:", result);
  return result.success;
}

async function testQuizAttemptStart() {
  log("Testing quiz attempt start...");
  const result = await makeRequest(
    "POST",
    `/student/quiz/${testQuizId}/attempt`,
    {},
    authToken
  );
  if (result.success) {
    testAttemptId = result.data.data.attemptId;
    log(`Quiz attempt started with ID: ${testAttemptId}`);
  }
  log("Quiz attempt start result:", result);
  return result.success;
}

async function testQuizSubmission() {
  log("Testing quiz submission...");

  // Check if attemptId is available
  if (!testAttemptId) {
    log(
      "❌ ERROR: testAttemptId is empty or undefined. Cannot proceed with quiz submission."
    );
    return false;
  }

  // Get the actual question IDs from the quiz
  const quizResponse = await makeRequest(
    "GET",
    `/student/quiz/${testQuizId}`,
    null,
    authToken
  );

  if (!quizResponse.success) {
    log("Failed to get quiz details for question IDs");
    return false;
  }

  const questionIds = quizResponse.data.data.quiz.questions.map((q) => q._id);

  const answers = [
    { questionId: questionIds[0], selectedAnswer: 2 }, // Correct answer for first question
    { questionId: questionIds[1], selectedAnswer: 0 }, // Correct answer for second question
    { questionId: questionIds[2], selectedAnswer: [0, 2] }, // Correct answer for third question
  ];

  const result = await makeRequest(
    "PUT",
    `/student/quiz/${testQuizId}/attempt/${testAttemptId}`,
    { answers },
    authToken
  );
  log("Quiz submission result:", result);
  return result.success;
}

async function testQuizResults() {
  log("Testing quiz results retrieval...");
  const result = await makeRequest(
    "GET",
    `/student/quiz/${testQuizId}/results`,
    null,
    authToken
  );
  log("Quiz results result:", result);
  return result.success;
}

async function testSecurityFeatures() {
  log("Testing security features...");

  // Test unauthorized access
  const unauthorizedResult = await makeRequest(
    "GET",
    `/student/quiz/course/${testCourseId}`
  );
  log("Unauthorized access test:", unauthorizedResult);

  // Test invalid token
  const invalidTokenResult = await makeRequest(
    "GET",
    `/student/quiz/course/${testCourseId}`,
    null,
    "invalid-token"
  );
  log("Invalid token test:", invalidTokenResult);

  return (
    unauthorizedResult.success === false && invalidTokenResult.success === false
  );
}

async function testErrorHandling() {
  log("Testing error handling...");

  // Test invalid quiz ID
  const invalidQuizResult = await makeRequest(
    "GET",
    "/student/quiz/invalid-id/results",
    null,
    authToken
  );
  log("Invalid quiz ID test:", invalidQuizResult);

  // Test invalid course ID
  const invalidCourseResult = await makeRequest(
    "GET",
    "/student/quiz/course/invalid-id",
    null,
    authToken
  );
  log("Invalid course ID test:", invalidCourseResult);

  return (
    invalidQuizResult.success === false && invalidCourseResult.success === false
  );
}

// Main test execution
async function runTests() {
  console.log("🚀 Starting Quiz System End-to-End Tests\n");

  const results = {
    userRegistration: await testUserRegistration(),
    userLogin: await testUserLogin(),
    instructorRegistration: await testInstructorRegistration(),
    instructorLogin: await testInstructorLogin(),
    courseCreation: await testCourseCreation(),
    courseEnrollment: await testCourseEnrollment(),
    quizCreation: await testQuizCreation(),
    quizRetrieval: await testQuizRetrieval(),
    quizAttemptStart: await testQuizAttemptStart(),
    quizSubmission: await testQuizSubmission(),
    quizResults: await testQuizResults(),
    securityFeatures: await testSecurityFeatures(),
    errorHandling: await testErrorHandling(),
  };

  console.log("\n📊 Test Results Summary:");
  console.log("========================");

  let passed = 0;
  let failed = 0;

  Object.entries(results).forEach(([test, success]) => {
    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${test}`);
    if (success) passed++;
    else failed++;
  });

  console.log(`\nTotal Tests: ${Object.keys(results).length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(
    `Success Rate: ${((passed / Object.keys(results).length) * 100).toFixed(
      1
    )}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Quiz system is working correctly.");
  } else {
    console.log(
      `\n⚠️ ${failed} test(s) failed. Please review the issues above.`
    );
  }

  // Cleanup
  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
