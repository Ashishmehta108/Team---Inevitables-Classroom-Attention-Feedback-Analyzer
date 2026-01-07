import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Clock, LogIn, LogOut, Users, BarChart3, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createClass,
  createPoll,
  createSession,
  getAttendanceCount,
  getPollResults,
  listMyClasses
} from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Props = { token: string };

export function TeacherView({ token }: Props) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [className, setClassName] = useState('');
  const [classSubject, setClassSubject] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pollTopic, setPollTopic] = useState('');
  const [pollOptions, setPollOptions] = useState('Yes,No');
  const [pollId, setPollId] = useState('');
  const [pollResults, setPollResults] = useState<Array<{ option: string; count: number }>>([]);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);

  useEffect(() => {
    listMyClasses(token)
      .then((list) => setClasses(list))
      .catch(() => {});
  }, [token]);

  // Update session duration
  useEffect(() => {
    if (isClockedIn) {
      const timer = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isClockedIn]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    setIsClockedIn(true);
    setClockInTime(new Date());
    toast.success('Clocked in successfully!');
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    toast.success(`Clocked out! Session duration: ${formatDuration(sessionDuration)}`);
  };

  const handleCreateClass = async () => {
    try {
      const cls = await createClass(token, { name: className, subject: classSubject });
      toast.success('Class created');
      setClasses((prev) => [...prev, cls]);
      setSelectedClassId(cls.id);
      setClassName('');
      setClassSubject('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create class');
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClassId) {
      toast.error('Select a class');
      return;
    }
    try {
      const session = await createSession(token, { classId: selectedClassId });
      setSessionId(session.id);
      toast.success(`Session started: ${session.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session');
    }
  };

  const handleStartPoll = async () => {
    if (!sessionId) {
      toast.error('Create or select a session first');
      return;
    }
    const options = pollOptions.split(',').map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error('Enter at least two options');
      return;
    }
    try {
      const poll = await createPoll(token, { sessionId, question: pollTopic || 'Quick poll', options });
      setPollId(poll.id);
      setPollResults(poll.options.map((o) => ({ option: o.text, count: 0 })));
      toast.success(`Poll created. ID: ${poll.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start poll');
    }
  };

  const refreshPollResults = async () => {
    if (!pollId) return;
    try {
      const data = await getPollResults(token, pollId);
      setPollResults(
        data.results.map((r) => ({
          option: r.text,
          count: r.count
        }))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to load poll results');
    }
  };

  const handleAttendanceCount = async () => {
    if (!sessionId) {
      toast.error('Session ID required');
      return;
    }
    try {
      const res = await getAttendanceCount(token, sessionId);
      setAttendanceCount(res.count);
      toast.success('Attendance count refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance count');
    }
  };

  const totalVotes = pollResults.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage classes, sessions, and polls</p>
          </div>
          <Badge variant={isClockedIn ? "default" : "outline"} className="text-lg px-4 py-2">
            {isClockedIn ? '🟢 In Session' : '⚪ Not in Session'}
          </Badge>
        </div>

        {/* Clock In/Out Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Session Management
            </CardTitle>
            <CardDescription>
              Clock in to start your class session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {isClockedIn ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Clocked in at: {clockInTime?.toLocaleTimeString()}</p>
                    <p className="text-2xl font-bold">{formatDuration(sessionDuration)}</p>
                  </div>
                ) : (
                  <p className="text-gray-600">Not clocked in</p>
                )}
              </div>
              {!isClockedIn ? (
                <Button onClick={handleClockIn} size="lg">
                  <LogIn className="w-4 h-4 mr-2" />
                  Clock In
                </Button>
              ) : (
                <Button onClick={handleClockOut} variant="destructive" size="lg">
                  <LogOut className="w-4 h-4 mr-2" />
                  Clock Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class management */}
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Create and select your classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input placeholder="Class name" value={className} onChange={(e) => setClassName(e.target.value)} />
              <Input placeholder="Subject" value={classSubject} onChange={(e) => setClassSubject(e.target.value)} />
              <Button onClick={handleCreateClass} disabled={!className || !classSubject}>
                Create Class
              </Button>
            </div>
            <div className="flex gap-3 flex-wrap">
              {classes.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedClassId === c.id ? 'default' : 'outline'}
                  onClick={() => setSelectedClassId(c.id)}
                  size="sm"
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Attendance
            </CardTitle>
            <CardDescription>
              Start a session and monitor attendance counts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <Button onClick={handleCreateSession} disabled={!selectedClassId} variant="outline">
                Create Session
              </Button>
              <Input
                placeholder="Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleAttendanceCount} disabled={!sessionId}>
                Refresh Count
              </Button>
              {attendanceCount !== null && (
                <span className="text-sm text-gray-700">Present: {attendanceCount}</span>
              )}
            </div>
            {attendanceCount !== null && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Latest count loaded</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Poll Creation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Topic Understanding Poll
            </CardTitle>
            <CardDescription>
              Create a poll to check student understanding in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Poll question"
                value={pollTopic}
                onChange={(e) => setPollTopic(e.target.value)}
              />
              <Input
                placeholder="Options comma separated"
                value={pollOptions}
                onChange={(e) => setPollOptions(e.target.value)}
              />
              <Button onClick={handleStartPoll} disabled={!sessionId}>
                Start Poll
              </Button>
            </div>
            {pollId && (
              <div className="flex items-center gap-3">
                <Badge>Poll ID: {pollId}</Badge>
                <Button size="sm" variant="outline" onClick={refreshPollResults}>
                  Refresh Results
                </Button>
              </div>
            )}
            {pollResults.length > 0 && (
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pollResults}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="option" angle={-15} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Number of Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pollResults.map((result) => (
                    <Card key={result.option}>
                      <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 mb-1">{result.option}</p>
                        <p className="text-2xl font-bold">{result.count}</p>
                        <p className="text-xs text-gray-500">
                          {totalVotes > 0 ? Math.round((result.count / totalVotes) * 100) : 0}%
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
