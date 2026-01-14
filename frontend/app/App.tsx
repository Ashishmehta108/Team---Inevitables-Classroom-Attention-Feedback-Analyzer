"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentView } from '@/components/StudentView';
import { TeacherView } from '@/components/TeacherView';
import { AdminView } from '@/components/AdminView';
import { LogIn, GraduationCap, Users, Shield } from 'lucide-react';
import { Toaster } from 'sonner';
import { login, loginAnonymous, loginAnonymousWithCode, apiBaseUrl } from '@/lib/api';
import { toast } from 'sonner';

type UserRole = 'student' | 'teacher' | 'admin' | null;

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [existingStudentCode, setExistingStudentCode] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleStudentLogin = async () => {
    try {
      setStudentLoading(true);
      const res =
        existingStudentCode.trim().length > 0
          ? await loginAnonymousWithCode(existingStudentCode.trim())
          : await loginAnonymous();
      setAuthToken(res.token);
      setStudentCode(res.anonymousCode);
      setUserRole('student');
      toast.success(
        existingStudentCode.trim()
          ? 'Signed in with anonymous code'
          : 'Joined as new anonymous student'
      );
    } catch (err: any) {
      toast.error(err.message || 'Student login failed');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleUserLogin = async (role: 'teacher' | 'admin') => {
    const email = role === 'teacher' ? teacherEmail : adminEmail;
    const password = role === 'teacher' ? teacherPassword : adminPassword;
    try {
      const res = await login(email, password);
      const role = res.user.role.toLowerCase() as UserRole;
      role === 'teacher' ? setTeacherLoading(true) : setAdminLoading(true);
      setUserRole(role);
      setAuthToken(res.token);
      toast.success(`Logged in as ${role}`);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      role === 'teacher' ? setTeacherLoading(false) : setAdminLoading(false);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setAuthToken(null);
    setStudentCode(null);
    setTeacherEmail('');
    setTeacherPassword('');
    setAdminEmail('');
    setAdminPassword('');
  };

  // Render login screen if no role selected
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Classroom Attention & Feedback Analyzer</CardTitle>
            <CardDescription className="text-base mt-2">
              Choose your role to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Login */}
              <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Student Portal</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Mark attendance, give feedback, and participate in polls
                      </p>
                    </div>
              
                    <Button className="w-full" disabled={studentLoading} onClick={handleStudentLogin}>
                      <LogIn className="w-4 h-4 mr-2" />
                      {existingStudentCode ? 'Sign in with Code' : 'Join as Student'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Login */}
              <Card className="hover:shadow-lg transition-shadow border-2 hover:border-green-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Teacher Portal</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage classes, post attendance, and create polls
                      </p>
                    </div>
                    <div className="w-full space-y-2">
                      <Input 
                        placeholder="teacher@example.com" 
                        value={teacherEmail} 
                        onChange={(e) => setTeacherEmail(e.target.value)} 
                        disabled={teacherLoading}
                      />
                      <Input 
                        type="password" 
                        placeholder="password123" 
                        value={teacherPassword} 
                        onChange={(e) => setTeacherPassword(e.target.value)} 
                        disabled={teacherLoading}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleUserLogin('teacher')}
                      disabled={teacherLoading}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login as Teacher
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Login */}
              <Card className="hover:shadow-lg transition-shadow border-2 hover:border-purple-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-10 h-10 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Admin Portal</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        View analytics, manage reports, and track performance
                      </p>
                    </div>
                    <div className="w-full space-y-2">
                      <Input 
                        placeholder="admin@example.com" 
                        value={adminEmail} 
                        onChange={(e) => setAdminEmail(e.target.value)} 
                        disabled={adminLoading}
                      />
                      <Input 
                        type="password" 
                        placeholder="password123" 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)} 
                        disabled={adminLoading}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleUserLogin('admin')}
                      disabled={adminLoading}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login as Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">System Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Students:</strong> Anonymous feedback, real-time polls, and post-class reviews</li>
                <li>• <strong>Teachers:</strong> Attendance tracking, live poll results, and session management</li>
                <li>• <strong>Admins:</strong> Comprehensive analytics, teacher performance reports, and bonus calculations</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3">API base: {apiBaseUrl()}</p>
            </div>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  // Render appropriate view based on role
  return (
    <div className="min-h-screen">
      {/* Logout Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      {/* Render role-specific view */}
      {userRole === 'student' && authToken && (
        <StudentView token={authToken} studentCode={studentCode ?? ''} />
      )}
      {userRole === 'teacher' && authToken && (
        <TeacherView token={authToken} />
      )}
      {userRole === 'admin' && authToken && (
        <AdminView token={authToken} />
      )}
      
      <Toaster />
    </div>
  );
}

export default App;
