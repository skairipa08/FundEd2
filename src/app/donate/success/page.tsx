"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function DonateSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "error">(
    "checking"
  );
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    campaignId: string;
  } | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const campaignId = searchParams.get("campaign_id");

    if (!sessionId) {
      setStatus("error");
      return;
    }

    const checkPayment = async (attempts = 0) => {
      const maxAttempts = 10;

      if (attempts >= maxAttempts) {
        setStatus("error");
        return;
      }

      try {
        const res = await fetch(`/api/donations/status/${sessionId}`);
        const data = await res.json();

        if (data.data?.paymentStatus === "paid") {
          setPaymentData({
            amount: data.data.amount,
            campaignId: campaignId || data.data.campaignId,
          });
          setStatus("success");
          return;
        } else if (
          data.data?.paymentStatus === "expired" ||
          data.data?.paymentStatus === "failed"
        ) {
          setStatus("error");
          return;
        }

        // Continue polling
        setTimeout(() => checkPayment(attempts + 1), 2000);
      } catch {
        if (attempts >= maxAttempts - 1) {
          setStatus("error");
        } else {
          setTimeout(() => checkPayment(attempts + 1), 2000);
        }
      }
    };

    checkPayment();
  }, [searchParams]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your donation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Issue
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t verify your payment. If you were charged, please
              contact support.
            </p>
            <Button onClick={() => router.push("/browse")} className="w-full">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-6">
            Your donation was successful
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Amount donated</p>
              <p className="text-3xl font-bold text-blue-600">
                ${paymentData.amount}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-gray-600">
              <Heart className="inline h-4 w-4 text-red-500 mr-1" />
              Your generosity helps students achieve their dreams
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {paymentData?.campaignId && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/campaign/${paymentData.campaignId}`)
                  }
                  className="flex-1"
                >
                  View Campaign
                </Button>
              )}
              <Button
                onClick={() => router.push("/browse")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Browse More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <DonateSuccessContent />
    </Suspense>
  );
}
