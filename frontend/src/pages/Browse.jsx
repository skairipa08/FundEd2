import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import CampaignCard from '../components/CampaignCard';
import { getCampaigns, getCategories, getCountries, getFieldsOfStudy } from '../services/api';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 0 });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedField, setSelectedField] = useState('all');

  // Load static data on mount
  useEffect(() => {
    const loadStaticData = async () => {
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
    loadStaticData();
  }, []);

  // Load campaigns when filters change
  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (selectedCountry && selectedCountry !== 'all') params.country = selectedCountry;
        if (selectedField && selectedField !== 'all') params.field_of_study = selectedField;

        const response = await getCampaigns(params);
        setCampaigns(response.data || []);
        setPagination(response.pagination || { total: 0, page: 1, total_pages: 0 });
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, [searchQuery, selectedCategory, selectedCountry, selectedField]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCountry('all');
    setSelectedField('all');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Campaigns</h1>
          <p className="text-lg text-gray-600">Discover and support verified students worldwide</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
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
            <Select value={selectedField} onValueChange={setSelectedField}>
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
            Showing <span className="font-semibold">{campaigns.length}</span> of {pagination.total} campaigns
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
              <CampaignCard key={campaign.campaign_id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No campaigns found matching your criteria.</p>
            <Button className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
