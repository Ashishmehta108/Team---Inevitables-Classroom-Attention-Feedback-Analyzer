import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Users, Star, BarChart3 } from 'lucide-react';
import { getFeedbackAggregate, getTeacherReports } from '@/lib/api';
import { toast } from 'sonner';

type Props = { token: string };

export function AdminView({ token }: Props) {
  const [sessionId, setSessionId] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState<{
    sessionId: string;
    averageRating: number;
    totalFeedback: number;
  } | null>(null);
  const [teacherReports, setTeacherReports] = useState<
    Array<{
      teacherId: string;
      name: string;
      email: string;
      averageRating: number;
      totalFeedback: number;
      bonusAmount: number | null;
      bonusStatus: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  const loadFeedback = async () => {
    if (!sessionId) {
      toast.error('Enter session ID');
      return;
    }
    try {
      setLoading(true);
      const res = await getFeedbackAggregate(token, sessionId.trim());
      setFeedbackSummary(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getTeacherReports(token);
      setTeacherReports(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor performance and feedback</p>
          </div>
          <Badge variant="outline">Connected to backend</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Feedback Aggregate</CardTitle>
            <CardDescription>Fetch average rating and total feedback for a session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-center">
              <Input
                placeholder="Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={loadFeedback} disabled={loading || !sessionId}>
                Fetch Feedback
              </Button>
            </div>
            {feedbackSummary && (
              <div className="flex gap-4">
                <Badge variant="secondary">Session: {feedbackSummary.sessionId}</Badge>
                <Badge variant="outline">Average: {feedbackSummary.averageRating.toFixed(2)}</Badge>
                <Badge variant="outline">Responses: {feedbackSummary.totalFeedback}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Teacher Performance & Bonus
            </CardTitle>
            <CardDescription>Aggregated ratings and bonus suggestions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadReports} disabled={loading}>
              Load Reports
            </Button>
            <div className="space-y-3">
              {teacherReports.map((t) => (
                <div key={t.teacherId} className="border rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-gray-600">{t.email}</p>
                    </div>
                    <Badge variant="outline">{t.bonusStatus}</Badge>
                  </div>
                  <div className="flex gap-3 items-center text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" /> {t.averageRating.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {t.totalFeedback} responses
                    </span>
                    <span>Bonus: {t.bonusAmount ?? 'manual review'}</span>
                  </div>
                </div>
              ))}
              {teacherReports.length === 0 && <p className="text-sm text-gray-600">No reports loaded yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
