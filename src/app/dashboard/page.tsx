"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Eye,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  studentProfile?: {
    country: string;
    fieldOfStudy: string;
    university: string;
    verificationStatus: string;
    verificationDocuments?: { type: string; verified: boolean }[];
  };
}

interface Campaign {
  id: string;
  title: string;
  story: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  status: string;
  createdAt: string;
  student?: { id: string; name: string; image?: string };
  studentProfile?: { verificationStatus: string };
}

interface Student {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  studentProfile?: {
    country: string;
    fieldOfStudy: string;
    university: string;
    verificationStatus: string;
    verificationDocuments?: { type: string; verified: boolean }[];
  };
}

interface Donation {
  id: string;
  amount: number;
  anonymous: boolean;
  paymentStatus: string;
  createdAt: string;
  campaign?: { id: string; title: string; category: string };
}

interface Stats {
  users: { total: number; students: number; donors: number; admins: number };
  verifications: { pending: number; verified: number; rejected: number };
  campaigns: { total: number; active: number; completed: number };
  donations: { totalAmount: number; totalCount: number };
}

const verificationStatuses: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  verified: {
    label: "Verified",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-300",
  },
  active: { label: "Active", color: "bg-blue-100 text-blue-800 border-blue-300" },
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<Student[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (sessionStatus === "authenticated") {
      loadDashboardData();
    }
  }, [sessionStatus, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get current user details
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();
      if (userData.success) {
        setCurrentUser(userData.data);
      }

      const role = userData.data?.role;

      if (role === "admin") {
        const [statsRes, pendingRes, verifiedRes, campaignsRes] =
          await Promise.all([
            fetch("/api/admin/stats"),
            fetch("/api/admin/students/pending"),
            fetch("/api/admin/students?status=verified"),
            fetch("/api/admin/campaigns"),
          ]);

        const [statsData, pendingData, verifiedData, campaignsData] =
          await Promise.all([
            statsRes.json(),
            pendingRes.json(),
            verifiedRes.json(),
            campaignsRes.json(),
          ]);

        setStats(statsData.data);
        setPendingStudents(pendingData.data || []);
        setVerifiedStudents(verifiedData.data || []);
        setAllCampaigns(campaignsData.data || []);
      } else if (role === "student") {
        try {
          const campaignsRes = await fetch("/api/campaigns/my");
          const campaignsData = await campaignsRes.json();
          setMyCampaigns(campaignsData.data || []);
        } catch {
          setMyCampaigns([]);
        }
      } else {
        // Donor
        try {
          const donationsRes = await fetch("/api/donations/my");
          const donationsData = await donationsRes.json();
          setMyDonations(donationsData.data || []);
        } catch {
          setMyDonations([]);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/students/${userId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Student ${action}d successfully`);
        loadDashboardData();
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to update verification status.");
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Admin Dashboard
  if (currentUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage and verify student campaigns
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Pending Verification
                    </p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats?.verifications?.pending || 0}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Verified Students
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.verifications?.verified || 0}
                    </p>
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
                    <p className="text-3xl font-bold text-blue-600">
                      ${(stats?.donations?.totalAmount || 0).toLocaleString()}
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
                    <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {stats?.donations?.totalCount || 0}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingStudents.length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({verifiedStudents.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Campaigns ({allCampaigns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingStudents.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">
                      No pending verifications
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingStudents.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img
                            src={
                              student.image ||
                              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                            }
                            alt={student.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                  {student.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {student.studentProfile?.fieldOfStudy} •{" "}
                                  {student.studentProfile?.country}
                                </p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-4">
                              {student.studentProfile?.university}
                            </p>
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Documents:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {student.studentProfile?.verificationDocuments?.map(
                                  (doc, idx) => (
                                    <Badge key={idx} variant="outline">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {doc.type}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                size="sm"
                                onClick={() => handleVerify(student.id, "approve")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(student.id, "reject")}
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
              {verifiedStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={
                          student.image ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                        }
                        alt={student.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {student.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {student.studentProfile?.fieldOfStudy} •{" "}
                              {student.studentProfile?.country}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        <p className="text-gray-700">
                          {student.studentProfile?.university}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allCampaigns.map((campaign) => {
                const progress =
                  campaign.targetAmount > 0
                    ? (campaign.raisedAmount / campaign.targetAmount) * 100
                    : 0;
                const statusInfo =
                  verificationStatuses[
                    campaign.studentProfile?.verificationStatus || "pending"
                  ];
                return (
                  <Card key={campaign.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={
                            campaign.student?.image ||
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                          }
                          alt={campaign.student?.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {campaign.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {campaign.student?.name} • {campaign.category}
                              </p>
                            </div>
                            <Badge
                              className={`${statusInfo?.color || "bg-gray-100"} border`}
                            >
                              {statusInfo?.label || campaign.status}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold">
                                ${(campaign.raisedAmount || 0).toLocaleString()}
                              </span>
                              <span className="text-gray-600">
                                ${(campaign.targetAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/campaign/${campaign.id}`)
                            }
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
  if (currentUser?.role === "student") {
    const myCampaign = myCampaigns[0];
    const studentProfile = currentUser.studentProfile;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Student Dashboard
            </h1>
            <p className="text-lg text-gray-600">Manage your campaign</p>
          </div>

          {/* Verification Status Alert */}
          {studentProfile && studentProfile.verificationStatus !== "verified" && (
            <Card className="mb-6 border-yellow-300 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Clock className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800">
                      Verification Pending
                    </h3>
                    <p className="text-yellow-700">
                      Your student profile is awaiting verification. You&apos;ll
                      be able to create campaigns once verified.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                          ${(myCampaign.raisedAmount || 0).toLocaleString()}
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
                        <p className="text-3xl font-bold text-green-600">
                          {myCampaign.donorCount || 0}
                        </p>
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
                          {myCampaign.targetAmount > 0
                            ? (
                                (myCampaign.raisedAmount /
                                  myCampaign.targetAmount) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
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
                    <Badge
                      className={
                        verificationStatuses[myCampaign.status]?.color ||
                        "bg-blue-100"
                      }
                    >
                      {myCampaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-bold mb-2">{myCampaign.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {myCampaign.story}
                  </p>
                  <Button
                    onClick={() => router.push(`/campaign/${myCampaign.id}`)}
                  >
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Campaign Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {studentProfile?.verificationStatus === "verified"
                    ? "Create your first campaign to start fundraising"
                    : "Complete verification to create a campaign"}
                </p>
                <Button
                  onClick={() => router.push("/create-campaign")}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={studentProfile?.verificationStatus !== "verified"}
                >
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
  const totalDonated = myDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Donor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your contributions and impact
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Donated</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${totalDonated.toLocaleString()}
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
                  <p className="text-sm text-gray-600 mb-1">Students Supported</p>
                  <p className="text-3xl font-bold text-green-600">
                    {myDonations.length}
                  </p>
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
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.min(100, myDonations.length * 10 + 50)}
                  </p>
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
            {myDonations.length > 0 ? (
              <div className="space-y-4">
                {myDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Heart className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">
                          {donation.campaign?.title || "Campaign"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        ${donation.amount}
                      </p>
                      {donation.campaign && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/campaign/${donation.campaign?.id}`)
                          }
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-6">
                  You haven&apos;t supported any campaigns yet
                </p>
                <Button
                  onClick={() => router.push("/browse")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Campaigns
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
