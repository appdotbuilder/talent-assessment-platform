
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { User, UserType, Assessment, Question, CandidateAssessment, CreateUserInput, CreateCompanyInput, CreateQuestionInput, CreateAssessmentInput, QuestionType, AssessmentStatus, CandidateAssessmentStatus } from '../../server/src/schema';

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Main data state
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidateAssessments, setCandidateAssessments] = useState<CandidateAssessment[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');

  // Form states
  const [userForm, setUserForm] = useState<CreateUserInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'candidate',
    company_id: undefined
  });

  const [companyForm, setCompanyForm] = useState<CreateCompanyInput>({
    name: '',
    domain: null
  });

  const [questionForm, setQuestionForm] = useState<CreateQuestionInput>({
    title: '',
    description: '',
    question_type: 'multiple_choice',
    options: null,
    correct_answer: null,
    company_id: 1,
    created_by: 1
  });

  const [assessmentForm, setAssessmentForm] = useState<CreateAssessmentInput>({
    title: '',
    description: null,
    company_id: 1,
    created_by: 1,
    time_limit_minutes: undefined
  });

  // Authentication function
  const handleLogin = (userType: UserType) => {
    const user: User = {
      id: 1,
      email: 'user@example.com',
      password_hash: 'hashed',
      first_name: 'John',
      last_name: 'Doe',
      user_type: userType,
      company_id: userType === 'candidate' ? null : 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Data loading functions
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query({ companyId: currentUser?.company_id || undefined });
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [currentUser?.company_id]);

  const loadAssessments = useCallback(async () => {
    if (!currentUser?.company_id) return;
    try {
      const result = await trpc.getAssessments.query({ companyId: currentUser.company_id });
      setAssessments(result);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    }
  }, [currentUser?.company_id]);

  const loadQuestions = useCallback(async () => {
    if (!currentUser?.company_id) return;
    try {
      const result = await trpc.getQuestions.query({ companyId: currentUser.company_id });
      setQuestions(result);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }, [currentUser?.company_id]);

  const loadCandidateAssessments = useCallback(async () => {
    if (!currentUser || currentUser.user_type !== 'candidate') return;
    try {
      const result = await trpc.getCandidateAssessments.query({ candidateId: currentUser.id });
      setCandidateAssessments(result);
    } catch (error) {
      console.error('Failed to load candidate assessments:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadUsers();
      if (currentUser.user_type !== 'candidate') {
        loadAssessments();
        loadQuestions();
      } else {
        loadCandidateAssessments();
      }
    }
  }, [isAuthenticated, currentUser, loadUsers, loadAssessments, loadQuestions, loadCandidateAssessments]);

  // Form submission handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(userForm);
      setUsers((prev: User[]) => [...prev, newUser]);
      setUserForm({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'candidate',
        company_id: undefined
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createCompany.mutate(companyForm);
      setCompanyForm({ name: '', domain: null });
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newQuestion = await trpc.createQuestion.mutate({
        ...questionForm,
        company_id: currentUser?.company_id || 1,
        created_by: currentUser?.id || 1
      });
      setQuestions((prev: Question[]) => [...prev, newQuestion]);
      setQuestionForm({
        title: '',
        description: '',
        question_type: 'multiple_choice',
        options: null,
        correct_answer: null,
        company_id: currentUser?.company_id || 1,
        created_by: currentUser?.id || 1
      });
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newAssessment = await trpc.createAssessment.mutate({
        ...assessmentForm,
        company_id: currentUser?.company_id || 1,
        created_by: currentUser?.id || 1
      });
      setAssessments((prev: Assessment[]) => [...prev, newAssessment]);
      setAssessmentForm({
        title: '',
        description: null,
        company_id: currentUser?.company_id || 1,
        created_by: currentUser?.id || 1,
        time_limit_minutes: undefined
      });
    } catch (error) {
      console.error('Failed to create assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCandidate = async (candidateId: number) => {
    if (!selectedAssessmentId) return;
    
    setIsLoading(true);
    try {
      await trpc.inviteCandidate.mutate({
        candidate_id: candidateId,
        assessment_id: parseInt(selectedAssessmentId)
      });
      setSelectedAssessmentId('');
    } catch (error) {
      console.error('Failed to invite candidate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: AssessmentStatus | CandidateAssessmentStatus): string => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'draft':
      case 'invited':
        return 'bg-yellow-500';
      case 'archived':
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">🎯 AssessmentPro</CardTitle>
            <CardDescription>Choose your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleLogin('administrator')} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              👑 Login as Administrator
            </Button>
            <Button 
              onClick={() => handleLogin('company_recruiter')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              🏢 Login as Company Recruiter
            </Button>
            <Button 
              onClick={() => handleLogin('candidate')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              👤 Login as Candidate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAssessments = assessments.filter((a: Assessment) => a.status === 'active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">🎯 AssessmentPro</h1>
              <Badge className={`${
                currentUser?.user_type === 'administrator' ? 'bg-purple-100 text-purple-800' :
                currentUser?.user_type === 'company_recruiter' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentUser?.user_type === 'administrator' ? '👑 Administrator' :
                 currentUser?.user_type === 'company_recruiter' ? '🏢 Recruiter' :
                 '👤 Candidate'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser?.first_name} {currentUser?.last_name}
              </span>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                  setSelectedAssessmentId('');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full mb-8" style={{
            gridTemplateColumns: currentUser?.user_type === 'administrator' ? 'repeat(5, 1fr)' :
                                 currentUser?.user_type === 'company_recruiter' ? 'repeat(4, 1fr)' :
                                 'repeat(2, 1fr)'
          }}>
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            {currentUser?.user_type === 'administrator' && (
              <>
                <TabsTrigger value="users">👥 Users</TabsTrigger>
                <TabsTrigger value="companies">🏢 Companies</TabsTrigger>
                <TabsTrigger value="assessments">📋 Assessments</TabsTrigger>
                <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
              </>
            )}
            {currentUser?.user_type === 'company_recruiter' && (
              <>
                <TabsTrigger value="questions">❓ Questions</TabsTrigger>
                <TabsTrigger value="assessments">📋 Assessments</TabsTrigger>
                <TabsTrigger value="candidates">👤 Candidates</TabsTrigger>
              </>
            )}
            {currentUser?.user_type === 'candidate' && (
              <TabsTrigger value="my-assessments">📝 My Assessments</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <span className="text-2xl">👥</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active platform users
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                  <span className="text-2xl">📋</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentUser?.user_type === 'candidate' ? candidateAssessments.length : assessments.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.user_type === 'candidate' ? 'Assigned to you' : 'Active assessments'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  <span className="text-2xl">❓</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Question bank size
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <span className="text-2xl">✅</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">
                    Average completion rate
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New assessment created: "Frontend Developer Skills"</span>
                    <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Candidate completed assessment: "React Knowledge Test"</span>
                    <span className="text-xs text-gray-500 ml-auto">4 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">New question added to bank: "JavaScript Closures"</span>
                    <span className="text-xs text-gray-500 ml-auto">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Administrator-only tabs */}
          {currentUser?.user_type === 'administrator' && (
            <>
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>👥 User Management</CardTitle>
                    <CardDescription>Create and manage platform users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userForm.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={userForm.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUserForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={userForm.first_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUserForm((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={userForm.last_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUserForm((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user_type">User Type</Label>
                          <Select
                            value={userForm.user_type}
                            onValueChange={(value: UserType) =>
                              setUserForm((prev: CreateUserInput) => ({ ...prev, user_type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="administrator">Administrator</SelectItem>
                              <SelectItem value="company_recruiter">Company Recruiter</SelectItem>
                              <SelectItem value="candidate">Candidate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="company_id">Company ID (Optional)</Label>
                          <Input
                            id="company_id"
                            type="number"
                            value={userForm.company_id || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setUserForm((prev: CreateUserInput) => ({ 
                                ...prev, 
                                company_id: e.target.value ? parseInt(e.target.value) : undefined 
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create User'}
                      </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Existing Users</h3>
                      {users.length === 0 ? (
                        <p className="text-gray-500">No users found. Create one above!</p>
                      ) : (
                        <div className="grid gap-4">
                          {users.map((user: User) => (
                            <Card key={user.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{user.first_name} {user.last_name}</h4>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                    <Badge className="mt-2" variant="secondary">
                                      {user.user_type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="text-right text-sm text-gray-500">
                                    <p>ID: {user.id}</p>
                                    <p>Created: {user.created_at.toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="companies" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🏢 Company Management</CardTitle>
                    <CardDescription>Create and manage companies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={companyForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCompanyForm((prev: CreateCompanyInput) => ({ ...prev, name: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="domain">Domain (Optional)</Label>
                          <Input
                            id="domain"
                            value={companyForm.domain || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCompanyForm((prev: CreateCompanyInput) => ({ 
                                ...prev, 
                                domain: e.target.value || null 
                              }))
                            }
                            placeholder="example.com"
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Company'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Recruiter-only tabs */}
          {currentUser?.user_type === 'company_recruiter' && (
            <>
              <TabsContent value="questions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>❓ Question Bank</CardTitle>
                    <CardDescription>Create and manage assessment questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateQuestion} className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="question_title">Question Title</Label>
                        <Input
                          id="question_title"
                          value={questionForm.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, title: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="question_description">Question Description</Label>
                        <Textarea
                          id="question_description"
                          value={questionForm.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, description: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="question_type">Question Type</Label>
                        <Select
                          value={questionForm.question_type}
                          onValueChange={(value: QuestionType) =>
                            setQuestionForm((prev: CreateQuestionInput) => ({ ...prev, question_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="coding_challenge">Coding Challenge</SelectItem>
                            <SelectItem value="free_text">Free Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {questionForm.question_type === 'multiple_choice' && (
                        <>
                          <div>
                            <Label htmlFor="options">Options (JSON format)</Label>
                            <Textarea
                              id="options"
                              value={questionForm.options || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setQuestionForm((prev: CreateQuestionInput) => ({ 
                                  ...prev, 
                                  options: e.target.value || null 
                                }))
                              }
                              placeholder='["Option A", "Option B", "Option C", "Option D"]'
                            />
                          </div>
                          <div>
                            <Label htmlFor="correct_answer">Correct Answer</Label>
                            <Input
                              id="correct_answer"
                              value={questionForm.correct_answer || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setQuestionForm((prev: CreateQuestionInput) => ({ 
                                  ...prev, 
                                  correct_answer: e.target.value || null 
                                }))
                              }
                            />
                          </div>
                        </>
                      )}
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Question'}
                      </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Question Bank</h3>
                      {questions.length === 0 ? (
                        <p className="text-gray-500">No questions yet. Create one above!</p>
                      ) : (
                        <div className="grid gap-4">
                          {questions.map((question: Question) => (
                            <Card key={question.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 pr-4">
                                    <h4 className="font-semibold">{question.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge variant="outline">
                                        {question.question_type.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        Created: {question.created_at.toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📋 Assessment Management</CardTitle>
                    <CardDescription>Create and manage assessments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAssessment} className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="assessment_title">Assessment Title</Label>
                        <Input
                          id="assessment_title"
                          value={assessmentForm.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAssessmentForm((prev: CreateAssessmentInput) => ({ ...prev, title: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        
                        <Label htmlFor="assessment_description">Description (Optional)</Label>
                        <Textarea
                          id="assessment_description"
                          value={assessmentForm.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setAssessmentForm((prev: CreateAssessmentInput) => ({ 
                              ...prev, 
                              description: e.target.value || null  
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="time_limit">Time Limit (minutes, optional)</Label>
                        <Input
                          id="time_limit"
                          type="number"
                          value={assessmentForm.time_limit_minutes || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAssessmentForm((prev: CreateAssessmentInput) => ({ 
                              ...prev, 
                              time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                            }))
                          }
                          min="1"
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Assessment'}
                      </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Assessments</h3>
                      {assessments.length === 0 ? (
                        <p className="text-gray-500">No assessments yet. Create one above!</p>
                      ) : (
                        <div className="grid gap-4">
                          {assessments.map((assessment: Assessment) => (
                            <Card key={assessment.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 pr-4">
                                    <h4 className="font-semibold">{assessment.title}</h4>
                                    {assessment.description && (
                                      <p className="text-sm text-gray-600 mt-1">{assessment.description}</p>
                                    )}
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge className={getStatusBadgeColor(assessment.status)}>
                                        {assessment.status}
                                      </Badge>
                                      {assessment.time_limit_minutes && (
                                        <Badge variant="outline">
                                          ⏱️ {assessment.time_limit_minutes} min
                                        </Badge>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        Created: {assessment.created_at.toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="candidates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>👤 Candidate Management</CardTitle>
                    <CardDescription>View and manage candidates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Candidates</h3>
                      {users.filter((user: User) => user.user_type === 'candidate').length === 0 ? (
                        <p className="text-gray-500">No candidates found.</p>
                      ) : (
                        <div className="grid gap-4">
                          {users.filter((user: User) => user.user_type === 'candidate').map((candidate: User) => (
                            <Card key={candidate.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{candidate.first_name} {candidate.last_name}</h4>
                                    <p className="text-sm text-gray-600">{candidate.email}</p>
                                  </div>
                                  <div className="space-x-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Invite to Assessment
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Invite Candidate</DialogTitle>
                                          <DialogDescription>
                                            Select an assessment to invite {candidate.first_name} {candidate.last_name} to.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <Select 
                                            value={selectedAssessmentId} 
                                            onValueChange={setSelectedAssessmentId}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder={activeAssessments.length > 0 ? "Select assessment" : "No active assessments"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {activeAssessments.map((assessment: Assessment) => (
                                                <SelectItem key={assessment.id} value={assessment.id.toString()}>
                                                  {assessment.title}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <Button 
                                            className="w-full" 
                                            onClick={() => handleInviteCandidate(candidate.id)}
                                            disabled={!selectedAssessmentId || isLoading}
                                          >
                                            {isLoading ? 'Sending...' : 'Send Invitation'}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Candidate-only tabs */}
          {currentUser?.user_type === 'candidate' && (
            <TabsContent value="my-assessments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📝 My Assessments</CardTitle>
                  <CardDescription>View and take your assigned assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidateAssessments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No assessments assigned yet.</p>
                        <p className="text-sm text-gray-400">Check back later or contact your recruiter.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {candidateAssessments.map((candidateAssessment: CandidateAssessment) => (
                          <Card key={candidateAssessment.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                  <h4 className="font-semibold">Assessment #{candidateAssessment.assessment_id}</h4>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className={getStatusBadgeColor(candidateAssessment.status)}>
                                      {candidateAssessment.status.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      Invited: {candidateAssessment.invited_at.toLocaleDateString()}
                                    </span>
                                  </div>
                                  {candidateAssessment.score !== null && candidateAssessment.total_points !== null && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium">
                                        Score: {candidateAssessment.score}/{candidateAssessment.total_points} 
                                        ({Math.round((candidateAssessment.score / candidateAssessment.total_points) * 100)}%)
                                      </p>
                                      <Progress 
                                        value={(candidateAssessment.score / candidateAssessment.total_points) * 100} 
                                        className="mt-1"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="space-x-2">
                                  {candidateAssessment.status === 'invited' && (
                                    <Button>
                                      Start Assessment
                                    </Button>
                                  )}
                                  {candidateAssessment.status === 'in_progress' && (
                                    <Button variant="outline">
                                      Continue Assessment
                                    </Button>
                                  )}
                                  {candidateAssessment.status === 'completed' && (
                                    <Button variant="outline" disabled>
                                      Completed
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Analytics Tab (Administrator only) */}
          {currentUser?.user_type === 'administrator' && (
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📈 Platform Analytics</CardTitle>
                  <CardDescription>Overview of platform performance and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">User Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Administrators</span>
                            <span>{users.filter((u: User) => u.user_type === 'administrator').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Recruiters</span>
                            <span>{users.filter((u: User) => u.user_type === 'company_recruiter').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Candidates</span>
                            <span>{users.filter((u: User) => u.user_type === 'candidate').length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Assessment Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Draft</span>
                            <span>{assessments.filter((a: Assessment) => a.status === 'draft').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active</span>
                            <span>{assessments.filter((a: Assessment) => a.status === 'active').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Archived</span>
                            <span>{assessments.filter((a: Assessment) => a.status === 'archived').length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
