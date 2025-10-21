const mongoose = require("mongoose");
const Quiz = require("../../models/Quiz");
const QuizAttempt = require("../../models/QuizAttempt");
const StudentCourses = require("../../models/StudentCourses");
const CourseProgress = require("../../models/CourseProgress");
const { updateQuizProgress } = require("./course-progress-controller");

const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    // Check if student has purchased the course
    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
      "courses.courseId": courseId,
    });

    if (!studentCourses) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Course not purchased.",
      });
    }

    // Get quizzes for the course with populated attempts using aggregation to avoid N+1
    const quizzesWithAttempts = await Quiz.aggregate([
      {
        $match: {
          courseId: new mongoose.Types.ObjectId(courseId),
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "quizattempts",
          let: { quizId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quizId", "$$quizId"] },
                    {
                      $eq: [
                        "$studentId",
                        new mongoose.Types.ObjectId(studentId),
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: { attemptNumber: 1 },
            },
            {
              $project: {
                _id: 1,
                attemptNumber: 1,
                status: 1,
                startedAt: 1,
                completedAt: 1,
                score: 1,
                passed: 1,
              },
            },
          ],
          as: "attempts",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: quizzesWithAttempts,
    });
  } catch (e) {
    console.error("Error submitting quiz attempt:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found!",
      });
    }

    // Check if student has purchased the course
    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
      "courses.courseId": quiz.courseId,
    });

    if (!studentCourses) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Course not purchased.",
      });
    }

    // Check prerequisites for lesson quizzes
    if (quiz.lectureId) {
      const courseProgress = await CourseProgress.findOne({
        userId: studentId,
        courseId: quiz.courseId,
      });

      const completedLectureIds = courseProgress
        ? courseProgress.lecturesProgress
            .filter((lecture) => lecture.viewed)
            .map((lecture) => lecture.lectureId)
        : [];

      if (!completedLectureIds.includes(quiz.lectureId.toString())) {
        return res.status(403).json({
          success: false,
          message: "Prerequisites not met. Complete the lecture first.",
        });
      }
    }

    // Get existing attempts for this student and quiz
    const attempts = await QuizAttempt.find({
      quizId,
      studentId,
    }).sort({ attemptNumber: 1 });

    // Return quiz without correct answers
    const quizForStudent = {
      _id: quiz._id,
      courseId: quiz.courseId,
      lectureId: quiz.lectureId,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map((q) => ({
        _id: q._id,
        type: q.type,
        question: q.question,
        options: q.options,
        points: q.points,
      })),
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      attemptsAllowed: quiz.attemptsAllowed,
    };

    res.status(200).json({
      success: true,
      data: {
        quiz: quizForStudent,
        attempts: attempts.map((attempt) => ({
          _id: attempt._id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          score: attempt.score,
          passed: attempt.passed,
        })),
      },
    });
  } catch (e) {
    console.error("Error getting quiz by ID:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const startQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found!",
      });
    }

    // Check if student has purchased the course
    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
      "courses.courseId": quiz.courseId,
    });

    if (!studentCourses) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Course not purchased.",
      });
    }

    // Check prerequisites
    if (quiz.lectureId) {
      const courseProgress = await CourseProgress.findOne({
        userId: studentId,
        courseId: quiz.courseId,
      });

      const completedLectureIds = courseProgress
        ? courseProgress.lecturesProgress
            .filter((lecture) => lecture.viewed)
            .map((lecture) => lecture.lectureId)
        : [];

      if (!completedLectureIds.includes(quiz.lectureId.toString())) {
        return res.status(403).json({
          success: false,
          message: "Prerequisites not met. Complete the lecture first.",
        });
      }
    }

    // Check attempt limits
    const existingAttempts = await QuizAttempt.countDocuments({
      quizId,
      studentId,
    });

    if (existingAttempts >= quiz.attemptsAllowed) {
      return res.status(403).json({
        success: false,
        message: "Maximum attempts reached.",
      });
    }

    const attemptNumber = existingAttempts + 1;
    const startedAt = new Date();

    const newAttempt = new QuizAttempt({
      quizId,
      studentId,
      courseId: quiz.courseId,
      attemptNumber,
      answers: [],
      score: 0,
      totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      pointsEarned: 0,
      passed: false,
      startedAt,
      completedAt: startedAt, // Will be updated on submit
      timeSpent: 0,
    });

    const savedAttempt = await newAttempt.save();

    res.status(201).json({
      success: true,
      message: "Quiz attempt started",
      data: {
        attemptId: savedAttempt._id,
        attemptNumber,
        startedAt,
        timeLimit: quiz.timeLimit,
      },
    });
  } catch (e) {
    console.error("Error getting quizzes by course:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, attemptId } = req.params;
    const { answers } = req.body; // Array of { questionId, answer }
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    const attempt = await QuizAttempt.findById(attemptId);

    if (!quiz || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Quiz or attempt not found!",
      });
    }

    // Verify ownership
    if (
      attempt.studentId.toString() !== studentId ||
      attempt.quizId.toString() !== quizId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    // Check if already completed with atomic operation to prevent race conditions
    const updateResult = await QuizAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        status: { $ne: "completed" }, // Only update if not already completed
      },
      {
        $set: {
          status: "processing", // Temporary status to lock the attempt
        },
      },
      { new: true }
    );

    if (!updateResult) {
      return res.status(400).json({
        success: false,
        message: "Attempt already submitted or processing.",
      });
    }

    const completedAt = new Date();
    const timeSpent = Math.floor((completedAt - attempt.startedAt) / 1000); // in seconds

    // Check time limit
    if (quiz.timeLimit && timeSpent > quiz.timeLimit * 60) {
      // Reset status if time limit exceeded
      await QuizAttempt.findByIdAndUpdate(attemptId, { status: "in_progress" });
      return res.status(400).json({
        success: false,
        message: "Time limit exceeded.",
      });
    }

    // Calculate score
    let pointsEarned = 0;
    const processedAnswers = answers
      .map((answer) => {
        const question = quiz.questions.id(answer.questionId);
        if (!question) return null;

        let isCorrect = null;
        let points = 0;

        if (question.type === "broad-text") {
          // Broad text questions need manual review
          isCorrect = null;
          points = 0; // Will be assigned after review
        } else {
          // Automatic marking for multiple choice, true-false, etc.
          isCorrect = question.correctAnswer === answer.answer;
          points = isCorrect ? question.points : 0;
          pointsEarned += points;
        }

        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
          pointsEarned: points,
          needsReview: question.type === "broad-text",
        };
      })
      .filter(Boolean);

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    // For quizzes with broad-text questions, score might be incomplete until review
    const hasUnreviewedQuestions = processedAnswers.some(
      (answer) => answer.needsReview
    );
    const score = hasUnreviewedQuestions
      ? 0
      : Math.round((pointsEarned / totalPoints) * 100);
    const passed = hasUnreviewedQuestions ? false : score >= quiz.passingScore;

    // Update attempt atomically
    await QuizAttempt.findByIdAndUpdate(attemptId, {
      answers: processedAnswers,
      score,
      pointsEarned,
      passed,
      completedAt,
      timeSpent,
      status: "completed",
    });

    // Update quiz progress in course progress
    try {
      await updateQuizProgress(
        {
          body: {
            userId: studentId,
            courseId: quiz.courseId.toString(),
            quizId: quizId,
            score,
            passed,
          },
        },
        {
          status: () => ({ json: () => {} }),
        }
      );
    } catch (progressError) {
      console.log("Error updating quiz progress:", progressError);
      // Don't fail the quiz submission if progress update fails
    }

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        score,
        pointsEarned,
        totalPoints,
        passed,
        timeSpent,
      },
    });
  } catch (e) {
    console.error("Error starting quiz attempt:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

    // Validate quizId format
    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID format!",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found!",
      });
    }

    // Check if student has purchased the course
    const studentCourses = await StudentCourses.findOne({
      userId: studentId,
      "courses.courseId": quiz.courseId,
    });

    if (!studentCourses) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Course not purchased.",
      });
    }

    const attempts = await QuizAttempt.find({
      quizId,
      studentId,
    }).sort({ attemptNumber: 1 });

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          title: quiz.title,
          passingScore: quiz.passingScore,
          attemptsAllowed: quiz.attemptsAllowed,
        },
        attempts: attempts.map((attempt) => ({
          attemptNumber: attempt.attemptNumber,
          score: attempt.score,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent,
        })),
      },
    });
  } catch (e) {
    console.error("Error getting quiz results:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getQuizzesByCourse,
  getQuizById,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
};
