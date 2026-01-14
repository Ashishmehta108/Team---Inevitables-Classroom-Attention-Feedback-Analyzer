import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { CheckCircle2, Clock, MessageSquare, BarChart3, Star } from 'lucide-react';
import { toast } from 'sonner';
import { createDoubt, getPollResults, markAttendance, respondPoll, submitFeedback } from '@/lib/api';
import { Input } from './ui/input';

interface StudentViewProps {
  token: string;
  studentCode: string;
}

export function StudentView({ token, studentCode }: StudentViewProps) {
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceTimeLeft, setAttendanceTimeLeft] = useState(300); // 5 minutes
  const [sessionId, setSessionId] = useState('');
  const [pollId, setPollId] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [doubtText, setDoubtText] = useState('');
  const [showPostClassFeedback, setShowPostClassFeedback] = useState(false);
  const [rating, setRating] = useState(4);
  const [additionalComments, setAdditionalComments] = useState('');

  // Simulate attendance window countdown
  useEffect(() => {
    if (attendanceTimeLeft > 0 && !attendanceMarked) {
      const timer = setTimeout(() => setAttendanceTimeLeft(attendanceTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [attendanceTimeLeft, attendanceMarked]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkAttendance = async () => {
    if (!sessionId.trim()) {
      toast.error('Please enter a session ID');
      return;
    }
    try {
      await markAttendance(token, sessionId.trim());
      setAttendanceMarked(true);
      toast.success('Attendance marked successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark attendance');
    }
  };

  const handleRealTimeFeedback = async () => {
    if (!sessionId.trim()) {
      toast.error('Enter session ID');
      return;
    }
    if (!doubtText.trim()) {
      toast.error('Enter a doubt or question');
      return;
    }
    try {
      await createDoubt(token, sessionId.trim(), doubtText);
      toast.success('Your feedback has been sent to the teacher');
      setDoubtText('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send feedback');
    }
  };

  const loadPoll = async () => {
    if (!pollId.trim()) {
      toast.error('Enter poll ID');
      return;
    }
    try {
      const data = await getPollResults(token, pollId.trim());
      setPollQuestion(data.poll.question);
      setPollOptions(data.results.map((r) => ({ id: r.optionId, text: r.text })));
      setSelectedOptionId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load poll');
    }
  };

  const handlePollVote = async () => {
    if (!pollId || !selectedOptionId) {
      toast.error('Select an option');
      return;
    }
    try {
      await respondPoll(token, pollId.trim(), selectedOptionId);
      toast.success('Your vote has been recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to vote');
    }
  };

  const handlePostClassFeedback = async () => {
    if (!sessionId.trim()) {
      toast.error('Session ID required');
      return;
    }
    try {
      await submitFeedback(token, sessionId.trim(), rating, additionalComments);
      toast.success('Post-class feedback submitted successfully!');
      setAdditionalComments('');
      setShowPostClassFeedback(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Anonymous Code: {studentCode}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Current Class: Mathematics 101
          </Badge>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Session ID</Label>
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="session id"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Poll ID</Label>
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="poll id"
                  value={pollId}
                  onChange={(e) => setPollId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mark Attendance
            </CardTitle>
            <CardDescription>
              You have {formatTime(attendanceTimeLeft)} minutes to mark your attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!attendanceMarked ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Time remaining: <span className="font-semibold text-lg">{formatTime(attendanceTimeLeft)}</span>
                </div>
                <Button 
                  onClick={handleMarkAttendance} 
                  disabled={!sessionId }
                >
                  Mark Present
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Attendance marked successfully</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Poll */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Topic Understanding Poll
            </CardTitle>
            <CardDescription>
              Enter poll ID and then select one of the options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={pollId} onChange={(e) => setPollId(e.target.value)} placeholder="Poll ID" />
              <Button variant="outline" onClick={loadPoll}>
                Load Poll
              </Button>
            </div>
            {pollQuestion && (
              <div className="space-y-3">
                <p className="font-medium">{pollQuestion}</p>
                <div className="space-y-2">
                  {pollOptions.map((opt) => (
                    <Button
                      key={opt.id}
                      variant={selectedOptionId === opt.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedOptionId(opt.id)}
                    >
                      {opt.text}
                    </Button>
                  ))}
                </div>
                <Button onClick={handlePollVote} className="w-full" disabled={!selectedOptionId}>
                  Submit Vote
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Real-time Feedback & Doubts
            </CardTitle>
            <CardDescription>
              Share specific doubts or questions about the topic (anonymous)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="E.g., I didn't understand the concept of slope-intercept form..."
              value={doubtText}
              onChange={(e) => setDoubtText(e.target.value)}
              rows={4}
            />
            <Button onClick={handleRealTimeFeedback} disabled={!doubtText.trim()}>
              Send Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Post-class Feedback Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Post-Class Feedback
            </CardTitle>
            <CardDescription>
              Provide detailed feedback after class (sent directly to admin)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPostClassFeedback ? (
              <Button onClick={() => setShowPostClassFeedback(true)} variant="outline" className="w-full">
                Open Post-Class Feedback Form
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Additional Comments */}
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Comments (Optional)</Label>
                  <Textarea
                    placeholder="Any other feedback you'd like to share..."
                    value={additionalComments}
                    onChange={(e) => setAdditionalComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handlePostClassFeedback} className="flex-1">
                    Submit Feedback
                  </Button>
                  <Button onClick={() => setShowPostClassFeedback(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

