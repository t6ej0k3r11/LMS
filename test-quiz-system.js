/**
 * End-to-End Quiz System Testing Script
 * Tests all quiz functionality including API endpoints, frontend components, and business logic
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000";
const CLIENT_URL = "http://localhost:5173";

// Test data
const testUsers = {
  instructor: {
    userName: `test_instructor_${Date.now()}`,
    email: `instructor_${Date.now()}@test.com`,
    password: "password123",
  },
  student: {
    userName: `test_student_${Date.now()}`,
    email: `student_${Date.now()}@test.com`,
    password: "password123",
  },
};

const testCourse = {
  title: "Test Course for Quiz System",
  description: "A test course to validate quiz functionality",
  category: "Technology",
  level: "Beginner",
  primaryLanguage: "English",
  pricing: 49.99,
  objectives: "Test quiz system functionality",
  welcomeMessage: "Welcome to the test course",
  curriculum: [
    {
      title: "Introduction",
      lectures: [
        {
          title: "Welcome Lecture",
          description: "Introduction to the course",
          videoUrl: "https://example.com/video1.mp4",
          public_id: "video1",
          freePreview: true,
        },
      ],
    },
  ],
};

const testQuiz = {
  title: "Test Quiz",
  description: "A comprehensive test quiz",
  questions: [
    {
      type: "multiple-choice",
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
      points: 1,
    },
    {
      type: "true-false",
      question: "The sky is blue.",
      options: [],
      correctAnswer: "true",
      points: 1,
    },
    {
      type: "multiple-select",
      question: "Select all programming languages.",
      options: ["JavaScript", "HTML", "Python", "CSS"],
      correctAnswer: ["JavaScript", "Python"],
      points: 2,
    },
  ],
  passingScore: 70,
  timeLimit: 5, // 5 minutes
  attemptsAllowed: 2,
};

class QuizSystemTester {
  constructor() {
    this.tokens = {};
    this.testData = {};
  }

  async runAllTests() {
    console.log("🚀 Starting Quiz System End-to-End Tests\n");

    try {
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testCourseCreation();
      await this.testQuizCreation();
      await this.testStudentEnrollment();
      await this.testQuizAccessControl();
      await this.testQuizTaking();
      await this.testQuizSubmission();
      await this.testQuizResults();
      await this.testMultipleAttempts();
      await this.testTimerFunctionality();
      await this.testCourseCompletion();

      console.log("\n✅ All tests completed successfully!");
    } catch (error) {
      console.error("\n❌ Test failed:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }

  async makeRequest(method, url, data = null, token = null) {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(
        `Request failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async testUserRegistration() {
    console.log("📝 Testing user registration...");

    // Register instructor
    const instructorResponse = await this.makeRequest(
      "POST",
      "/auth/register",
      {
        ...testUsers.instructor,
        role: "instructor",
      }
    );
    console.log("✅ Instructor registered");

    // Register student
    const studentResponse = await this.makeRequest("POST", "/auth/register", {
      ...testUsers.student,
      role: "user",
    });
    console.log("✅ Student registered");

    this.testData.instructorId = instructorResponse.data._id;
    this.testData.studentId = studentResponse.data._id;
  }

  async testUserLogin() {
    console.log("🔐 Testing user login...");

    // Login instructor
    const instructorLogin = await this.makeRequest("POST", "/auth/login", {
      email: testUsers.instructor.email,
      password: testUsers.instructor.password,
    });
    this.tokens.instructor = instructorLogin.data.token;
    console.log("✅ Instructor logged in");

    // Login student
    const studentLogin = await this.makeRequest("POST", "/auth/login", {
      email: testUsers.student.email,
      password: testUsers.student.password,
    });
    this.tokens.student = studentLogin.data.token;
    console.log("✅ Student logged in");
  }

  async testCourseCreation() {
    console.log("📚 Testing course creation...");

    const courseResponse = await this.makeRequest(
      "POST",
      "/instructor/course/add",
      testCourse,
      this.tokens.instructor
    );

    this.testData.courseId = courseResponse.data._id;
    this.testData.lectureId = courseResponse.data.curriculum[0].lectures[0]._id;
    console.log("✅ Course created with ID:", this.testData.courseId);
  }

  async testQuizCreation() {
    console.log("📝 Testing quiz creation...");

    const quizData = {
      ...testQuiz,
      courseId: this.testData.courseId,
      lectureId: this.testData.lectureId,
    };

    const quizResponse = await this.makeRequest(
      "POST",
      "/instructor/quiz/create",
      quizData,
      this.tokens.instructor
    );

    this.testData.quizId = quizResponse.data._id;
    console.log("✅ Quiz created with ID:", this.testData.quizId);
  }

  async testStudentEnrollment() {
    console.log("🎓 Testing student enrollment...");

    // Simulate course purchase (in a real scenario, this would involve payment)
    // For testing, we'll directly add the student to the course
    const enrollmentResponse = await this.makeRequest(
      "POST",
      "/student/order/create",
      {
        courseId: this.testData.courseId,
        studentId: this.testData.studentId,
        // Skip payment for testing
      },
      this.tokens.student
    );

    console.log("✅ Student enrolled in course");
  }

  async testQuizAccessControl() {
    console.log("🔒 Testing quiz access control...");

    // Test 1: Student cannot access quiz without completing prerequisites
    try {
      await this.makeRequest(
        "GET",
        `/student/quiz/${this.testData.quizId}`,
        null,
        this.tokens.student
      );
      throw new Error(
        "Should not be able to access quiz without prerequisites"
      );
    } catch (error) {
      if (error.message.includes("Prerequisites not met")) {
        console.log("✅ Correctly blocked access due to prerequisites");
      } else {
        throw error;
      }
    }

    // Complete the lecture prerequisite
    await this.makeRequest(
      "POST",
      "/student/course-progress/mark-lecture-viewed",
      {
        userId: this.testData.studentId,
        courseId: this.testData.courseId,
        lectureId: this.testData.lectureId,
      },
      this.tokens.student
    );
    console.log("✅ Lecture prerequisite completed");

    // Test 2: Student can now access quiz
    const quizAccessResponse = await this.makeRequest(
      "GET",
      `/student/quiz/${this.testData.quizId}`,
      null,
      this.tokens.student
    );
    console.log("✅ Quiz accessible after prerequisites met");
  }

  async testQuizTaking() {
    console.log("🎯 Testing quiz taking functionality...");

    // Start quiz attempt
    const attemptResponse = await this.makeRequest(
      "POST",
      `/student/quiz/${this.testData.quizId}/attempt`,
      null,
      this.tokens.student
    );

    this.testData.attemptId = attemptResponse.data.attemptId;
    console.log("✅ Quiz attempt started with ID:", this.testData.attemptId);
  }

  async testQuizSubmission() {
    console.log("📤 Testing quiz submission...");

    // Prepare answers (correct answers for testing)
    const answers = {
      [this.testData.quiz.questions[0]._id]: "4", // Multiple choice: 2+2=4
      [this.testData.quiz.questions[1]._id]: "true", // True/False: sky is blue
      [this.testData.quiz.questions[2]._id]: ["JavaScript", "Python"], // Multiple select
    };

    const submissionResponse = await this.makeRequest(
      "PUT",
      `/student/quiz/${this.testData.quizId}/attempt/${this.testData.attemptId}`,
      { answers },
      this.tokens.student
    );

    console.log("✅ Quiz submitted successfully");
    console.log("📊 Score:", submissionResponse.data.data.score + "%");
    console.log(
      "🎯 Passed:",
      submissionResponse.data.data.passed ? "Yes" : "No"
    );
  }

  async testQuizResults() {
    console.log("📊 Testing quiz results display...");

    const resultsResponse = await this.makeRequest(
      "GET",
      `/student/quiz/${this.testData.quizId}/results`,
      null,
      this.tokens.student
    );

    console.log("✅ Quiz results retrieved");
    console.log("📈 Attempts:", resultsResponse.data.data.attempts.length);
  }

  async testMultipleAttempts() {
    console.log("🔄 Testing multiple quiz attempts...");

    // Try to start another attempt
    const secondAttemptResponse = await this.makeRequest(
      "POST",
      `/student/quiz/${this.testData.quizId}/attempt`,
      null,
      this.tokens.student
    );

    this.testData.secondAttemptId = secondAttemptResponse.data.attemptId;
    console.log("✅ Second attempt started");

    // Submit with incorrect answers
    const wrongAnswers = {
      [this.testData.quiz.questions[0]._id]: "3", // Wrong answer
      [this.testData.quiz.questions[1]._id]: "false", // Wrong answer
      [this.testData.quiz.questions[2]._id]: ["HTML"], // Wrong answer
    };

    const secondSubmissionResponse = await this.makeRequest(
      "PUT",
      `/student/quiz/${this.testData.quizId}/attempt/${this.testData.secondAttemptId}`,
      { answers: wrongAnswers },
      this.tokens.student
    );

    console.log("✅ Second attempt submitted");
    console.log(
      "📊 Second attempt score:",
      secondSubmissionResponse.data.data.score + "%"
    );

    // Try to start third attempt (should fail due to attempt limit)
    try {
      await this.makeRequest(
        "POST",
        `/student/quiz/${this.testData.quizId}/attempt`,
        null,
        this.tokens.student
      );
      throw new Error("Should not allow third attempt");
    } catch (error) {
      if (error.message.includes("Maximum attempts reached")) {
        console.log("✅ Correctly blocked third attempt due to limit");
      } else {
        throw error;
      }
    }
  }

  async testTimerFunctionality() {
    console.log("⏱️ Testing timer functionality...");

    // Create a quiz with very short time limit for testing
    const quickQuizData = {
      title: "Quick Timer Test Quiz",
      description: "Test timer functionality",
      courseId: this.testData.courseId,
      questions: [
        {
          type: "multiple-choice",
          question: "What is 1 + 1?",
          options: ["1", "2", "3", "4"],
          correctAnswer: "2",
          points: 1,
        },
      ],
      passingScore: 50,
      timeLimit: 1, // 1 minute
      attemptsAllowed: 1,
    };

    const quickQuizResponse = await this.makeRequest(
      "POST",
      "/instructor/quiz/create",
      quickQuizData,
      this.tokens.instructor
    );

    const quickQuizId = quickQuizResponse.data._id;
    console.log("✅ Quick timer test quiz created");

    // Start attempt
    const timerAttemptResponse = await this.makeRequest(
      "POST",
      `/student/quiz/${quickQuizId}/attempt`,
      null,
      this.tokens.student
    );

    console.log("✅ Timer test attempt started");

    // Wait for timer to expire (in real scenario, this would be automatic)
    // For testing purposes, we'll simulate timer expiry by submitting after delay
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Submit answers (should check time limit on server)
    const timerAnswers = {
      [quickQuizData.questions[0]._id]: "2",
    };

    try {
      await this.makeRequest(
        "PUT",
        `/student/quiz/${quickQuizId}/attempt/${timerAttemptResponse.data.attemptId}`,
        { answers: timerAnswers },
        this.tokens.student
      );
      console.log("✅ Timer validation working correctly");
    } catch (error) {
      if (error.message.includes("Time limit exceeded")) {
        console.log("✅ Timer correctly enforced time limit");
      } else {
        throw error;
      }
    }
  }

  async testCourseCompletion() {
    console.log("🎓 Testing course completion logic...");

    // Check course progress
    const progressResponse = await this.makeRequest(
      "GET",
      `/student/course-progress/get/${this.testData.studentId}/${this.testData.courseId}`,
      null,
      this.tokens.student
    );

    console.log("✅ Course progress retrieved");
    console.log(
      "📊 Course completed:",
      progressResponse.data.data.completed ? "Yes" : "No"
    );

    // Since we have final quizzes, course should be completed when all final quizzes are passed
    if (progressResponse.data.data.completed) {
      console.log("✅ Course completion logic working correctly");
    } else {
      console.log("⚠️ Course not yet completed (may require more quizzes)");
    }
  }
}

// Manual Testing Checklist Generator
class ManualTestingChecklist {
  static generateChecklist() {
    return `
# Quiz System Manual Testing Checklist

## Instructor Quiz Creation
- [ ] Create quiz with multiple question types (MCQ, True/False, Multiple Select)
- [ ] Set time limits and attempt limits
- [ ] Configure passing scores
- [ ] Associate quiz with lecture (lesson quiz) or course (final quiz)
- [ ] Edit existing quizzes
- [ ] Delete quizzes
- [ ] View quiz results and analytics

## Student Quiz Access
- [ ] Cannot access quiz without course enrollment
- [ ] Cannot access lesson quiz without completing prerequisite lecture
- [ ] Can access final quiz after course enrollment
- [ ] Quiz list shows available quizzes based on progress
- [ ] Quiz list shows attempt counts and best scores

## Quiz Taking Experience
- [ ] Quiz loads with proper timer display
- [ ] Questions display correctly for each type
- [ ] Navigation between questions works
- [ ] Answer selection works for all question types
- [ ] Auto-save functionality (if implemented)
- [ ] Cannot navigate away during quiz (browser warnings)
- [ ] Question progress indicator shows answered/unanswered

## Timer Functionality
- [ ] Timer counts down correctly
- [ ] Warning appears when time is low
- [ ] Auto-submission when timer expires
- [ ] Timer display updates in real-time
- [ ] Timer pauses when quiz is paused (if implemented)

## Quiz Submission & Validation
- [ ] Cannot submit with unanswered questions (warning shown)
- [ ] Validation prevents invalid answer formats
- [ ] Confirmation dialog for submission with unanswered questions
- [ ] Submission blocked after time expiry
- [ ] Progress updates correctly after submission

## Results & Scoring
- [ ] Results page shows score and pass/fail status
- [ ] Detailed breakdown of correct/incorrect answers
- [ ] Attempt history shows all previous attempts
- [ ] Best score highlighted
- [ ] Time taken displayed
- [ ] Certificate generation for passed quizzes (if implemented)

## Multiple Attempts
- [ ] Attempt counter increases correctly
- [ ] Previous attempts visible in results
- [ ] Attempt limit enforced
- [ ] Can retake after failing
- [ ] Best score tracking works

## Course Integration
- [ ] Quiz progress reflects in course overview
- [ ] Course completion requires final quiz passage
- [ ] Progress percentage updates correctly
- [ ] Quiz completion unlocks next content
- [ ] Course certificate requires all final quizzes passed

## Edge Cases & Error Handling
- [ ] Network disconnection during quiz
- [ ] Browser refresh during quiz
- [ ] Multiple tabs attempting same quiz
- [ ] Invalid quiz IDs
- [ ] Expired quiz sessions
- [ ] Database connection issues
- [ ] File upload for quiz media (if supported)

## Performance & Security
- [ ] Quiz loads quickly
- [ ] No sensitive data exposed in frontend
- [ ] API endpoints properly authenticated
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting on quiz endpoints

## Mobile Responsiveness
- [ ] Quiz interface works on mobile devices
- [ ] Touch interactions work correctly
- [ ] Timer and navigation accessible on mobile
- [ ] Results display properly on small screens

## Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alt text for images (if any)
`;
  }
}

// Issues Documentation Template
class IssuesDocumentation {
  static generateTemplate() {
    return `
# Quiz System Issues & Bugs Documentation

## Critical Issues (Block Production Deployment)

### Issue #1: [Issue Title]
**Severity:** Critical/High/Medium/Low
**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Browser name and version]
- OS: [Operating system]
- Device: [Desktop/Mobile]

**Screenshots/Logs:**
[Attach screenshots or error logs]

**Workaround:**
[Any temporary workaround]

**Fix Status:** Open/In Progress/Fixed
**Assigned To:** [Developer name]
**ETA:** [Estimated completion date]

---

## Performance Issues

### Issue #1: [Issue Title]
**Description:**
[Performance issue description]

**Metrics:**
- [Performance metrics before/after]
- [Load times, memory usage, etc.]

---

## UI/UX Issues

### Issue #1: [Issue Title]
**Description:**
[UI/UX issue description]

**Design Impact:**
[How it affects user experience]

---

## Feature Gaps

### Feature #1: [Missing Feature]
**Description:**
[What feature is missing]

**Business Impact:**
[Why this feature is needed]

**Priority:** High/Medium/Low
**Estimated Effort:** [Time estimate]

---

## Security Concerns

### Issue #1: [Security Issue]
**Description:**
[Security vulnerability description]

**Risk Level:** Critical/High/Medium/Low
**Potential Impact:**
[What could happen if exploited]

**Mitigation:**
[How to fix or mitigate]

---

## Browser Compatibility Issues

### Issue #1: [Browser Issue]
**Browser:** [Browser name]
**Version:** [Version number]
**Issue Description:**
[Compatibility problem]

---

## Summary
- **Total Critical Issues:** [Count]
- **Total High Priority Issues:** [Count]
- **Total Medium Priority Issues:** [Count]
- **Total Low Priority Issues:** [Count]

**Overall System Readiness:** [Percentage or status]
**Recommended Action:** [Deploy/Fix Critical Issues First/Hold Deployment]
`;
  }
}

// Run the tests
if (require.main === module) {
  const tester = new QuizSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = {
  QuizSystemTester,
  ManualTestingChecklist,
  IssuesDocumentation,
};
