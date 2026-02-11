import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ChefFormProps {
  chef?: any;
  restaurants?: any[];
  fixedRestaurantId?: number;
  showFeatured?: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title?: string;
}

export default function ChefForm({
  chef,
  restaurants,
  fixedRestaurantId,
  showFeatured = false,
  onClose,
  onSave,
  title,
}: ChefFormProps) {
  const [formData, setFormData] = useState({
    restaurantId: chef?.restaurantId || fixedRestaurantId || "",
    chefName: chef?.chefName || "",
    title: chef?.title || "",
    bio: chef?.bio || "",
    profileImage: chef?.profileImage || "",
    coverImage: chef?.coverImage || "",
    specialties: chef?.specialties?.join(", ") || "",
    cuisineExpertise: chef?.cuisineExpertise?.join(", ") || "",
    experienceLevel: chef?.experienceLevel || "professional",
    yearsOfExperience: chef?.yearsOfExperience || 0,
    instagram: chef?.instagram || "",
    youtube: chef?.youtube || "",
    facebook: chef?.facebook || "",
    tiktok: chef?.tiktok || "",
    website: chef?.website || "",
    isPublic: chef?.isPublic !== false,
    isFeatured: chef?.isFeatured || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const restaurantId = fixedRestaurantId || formData.restaurantId;
    if (!restaurantId || !formData.chefName.trim()) {
      return;
    }

    const restaurantIdNum = parseInt(restaurantId as any);
    if (isNaN(restaurantIdNum)) {
      return;
    }

    onSave({
      ...formData,
      restaurantId: restaurantIdNum,
      specialties: formData.specialties.split(",").map((s: string) => s.trim()).filter(Boolean),
      cuisineExpertise: formData.cuisineExpertise.split(",").map((s: string) => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{title || (chef ? "Edit Chef" : "Add New Chef")}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!fixedRestaurantId && restaurants && (
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant *</label>
              <Select
                value={String(formData.restaurantId)}
                onValueChange={(v) => setFormData({...formData, restaurantId: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chef Name *</label>
              <Input
                value={formData.chefName}
                onChange={(e) => setFormData({...formData, chefName: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Head Chef"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image URL</label>
              <Input
                value={formData.profileImage}
                onChange={(e) => setFormData({...formData, profileImage: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cover Image URL</label>
              <Input
                value={formData.coverImage}
                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Specialties (comma-separated)</label>
              <Input
                value={formData.specialties}
                onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                placeholder="Italian, French, Pastry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cuisine Expertise (comma-separated)</label>
              <Input
                value={formData.cuisineExpertise}
                onChange={(e) => setFormData({...formData, cuisineExpertise: e.target.value})}
                placeholder="Mediterranean, Asian"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Experience Level</label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(v) => setFormData({...formData, experienceLevel: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <Input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">YouTube</label>
              <Input
                value={formData.youtube}
                onChange={(e) => setFormData({...formData, youtube: e.target.value})}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TikTok</label>
              <Input
                value={formData.tiktok}
                onChange={(e) => setFormData({...formData, tiktok: e.target.value})}
                placeholder="https://tiktok.com/@..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm">Public Profile</span>
            </label>
            {showFeatured && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Featured Chef</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{chef ? "Update Chef" : "Create Chef"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}