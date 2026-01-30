import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChefHat, Star, Users, BookOpen, Edit, Save, X, 
  Instagram, Youtube, Globe, Heart, Award, Clock,
  Plus, Trash2, MapPin, ArrowLeft
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChefProfile {
  id: number;
  customerId: number;
  chefName: string;
  bio: string | null;
  profileImage: string | null;
  coverImage: string | null;
  specialties: string[];
  cuisineExpertise: string[];
  cookingStyles: string[];
  experienceLevel: string;
  yearsOfExperience: number;
  certifications: string[];
  website: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  favoriteRecipeIds: number[];
  followersCount: number;
  followingCount: number;
  recipesCount: number;
  totalLikesReceived: number;
  isPublic: boolean;
  acceptsCollaborations: boolean;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  cookingTime: number | null;
  difficulty: string;
  servings: number | null;
  likesCount: number;
}

const cuisineOptions = [
  "Italian", "French", "Asian", "Mediterranean", "Mexican", 
  "Indian", "Japanese", "Chinese", "Romanian", "American"
];

const specialtyOptions = [
  "Pasta", "Baking", "Grilling", "Sauces", "Desserts",
  "Soups", "Salads", "Seafood", "Vegetarian", "Vegan"
];

const experienceLevels = [
  { value: "beginner", label: "Beginner Cook" },
  { value: "intermediate", label: "Home Chef" },
  { value: "advanced", label: "Advanced Chef" },
  { value: "professional", label: "Professional Chef" }
];

export default function ChefProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ChefProfile>>({});
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCuisine, setNewCuisine] = useState("");

  const isOwnProfile = id === "me" || (!id && isAuthenticated);
  const profileId = isOwnProfile ? "me" : id;

  const { data: profileData, isLoading, error } = useQuery<{
    profile?: ChefProfile;
    customer?: { id: number; name: string; email: string; profilePicture: string | null };
    recipes?: Recipe[];
    isFollowing?: boolean;
  } | ChefProfile>({
    queryKey: isOwnProfile ? ["/api/my-chef-profile"] : ["/api/chef-profiles", id],
    enabled: !!profileId,
  });

  const profile = (profileData && 'profile' in profileData ? profileData.profile : profileData) as ChefProfile | undefined;
  const customer = profileData && 'customer' in profileData ? profileData.customer : undefined;
  const recipes = (profileData && 'recipes' in profileData ? profileData.recipes : []) || [];
  const isFollowing = (profileData && 'isFollowing' in profileData ? profileData.isFollowing : false) || false;

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ChefProfile>) => {
      return apiRequest("POST", "/api/chef-profiles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-chef-profile"] });
      setIsEditing(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ChefProfile>) => {
      return apiRequest("PUT", `/api/chef-profiles/${profile?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-chef-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chef-profiles", id] });
      setIsEditing(false);
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(isFollowing ? "DELETE" : "POST", `/api/chef-profiles/${profile?.id}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chef-profiles", id] });
    },
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        chefName: profile.chefName,
        bio: profile.bio,
        specialties: profile.specialties || [],
        cuisineExpertise: profile.cuisineExpertise || [],
        cookingStyles: profile.cookingStyles || [],
        experienceLevel: profile.experienceLevel,
        yearsOfExperience: profile.yearsOfExperience,
        certifications: profile.certifications || [],
        website: profile.website,
        instagram: profile.instagram,
        youtube: profile.youtube,
        isPublic: profile.isPublic,
        acceptsCollaborations: profile.acceptsCollaborations,
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (profile) {
      updateMutation.mutate(editData);
    } else {
      createMutation.mutate({
        chefName: editData.chefName || user?.name || "Chef",
        ...editData,
      });
    }
  };

  const addSpecialty = () => {
    if (newSpecialty && !editData.specialties?.includes(newSpecialty)) {
      setEditData({
        ...editData,
        specialties: [...(editData.specialties || []), newSpecialty],
      });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string): void => {
    setEditData({
      ...editData,
      specialties: editData.specialties?.filter(s => s !== specialty) || [],
    });
  };

  const addCuisine = () => {
    if (newCuisine && !editData.cuisineExpertise?.includes(newCuisine)) {
      setEditData({
        ...editData,
        cuisineExpertise: [...(editData.cuisineExpertise || []), newCuisine],
      });
      setNewCuisine("");
    }
  };

  const removeCuisine = (cuisine: string): void => {
    setEditData({
      ...editData,
      cuisineExpertise: editData.cuisineExpertise?.filter(c => c !== cuisine) || [],
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!isOwnProfile && error) {
    return (
      <div className="min-h-screen p-4">
        <Card className="max-w-md mx-auto mt-10">
          <CardContent className="pt-6 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Chef profile not found</p>
            <Link href="/recipes">
              <Button className="mt-4">Browse Recipes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwnProfile && !profile && !isEditing) {
    return (
      <div className="min-h-screen p-4">
        <Card className="max-w-md mx-auto mt-10">
          <CardContent className="pt-6 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-teal-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Create Your Chef Profile</h2>
            <p className="text-gray-600 mb-4">
              Share your culinary journey, showcase your expertise, and connect with other food lovers.
            </p>
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayProfile: ChefProfile = profile || {
    id: 0,
    customerId: 0,
    chefName: user?.name || "Chef",
    bio: null,
    profileImage: null,
    coverImage: null,
    specialties: [],
    cuisineExpertise: [],
    cookingStyles: [],
    experienceLevel: "beginner",
    yearsOfExperience: 0,
    certifications: [],
    website: null,
    instagram: null,
    youtube: null,
    tiktok: null,
    favoriteRecipeIds: [],
    followersCount: 0,
    followingCount: 0,
    recipesCount: 0,
    totalLikesReceived: 0,
    isPublic: true,
    acceptsCollaborations: false,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-teal-500 to-emerald-600" />
        
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setLocation("/recipes")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-6">
            <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
              {displayProfile.profileImage || customer?.profilePicture ? (
                <img 
                  src={displayProfile.profileImage || customer?.profilePicture || undefined} 
                  alt={displayProfile.chefName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center">
                  <ChefHat className="h-12 w-12 text-teal-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editData.chefName || ""}
                    onChange={(e) => setEditData({ ...editData, chefName: e.target.value })}
                    className="text-2xl font-bold max-w-xs"
                    placeholder="Chef Name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{displayProfile.chefName}</h1>
                )}
                {displayProfile.experienceLevel === "professional" && (
                  <Badge className="bg-amber-500">
                    <Award className="h-3 w-3 mr-1" /> Pro
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {displayProfile.followersCount || 0} followers
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {displayProfile.recipesCount || recipes.length} recipes
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {displayProfile.totalLikesReceived || 0} likes
                </span>
              </div>
            </div>

            <div className="pb-2">
              {isOwnProfile ? (
                isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave}
                      disabled={updateMutation.isPending || createMutation.isPending}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )
              ) : isAuthenticated && (
                <Button 
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  variant={isFollowing ? "outline" : "default"}
                  className={!isFollowing ? "bg-teal-600 hover:bg-teal-700" : ""}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="about" className="space-y-4">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="recipes">Recipes</TabsTrigger>
              <TabsTrigger value="expertise">Expertise</TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Bio</h3>
                    {isEditing ? (
                      <Textarea
                        value={editData.bio || ""}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Tell others about your culinary journey..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-600">
                        {displayProfile.bio || "No bio yet."}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    {isEditing ? (
                      <div className="flex gap-4">
                        <select
                          value={editData.experienceLevel || "beginner"}
                          onChange={(e) => setEditData({ ...editData, experienceLevel: e.target.value })}
                          className="border rounded-lg p-2"
                        >
                          {experienceLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editData.yearsOfExperience || 0}
                            onChange={(e) => setEditData({ ...editData, yearsOfExperience: parseInt(e.target.value) })}
                            className="w-20"
                            min={0}
                          />
                          <span className="text-gray-600">years</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        {experienceLevels.find(l => l.value === displayProfile.experienceLevel)?.label || "Beginner Cook"}
                        {displayProfile.yearsOfExperience > 0 && ` • ${displayProfile.yearsOfExperience} years`}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Social Links</h3>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <Input
                            value={editData.website || ""}
                            onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                            placeholder="Website URL"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          <Input
                            value={editData.instagram || ""}
                            onChange={(e) => setEditData({ ...editData, instagram: e.target.value })}
                            placeholder="Instagram username"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-600" />
                          <Input
                            value={editData.youtube || ""}
                            onChange={(e) => setEditData({ ...editData, youtube: e.target.value })}
                            placeholder="YouTube channel"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        {displayProfile.website && (
                          <a href={displayProfile.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline flex items-center gap-1">
                            <Globe className="h-4 w-4" /> Website
                          </a>
                        )}
                        {displayProfile.instagram && (
                          <a href={`https://instagram.com/${displayProfile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1">
                            <Instagram className="h-4 w-4" /> Instagram
                          </a>
                        )}
                        {displayProfile.youtube && (
                          <a href={displayProfile.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center gap-1">
                            <Youtube className="h-4 w-4" /> YouTube
                          </a>
                        )}
                        {!displayProfile.website && !displayProfile.instagram && !displayProfile.youtube && (
                          <p className="text-gray-500">No social links added.</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipes">
              <Card>
                <CardContent className="pt-6">
                  {recipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipes.map((recipe: Recipe) => (
                        <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                          <div className="flex gap-4 p-4 rounded-lg border hover:border-teal-300 transition cursor-pointer">
                            {recipe.imageUrl ? (
                              <img 
                                src={recipe.imageUrl} 
                                alt={recipe.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{recipe.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {recipe.cookingTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {recipe.cookingTime} min
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {recipe.likesCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No recipes shared yet.</p>
                      {isOwnProfile && (
                        <Link href="/recipes/new">
                          <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4 mr-2" /> Share a Recipe
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expertise">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {(isEditing ? editData.specialties : displayProfile.specialties)?.map((specialty: string) => (
                        <Badge key={specialty} variant="secondary" className="text-sm">
                          {specialty}
                          {isEditing && (
                            <button onClick={() => removeSpecialty(specialty)} className="ml-1">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <select
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Add specialty...</option>
                            {specialtyOptions.filter(s => !editData.specialties?.includes(s)).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {newSpecialty && (
                            <Button size="sm" onClick={addSpecialty} variant="outline">
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      {!displayProfile.specialties?.length && !isEditing && (
                        <p className="text-gray-500 text-sm">No specialties added yet.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Cuisine Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {(isEditing ? editData.cuisineExpertise : displayProfile.cuisineExpertise)?.map((cuisine: string) => (
                        <Badge key={cuisine} variant="outline" className="text-sm">
                          {cuisine}
                          {isEditing && (
                            <button onClick={() => removeCuisine(cuisine)} className="ml-1">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <select
                            value={newCuisine}
                            onChange={(e) => setNewCuisine(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Add cuisine...</option>
                            {cuisineOptions.filter(c => !editData.cuisineExpertise?.includes(c)).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          {newCuisine && (
                            <Button size="sm" onClick={addCuisine} variant="outline">
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      {!displayProfile.cuisineExpertise?.length && !isEditing && (
                        <p className="text-gray-500 text-sm">No cuisines added yet.</p>
                      )}
                    </div>
                  </div>

                  {(displayProfile.certifications?.length > 0 || isEditing) && (
                    <div>
                      <h3 className="font-semibold mb-3">Certifications</h3>
                      <div className="space-y-2">
                        {(displayProfile.certifications || []).map((cert: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-500" />
                            <span>{cert}</span>
                          </div>
                        ))}
                        {!displayProfile.certifications?.length && !isEditing && (
                          <p className="text-gray-500 text-sm">No certifications added yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
