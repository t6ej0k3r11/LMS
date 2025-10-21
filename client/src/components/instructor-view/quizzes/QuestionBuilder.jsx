import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import PropTypes from "prop-types";

function QuestionBuilder({ questions, setQuestions }) {
  QuestionBuilder.propTypes = {
    questions: PropTypes.array.isRequired,
    setQuestions: PropTypes.func.isRequired,
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "multiple-choice",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        correctAnswerIndex: null,
        points: 1,
        requiresReview: false,
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;

    // Set requiresReview based on question type
    if (field === "type") {
      updatedQuestions[index].requiresReview = value === "broad-text";
      // Clear options for broad-text questions
      if (value === "broad-text") {
        updatedQuestions[index].options = [];
        updatedQuestions[index].correctAnswerIndex = null;
        updatedQuestions[index].correctAnswer = "";
      } else if (!updatedQuestions[index].options || updatedQuestions[index].options.length === 0) {
        updatedQuestions[index].options = ["", "", "", ""];
        updatedQuestions[index].correctAnswerIndex = null;
        updatedQuestions[index].correctAnswer = "";
      }
    }

    // Update correctAnswer when correctAnswerIndex changes
    if (field === "correctAnswerIndex") {
      if (value !== null && updatedQuestions[index].options[value]) {
        updatedQuestions[index].correctAnswer = updatedQuestions[index].options[value];
      } else {
        updatedQuestions[index].correctAnswer = "";
      }
    }

    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;

    // Update correctAnswer if the selected option is being edited
    if (updatedQuestions[questionIndex].correctAnswerIndex === optionIndex) {
      updatedQuestions[questionIndex].correctAnswer = value;
    }

    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push("");
    // If correctAnswerIndex was at the end, it might need adjustment, but since we're adding at the end, no change needed
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);

    // Adjust correctAnswerIndex if necessary
    if (updatedQuestions[questionIndex].correctAnswerIndex === optionIndex) {
      // If removing the selected correct answer, clear it
      updatedQuestions[questionIndex].correctAnswerIndex = null;
      updatedQuestions[questionIndex].correctAnswer = "";
    } else if (updatedQuestions[questionIndex].correctAnswerIndex > optionIndex) {
      // If removing an option before the selected one, decrement the index
      updatedQuestions[questionIndex].correctAnswerIndex -= 1;
    }

    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const renderQuestionType = (question, index) => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="space-y-2">
            <Label>Options</Label>
            <RadioGroup
              value={question.correctAnswerIndex?.toString() || ""}
              onValueChange={(value) => updateQuestion(index, "correctAnswerIndex", parseInt(value))}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={optionIndex.toString()} id={`option-${index}-${optionIndex}`} />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index, optionIndex)}
                    disabled={question.options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </RadioGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addOption(index)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        );

      case "true-false":
        return (
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <Select
              value={question.correctAnswer}
              onValueChange={(value) => updateQuestion(index, "correctAnswer", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "short-answer":
      case "essay":
      case "broad-text":
        return (
          <div className="space-y-2">
            <Label>Sample Answer (for reference)</Label>
            <Textarea
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
              placeholder="Enter sample answer or key points"
              rows={3}
            />
            {question.type === "broad-text" && (
              <div className="text-sm text-gray-600">
                Note: Broad text questions will require manual review by the instructor.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Questions</h3>
        <Button type="button" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions.map((question, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Question {index + 1}</CardTitle>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeQuestion(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) => updateQuestion(index, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="broad-text">Broad Text Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={question.question}
                onChange={(e) => updateQuestion(index, "question", e.target.value)}
                placeholder="Enter your question"
                rows={3}
              />
            </div>

            {renderQuestionType(question, index)}
          </CardContent>
        </Card>
      ))}

      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No questions added yet. Click &quot;Add Question&quot; to get started.
        </div>
      )}
    </div>
  );
}

export default QuestionBuilder;