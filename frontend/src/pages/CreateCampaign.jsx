import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { getCategories, getCountries, getFieldsOfStudy, createStudentProfile, createCampaign } from '../services/api';
import { toast } from '../hooks/use-toast';

const CreateCampaign = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState([]);
  
  const currentUser = user?.data || user;
  const studentProfile = currentUser?.student_profile;
  const isVerified = studentProfile?.verification_status === 'verified';
  const hasProfile = !!studentProfile;

  const [formData, setFormData] = useState({
    // Profile data (Step 1)
    country: studentProfile?.country || '',
    fieldOfStudy: studentProfile?.field_of_study || '',
    university: studentProfile?.university || '',
    // Campaign data (Step 2)
    title: '',
    story: '',
    targetAmount: '',
    category: '',
    timeline: '',
    impactLog: '',
    // Documents (Step 3)
    documents: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, countryRes, fieldsRes] = await Promise.all([
          getCategories(),
          getCountries(),
          getFieldsOfStudy()
        ]);
        setCategories(catRes.data || []);
        setCountries(countryRes.data || []);
        setFieldsOfStudy(fieldsRes.data || []);
      } catch (error) {
        console.error('Failed to load static data:', error);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      docType: 'Student ID' // Default type
    }));
    setFormData({ ...formData, documents: [...formData.documents, ...newDocs] });
  };

  const removeDocument = (index) => {
    const newDocs = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: newDocs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If user doesn't have a profile yet, create one
      if (!hasProfile) {
        await createStudentProfile({
          country: formData.country,
          field_of_study: formData.fieldOfStudy,
          university: formData.university,
          verification_documents: formData.documents.map(doc => ({
            type: doc.docType || doc.name,
            url: null,
            verified: false
          }))
        });
        
        toast({
          title: 'Profile Created!',
          description: 'Your student profile has been created and is pending verification.',
        });
        
        // Redirect to dashboard - they need to wait for verification
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // If verified, create the campaign
      if (isVerified) {
        await createCampaign({
          title: formData.title,
          story: formData.story,
          category: formData.category,
          target_amount: parseFloat(formData.targetAmount),
          timeline: formData.timeline,
          impact_log: formData.impactLog
        });

        toast({
          title: 'Campaign Created!',
          description: 'Your campaign is now live and accepting donations.',
        });

        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      return formData.country && formData.university && formData.fieldOfStudy;
    }
    if (step === 2) {
      return formData.title && formData.story && formData.targetAmount && formData.category && formData.timeline;
    }
    if (step === 3) {
      return formData.documents.length >= 2;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
    }
  };

  // If user is verified, skip profile step
  const totalSteps = isVerified ? 2 : 3;
  const currentStep = isVerified && step > 1 ? step - 1 : step;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isVerified ? 'Create Your Campaign' : 'Apply as a Student'}
          </h1>
          <p className="text-lg text-gray-600">
            {isVerified 
              ? 'Share your story and get support for your education'
              : 'Submit your profile for verification to start fundraising'}
          </p>
        </div>

        {/* Verification Notice */}
        {hasProfile && !isVerified && (
          <Card className="mb-8 border-yellow-300 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-800">Verification Pending</h3>
                  <p className="text-yellow-700">
                    Your profile is awaiting verification. Once approved, you&apos;ll be able to create campaigns.
                    Check your dashboard for status updates.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Only show form if: no profile OR verified */}
        {(!hasProfile || isVerified) && (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].slice(0, totalSteps).map((num) => (
                <React.Fragment key={num}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentStep >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    } font-bold`}
                  >
                    {num}
                  </div>
                  {num < totalSteps && (
                    <div
                      className={`w-24 h-1 ${
                        currentStep > num ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information (for new students) */}
              {step === 1 && !isVerified && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 1: Student Information</CardTitle>
                    <CardDescription>Tell us about yourself and your education</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                        <Select value={formData.fieldOfStudy} onValueChange={(value) => handleInputChange('fieldOfStudy', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldsOfStudy.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="university">University/Institution *</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                        placeholder="Enter your university name"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="button" onClick={nextStep}>
                        Next Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Campaign Details (for verified students) OR Step 1 for verified */}
              {((step === 2 && !isVerified) || (step === 1 && isVerified)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{isVerified ? 'Step 1' : 'Step 2'}: Campaign Details</CardTitle>
                    <CardDescription>Share your story and funding needs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Help me complete my Computer Science degree"
                      />
                    </div>

                    <div>
                      <Label htmlFor="story">Your Story *</Label>
                      <Textarea
                        id="story"
                        value={formData.story}
                        onChange={(e) => handleInputChange('story', e.target.value)}
                        placeholder="Share your educational journey, goals, and why you need support..."
                        rows={6}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Funding Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="targetAmount">Target Amount (USD) *</Label>
                        <Input
                          id="targetAmount"
                          type="number"
                          value={formData.targetAmount}
                          onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                          placeholder="5000"
                          min="100"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="timeline">Timeline *</Label>
                      <Input
                        id="timeline"
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        placeholder="e.g., 6 months, 1 year"
                      />
                    </div>

                    <div>
                      <Label htmlFor="impactLog">Expected Impact</Label>
                      <Textarea
                        id="impactLog"
                        value={formData.impactLog}
                        onChange={(e) => handleInputChange('impactLog', e.target.value)}
                        placeholder="How will this education help you make an impact?"
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      {!isVerified && (
                        <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                          Back
                        </Button>
                      )}
                      {isVerified ? (
                        <Button type="button" onClick={nextStep} className="ml-auto">
                          Next Step
                        </Button>
                      ) : (
                        <Button type="button" onClick={nextStep}>
                          Next Step
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Documents (for new students) OR Step 2: Review & Submit (for verified) */}
              {((step === 3 && !isVerified) || (step === 2 && isVerified)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{isVerified ? 'Step 2' : 'Step 3'}: {isVerified ? 'Review & Submit' : 'Verification Documents'}</CardTitle>
                    <CardDescription>
                      {isVerified 
                        ? 'Review your campaign details and submit'
                        : 'Upload at least 2 documents (Student ID, Acceptance Letter, Transcript, etc.)'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isVerified && (
                      <>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">Upload your documents</p>
                          <input
                            type="file"
                            id="fileUpload"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('fileUpload').click()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Choose Files
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG (Max 10MB each)</p>
                        </div>

                        {/* Uploaded Documents List */}
                        {formData.documents.length > 0 && (
                          <div className="space-y-2">
                            <Label>Uploaded Documents ({formData.documents.length})</Label>
                            {formData.documents.map((doc, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(2)} KB</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDocument(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {isVerified && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Campaign Summary</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Title:</dt>
                              <dd className="font-medium">{formData.title}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Category:</dt>
                              <dd className="font-medium">{formData.category}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Target Amount:</dt>
                              <dd className="font-medium">${formData.targetAmount}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Timeline:</dt>
                              <dd className="font-medium">{formData.timeline}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {isVerified 
                          ? 'Your campaign will go live immediately after submission.'
                          : 'All documents will be verified by our admin team before your profile is approved. This usually takes 24-48 hours.'}
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading || (!isVerified && formData.documents.length < 2)} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          isVerified ? 'Create Campaign' : 'Submit for Verification'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateCampaign;
