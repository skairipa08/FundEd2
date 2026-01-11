import Link from "next/link";
import { GraduationCap, Heart, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">FundEd</span>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering students worldwide through verified educational
              crowdfunding.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/browse" className="hover:text-white transition-colors">
                  Browse Campaigns
                </Link>
              </li>
              <li>
                <Link href="/create-campaign" className="hover:text-white transition-colors">
                  Start a Campaign
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  How It Works
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  FAQs
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Contact Us
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Trust & Safety</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Verified Students</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Secure Donations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} FundEd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
