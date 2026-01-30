import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Star, Users, Search, Store, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChefProfile {
  id: number;
  chefName: string;
  title: string | null;
  bio: string | null;
  profileImage: string | null;
  coverImage: string | null;
  specialties: string[] | null;
  experienceLevel: string | null;
  followersCount: number;
  isFeatured: boolean;
}

interface Restaurant {
  id: number;
  name: string;
  imageUrl: string | null;
}

export default function ChefsList() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("followers");

  const { data: chefsData = [], isLoading } = useQuery<{ profile: ChefProfile; restaurant: Restaurant | null }[]>({
    queryKey: ["/api/chef-profiles"],
  });

  const filteredChefs = chefsData
    .filter(item => {
      const chef = item.profile;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        chef.chefName.toLowerCase().includes(searchLower) ||
        chef.title?.toLowerCase().includes(searchLower) ||
        chef.specialties?.some(s => s.toLowerCase().includes(searchLower)) ||
        item.restaurant?.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === "followers") {
        return (b.profile.followersCount || 0) - (a.profile.followersCount || 0);
      }
      if (sortBy === "name") {
        return a.profile.chefName.localeCompare(b.profile.chefName);
      }
      return 0;
    });

  const featuredChefs = filteredChefs.filter(c => c.profile.isFeatured);
  const regularChefs = filteredChefs.filter(c => !c.profile.isFeatured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-primary" />
              Our Chefs
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover talented chefs from our partner restaurants
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search chefs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followers">Most Popular</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="h-32 bg-gray-200 animate-pulse" />
                <CardContent className="pt-4">
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredChefs.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No chefs found</h3>
            <p className="text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Check back later for featured chefs"}
            </p>
          </div>
        ) : (
          <>
            {featuredChefs.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Featured Chefs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredChefs.map(item => (
                    <ChefCard key={item.profile.id} chef={item.profile} restaurant={item.restaurant} />
                  ))}
                </div>
              </div>
            )}

            {regularChefs.length > 0 && (
              <div>
                {featuredChefs.length > 0 && (
                  <h2 className="text-xl font-semibold mb-4">All Chefs</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {regularChefs.map(item => (
                    <ChefCard key={item.profile.id} chef={item.profile} restaurant={item.restaurant} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChefCard({ chef, restaurant }: { chef: ChefProfile; restaurant: Restaurant | null }) {
  return (
    <Link href={`/chef/${chef.id}`}>
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        <div className="relative h-32 bg-gradient-to-br from-teal-500 to-emerald-500">
          {chef.coverImage && (
            <img 
              src={chef.coverImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {chef.isFeatured && (
            <Badge className="absolute top-2 right-2 bg-yellow-500">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </Badge>
          )}
        </div>
        <CardContent className="pt-0 -mt-8 relative">
          <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden mb-3 shadow-md">
            {chef.profileImage ? (
              <img src={chef.profileImage} alt={chef.chefName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <ChefHat className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
            {chef.chefName}
          </h3>
          {chef.title && (
            <p className="text-sm text-muted-foreground">{chef.title}</p>
          )}
          {restaurant && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Store className="h-3 w-3" />
              {restaurant.name}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {chef.followersCount || 0} followers
            </span>
            {chef.experienceLevel && (
              <Badge variant="outline" className="text-xs">
                {chef.experienceLevel}
              </Badge>
            )}
          </div>
          {chef.specialties && chef.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {chef.specialties.slice(0, 3).map((specialty, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
