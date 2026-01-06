import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Heart, TrendingUp, Users, DollarSign, FileText, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { mockStudents, mockUsers, verificationStatuses } from '../mockData';
import { toast } from '../hooks/use-toast';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(mockStudents);

  // Mock user - in real app, this comes from auth
  const currentUser = user || mockUsers[0];

  const handleVerify = (studentId, status) => {
    setStudents(
      students.map((s) =>
        s.id === studentId ? { ...s, verificationStatus: status } : s
      )
    );
    toast({
      title: status === 'verified' ? 'Student Verified' : 'Verification Rejected',
      description: `Campaign has been ${status === 'verified' ? 'approved' : 'rejected'}.`,
    });
  };

  // Admin Dashboard
  if (currentUser.role === 'admin') {
    const pendingStudents = students.filter((s) => s.verificationStatus === 'pending');
    const verifiedStudents = students.filter((s) => s.verificationStatus === 'verified');
    const totalRaised = students.reduce((sum, s) => sum + s.raisedAmount, 0);
    const totalDonors = students.reduce((sum, s) => sum + (s.donors?.length || 0), 0);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">Manage and verify student campaigns</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pending Verification</p>
                    <p className="text-3xl font-bold text-yellow-600">{pendingStudents.length}</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Verified Students</p>
                    <p className="text-3xl font-bold text-green-600">{verifiedStudents.length}</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Raised</p>
                    <p className="text-3xl font-bold text-blue-600">${totalRaised.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Donors</p>
                    <p className="text-3xl font-bold text-purple-600">{totalDonors}</p>
                  </div>
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Queue */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingStudents.length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({verifiedStudents.length})</TabsTrigger>
              <TabsTrigger value="all">All Campaigns ({students.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingStudents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">No pending verifications</p>
                  </CardContent>
                </Card>
              ) : (
                pendingStudents.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img
                            src={student.picture}
                            alt={student.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {student.fieldOfStudy} • {student.country}
                                </p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-4 line-clamp-2">{student.story}</p>
                            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                              <span>Target: ${student.targetAmount.toLocaleString()}</span>
                              <span>Category: {student.category}</span>
                              <span>Timeline: {student.timeline}</span>
                            </div>
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Documents:</p>
                              <div className="flex flex-wrap gap-2">
                                {student.documents.map((doc, idx) => (
                                  <Badge key={idx} variant="outline">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {doc.type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/campaign/${student.id}`)}
                                variant="outline"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(student.id, 'verified')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(student.id, 'rejected')}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {verifiedStudents.map((student) => {
                const progress = (student.raisedAmount / student.targetAmount) * 100;
                return (
                  <Card key={student.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={student.picture}
                          alt={student.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">
                                {student.fieldOfStudy} • {student.country}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold">${student.raisedAmount.toLocaleString()}</span>
                              <span className="text-gray-600">${student.targetAmount.toLocaleString()}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span>{student.donors?.length || 0} donors</span>
                            <span>{progress.toFixed(0)}% funded</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/campaign/${student.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {students.map((student) => {
                const progress = (student.raisedAmount / student.targetAmount) * 100;
                const status = verificationStatuses[student.verificationStatus];
                return (
                  <Card key={student.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={student.picture}
                          alt={student.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">
                                {student.fieldOfStudy} • {student.country}
                              </p>
                            </div>
                            <Badge className={`${status.color} border`}>{status.label}</Badge>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold">${student.raisedAmount.toLocaleString()}</span>
                              <span className="text-gray-600">${student.targetAmount.toLocaleString()}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/campaign/${student.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (currentUser.role === 'student') {
    const myCampaign = students.find((s) => s.email === currentUser.email);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your campaign</p>
          </div>

          {myCampaign ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Raised</p>
                        <p className="text-3xl font-bold text-blue-600">
                          ${myCampaign.raisedAmount.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-10 w-10 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Donors</p>
                        <p className="text-3xl font-bold text-green-600">{myCampaign.donors?.length || 0}</p>
                      </div>
                      <Heart className="h-10 w-10 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Progress</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {((myCampaign.raisedAmount / myCampaign.targetAmount) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>Your Campaign</CardTitle>
                    <Badge className={verificationStatuses[myCampaign.verificationStatus].color}>
                      {verificationStatuses[myCampaign.verificationStatus].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(`/campaign/${myCampaign.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Campaign
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Campaign Yet</h3>
                <p className="text-gray-600 mb-6">Create your first campaign to get started</p>
                <Button onClick={() => navigate('/create-campaign')} className="bg-blue-600 hover:bg-blue-700">
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Donor Dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Donor Dashboard</h1>
          <p className="text-lg text-gray-600">Track your contributions and impact</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Donated</p>
                  <p className="text-3xl font-bold text-blue-600">$1,500</p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Students Supported</p>
                  <p className="text-3xl font-bold text-green-600">3</p>
                </div>
                <Users className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Impact Score</p>
                  <p className="text-3xl font-bold text-purple-600">92</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supported Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Your Supported Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-6">You haven't supported any campaigns yet</p>
              <Button onClick={() => navigate('/browse')} className="bg-blue-600 hover:bg-blue-700">
                Browse Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
