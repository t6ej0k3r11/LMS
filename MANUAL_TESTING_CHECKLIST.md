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
