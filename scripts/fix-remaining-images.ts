import { db } from "../server/db";
import { restaurants } from "../shared/schema";
import { ObjectStorageService } from "../server/objectStorage";
import { eq } from "drizzle-orm";

const imagesByType: Record<string, string> = {
  "Mediterranean": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop",
  "Asian": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=600&fit=crop",
  "Italian": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop",
  "Spanish": "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop",
  "Middle Eastern": "https://images.unsplash.com/photo-1547424850-06fdb58c4683?w=800&h=600&fit=crop",
  "Turkish": "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=800&h=600&fit=crop",
  "Moroccan": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&h=600&fit=crop",
  "Indonesian": "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&h=600&fit=crop"
};

const remainingRestaurants = [
  { id: 82, cuisine: "Mediterranean" },
  { id: 83, cuisine: "Asian" },
  { id: 86, cuisine: "Italian" },
  { id: 87, cuisine: "Asian" },
  { id: 95, cuisine: "Mediterranean" },
  { id: 96, cuisine: "Asian" },
  { id: 100, cuisine: "Spanish" },
  { id: 104, cuisine: "Asian" },
  { id: 111, cuisine: "Middle Eastern" },
  { id: 114, cuisine: "Turkish" },
  { id: 118, cuisine: "Moroccan" },
  { id: 126, cuisine: "Indonesian" }
];

async function fixRemainingImages() {
  const objectStorage = new ObjectStorageService();
  
  for (const rest of remainingRestaurants) {
    const imageUrl = imagesByType[rest.cuisine] || imagesByType["Mediterranean"];
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.log(`Failed to download for restaurant ${rest.id}`);
        continue;
      }
      
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      const { uploadUrl, objectPath } = await objectStorage.getSignedUploadUrl(
        `${rest.id}.jpg`,
        contentType
      );
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageBuffer,
        headers: { 'Content-Type': contentType }
      });
      
      if (!uploadResponse.ok) {
        console.log(`Failed to upload for restaurant ${rest.id}`);
        continue;
      }
      
      await db.update(restaurants)
        .set({ imageUrl: objectPath })
        .where(eq(restaurants.id, rest.id));
      
      console.log(`Fixed restaurant ${rest.id} -> ${objectPath}`);
    } catch (error) {
      console.error(`Error fixing restaurant ${rest.id}:`, error);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

fixRemainingImages().catch(console.error);
