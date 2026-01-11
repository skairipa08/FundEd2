"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Calendar,
  Target,
  Share2,
  Heart,
  CheckCircle2,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Campaign {
  id: string;
  title: string;
  story: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  timeline: string;
  impactLog?: string;
  status: string;
  student?: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    country?: string;
    fieldOfStudy?: string;
    university?: string;
    verificationStatus?: string;
    verificationDocuments?: { type: string; verified: boolean }[];
  } | null;
  donors?: { name: string; amount: number; date: string; anonymous: boolean }[];
}

const verificationStatuses: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Pending Verification",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  verified: {
    label: "Verified Student",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  rejected: {
    label: "Verification Rejected",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}`);
        const data = await res.json();
        if (data.success) {
          setCampaign(data.data);
        }
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaign();
  }, [id]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    if (!isAnonymous && !donorName) {
      alert("Please enter your name or choose to donate anonymously.");
      return;
    }

    setProcessingPayment(true);

    try {
      const res = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign?.id,
          amount: amount,
          donorName: isAnonymous ? "Anonymous" : donorName,
          donorEmail: donorEmail || null,
          anonymous: isAnonymous,
          originUrl: window.location.origin,
        }),
      });

      const data = await res.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Donation error:", error);
      alert("Failed to process donation. Please try again.");
      setProcessingPayment(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Campaign link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Campaign not found
          </h2>
          <Button onClick={() => router.push("/browse")}>
            Browse Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const student = campaign.student;
  const progress =
    campaign.targetAmount > 0
      ? (campaign.raisedAmount / campaign.targetAmount) * 100
      : 0;
  const remaining = Math.max(0, campaign.targetAmount - campaign.raisedAmount);
  const verificationStatus = student?.verificationStatus || "pending";
  const status =
    verificationStatuses[verificationStatus] || verificationStatuses.pending;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/browse")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                  <img
                    src={
                      student?.image ||
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
                    }
                    alt={student?.name || "Student"}
                    className="w-32 h-32 rounded-xl object-cover mb-4 md:mb-0"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                          {campaign.title}
                        </h1>
                        <p className="text-lg text-gray-700 font-medium mb-2">
                          {student?.name || "Student"}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {student?.fieldOfStudy && (
                            <span className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1" />
                              {student.fieldOfStudy}
                            </span>
                          )}
                          {student?.country && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {student.country}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={`${status.color} border mt-2 md:mt-0`}>
                        {verificationStatus === "verified" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {status.label}
                      </Badge>
                    </div>
                    {student?.university && (
                      <p className="text-gray-700 mb-4">{student.university}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Timeline: {campaign.timeline}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <Target className="h-4 w-4 mr-1" />
                        Category: {campaign.category}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story */}
            <Card>
              <CardHeader>
                <CardTitle>Student&apos;s Story</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {campaign.story}
                </p>
              </CardContent>
            </Card>

            {/* Impact Log */}
            {campaign.impactLog && (
              <Card>
                <CardHeader>
                  <CardTitle>Expected Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {campaign.impactLog}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Verified Documents */}
            {verificationStatus === "verified" &&
              student?.verificationDocuments &&
              student.verificationDocuments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Verified Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {student.verificationDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <span className="flex items-center text-gray-700">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            {doc.type}
                          </span>
                          <Badge className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Donor Wall */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Recent Donors ({campaign.donors?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaign.donors && campaign.donors.length > 0 ? (
                    campaign.donors.slice(0, 10).map((donor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Heart className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {donor.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(donor.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">
                          ${donor.amount}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">
                      Be the first to donate!
                    </p>
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
                          ${(campaign.raisedAmount || 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">raised</span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-3 mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        ${(campaign.targetAmount || 0).toLocaleString()} goal
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {campaign.donorCount || 0}
                        </p>
                        <p className="text-sm text-gray-600">donors</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          ${remaining.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">to go</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Donation Form */}
              {campaign.status === "active" && (
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
                          disabled={processingPayment}
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
                            disabled={processingPayment}
                          >
                            ${amount}
                          </Button>
                        ))}
                      </div>

                      {!isAnonymous && (
                        <>
                          <div>
                            <Label htmlFor="donorName" className="mb-2 block">
                              Your Name
                            </Label>
                            <Input
                              id="donorName"
                              type="text"
                              placeholder="Enter your name"
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              disabled={processingPayment}
                            />
                          </div>
                          <div>
                            <Label htmlFor="donorEmail" className="mb-2 block">
                              Email (optional)
                            </Label>
                            <Input
                              id="donorEmail"
                              type="email"
                              placeholder="Enter your email"
                              value={donorEmail}
                              onChange={(e) => setDonorEmail(e.target.value)}
                              disabled={processingPayment}
                            />
                          </div>
                        </>
                      )}

                      {/* Anonymous Checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="anonymous"
                          checked={isAnonymous}
                          onCheckedChange={(checked) =>
                            setIsAnonymous(checked as boolean)
                          }
                          disabled={processingPayment}
                        />
                        <Label
                          htmlFor="anonymous"
                          className="text-sm cursor-pointer"
                        >
                          Donate anonymously
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                        disabled={processingPayment}
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Heart className="mr-2 h-5 w-5" />
                            Donate Now
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {campaign.status === "completed" && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Campaign Completed!
                    </h3>
                    <p className="text-gray-600">
                      This campaign has reached its goal. Thank you to all
                      donors!
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Share Button */}
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
