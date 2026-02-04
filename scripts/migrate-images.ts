import { db } from "../server/db";
import { restaurants } from "../shared/schema";
import { ObjectStorageService } from "../server/objectStorage";
import { eq } from "drizzle-orm";

async function migrateImages() {
  const allRestaurants = await db.select().from(restaurants);
  const objectStorage = new ObjectStorageService();
  
  console.log(`Found ${allRestaurants.length} restaurants to migrate`);
  
  for (const restaurant of allRestaurants) {
    if (!restaurant.imageUrl || restaurant.imageUrl.startsWith('/objects/')) {
      console.log(`Skipping ${restaurant.name} - already migrated or no image`);
      continue;
    }
    
    try {
      // Download image from Unsplash
      const response = await fetch(restaurant.imageUrl);
      if (!response.ok) {
        console.log(`Failed to download image for ${restaurant.name}`);
        continue;
      }
      
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      
      // Get signed upload URL
      const { uploadUrl, objectPath } = await objectStorage.getSignedUploadUrl(
        `${restaurant.id}.${ext}`,
        contentType
      );
      
      // Upload to Object Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: imageBuffer,
        headers: { 'Content-Type': contentType }
      });
      
      if (!uploadResponse.ok) {
        console.log(`Failed to upload image for ${restaurant.name}`);
        continue;
      }
      
      // Update database
      await db.update(restaurants)
        .set({ imageUrl: objectPath })
        .where(eq(restaurants.id, restaurant.id));
      
      console.log(`Migrated ${restaurant.name} -> ${objectPath}`);
    } catch (error) {
      console.error(`Error migrating ${restaurant.name}:`, error);
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrateImages().catch(console.error);
