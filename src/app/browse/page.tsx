"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignCard } from "@/components/campaign-card";

interface Category {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  title: string;
  story: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  student?: {
    id: string;
    name: string;
    image?: string;
    country?: string;
    fieldOfStudy?: string;
    verificationStatus?: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    country: searchParams.get("country") || "all",
    fieldOfStudy: searchParams.get("fieldOfStudy") || "all",
  });

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [catRes, countryRes, fieldsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/countries"),
          fetch("/api/fields-of-study"),
        ]);

        const catData = await catRes.json();
        const countryData = await countryRes.json();
        const fieldsData = await fieldsRes.json();

        setCategories(catData.data || []);
        setCountries(countryData.data || []);
        setFieldsOfStudy(fieldsData.data || []);
      } catch (error) {
        console.error("Failed to load static data:", error);
      }
    };
    loadStaticData();
  }, []);

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.category !== "all")
          params.append("category", filters.category);
        if (filters.country !== "all")
          params.append("country", filters.country);
        if (filters.fieldOfStudy !== "all")
          params.append("fieldOfStudy", filters.fieldOfStudy);
        params.append("page", pagination.page.toString());
        params.append("limit", pagination.limit.toString());

        const res = await fetch(`/api/campaigns?${params}`);
        const data = await res.json();

        setCampaigns(data.data || []);
        setPagination(data.pagination || pagination);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      country: "all",
      fieldOfStudy: "all",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Browse Campaigns
          </h1>
          <p className="text-lg text-gray-600">
            Find and support verified students worldwide
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filter Campaigns</span>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </form>

            {/* Category */}
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country */}
            <Select
              value={filters.country}
              onValueChange={(value) => handleFilterChange("country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Field of Study */}
            <Select
              value={filters.fieldOfStudy}
              onValueChange={(value) =>
                handleFilterChange("fieldOfStudy", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Field of Study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                {fieldsOfStudy.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{campaigns.length}</span> of{" "}
            {pagination.total} campaigns
          </p>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">
              No campaigns found matching your criteria.
            </p>
            <Button className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
