import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, GraduationCap, Calendar, Target, Share2, Heart, CheckCircle2, FileText, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { mockStudents, verificationStatuses } from '../mockData';
import { toast } from '../hooks/use-toast';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const student = mockStudents.find((s) => s.id === id);
  const [donationAmount, setDonationAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign not found</h2>
          <Button onClick={() => navigate('/browse')}>Browse Campaigns</Button>
        </div>
      </div>
    );
  }

  const progress = (student.raisedAmount / student.targetAmount) * 100;
  const remaining = student.targetAmount - student.raisedAmount;
  const status = verificationStatuses[student.verificationStatus];

  const handleDonate = (e) => {
    e.preventDefault();
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount.',
        variant: 'destructive',
      });
      return;
    }
    // Mock donation success
    toast({
      title: 'Thank you for your donation!',
      description: `Your donation of $${donationAmount} will help ${student.name} achieve their educational goals.`,
    });
    setDonationAmount('');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'Campaign link copied to clipboard.',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/browse')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <img
                    src={student.picture}
                    alt={student.name}
                    className="w-32 h-32 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {student.fieldOfStudy}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {student.country}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${status.color} border`}>
                        {student.verificationStatus === 'verified' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-4">{student.university}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Timeline: {student.timeline}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <Target className="h-4 w-4 mr-1" />
                        Category: {student.category}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story */}
            <Card>
              <CardHeader>
                <CardTitle>Student's Story</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{student.story}</p>
              </CardContent>
            </Card>

            {/* Impact Log */}
            <Card>
              <CardHeader>
                <CardTitle>Expected Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{student.impactLog}</p>
              </CardContent>
            </Card>

            {/* Documents */}
            {student.verificationStatus === 'verified' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Verified Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <span className="flex items-center text-gray-700">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          {doc.type}
                        </span>
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Donor Wall */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donors ({student.donors?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {student.donors && student.donors.length > 0 ? (
                    student.donors.slice(0, 10).map((donor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Heart className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{donor.name}</p>
                            <p className="text-xs text-gray-500">{new Date(donor.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">${donor.amount}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">Be the first to donate!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Donation Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Progress Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          ${student.raisedAmount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">raised</span>
                      </div>
                      <Progress value={progress} className="h-3 mb-2" />
                      <p className="text-sm text-gray-600">
                        ${student.targetAmount.toLocaleString()} goal
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{student.donors?.length || 0}</p>
                        <p className="text-sm text-gray-600">donors</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">${remaining.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">to go</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Donation Form */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleDonate} className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="mb-2 block">
                        Donation Amount (USD)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="1"
                        step="0.01"
                      />
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDonationAmount(amount.toString())}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>

                    {/* Anonymous Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                      />
                      <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                        Donate anonymously
                      </Label>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Heart className="mr-2 h-5 w-5" />
                      Donate Now
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Share Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
