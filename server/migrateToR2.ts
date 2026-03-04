import { db } from "./db";
import { restaurants, menuItems, voucherPackages, eatoffVouchers, chefProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { r2Storage } from "./r2Storage";

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return null;
  }
}

function needsMigration(imageUrl: string | null | undefined, r2PublicUrl: string): boolean {
  if (!imageUrl) return false;
  if (imageUrl.startsWith(r2PublicUrl)) return false;
  if (imageUrl.startsWith("/objects/")) return true;
  if (imageUrl.startsWith("http")) return true;
  return false;
}

function getFullUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${baseUrl}${imageUrl}`;
}

export async function migrateImagesToR2(baseUrl: string): Promise<{
  migrated: number;
  failed: number;
  skipped: number;
  details: string[];
}> {
  if (!r2Storage.isConfigured()) {
    throw new Error("R2 storage is not configured");
  }

  const r2PublicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  const details: string[] = [];
  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  const allRestaurants = await db
    .select({ id: restaurants.id, imageUrl: restaurants.imageUrl, name: restaurants.name })
    .from(restaurants);

  for (const r of allRestaurants) {
    if (!needsMigration(r.imageUrl, r2PublicUrl)) {
      skipped++;
      continue;
    }

    const fetchUrl = getFullUrl(r.imageUrl!, baseUrl);
    details.push(`[restaurant ${r.id}] Fetching ${fetchUrl}`);
    const data = await fetchImageBuffer(fetchUrl);

    if (!data) {
      failed++;
      details.push(`[restaurant ${r.id}] FAILED to fetch image`);
      continue;
    }

    try {
      const ext = r.imageUrl!.split(".").pop()?.split("?")[0] || "jpg";
      const { publicUrl } = await r2Storage.uploadBuffer(data.buffer, `restaurant-${r.id}.${ext}`, data.contentType, "restaurants");
      await db.update(restaurants).set({ imageUrl: publicUrl }).where(eq(restaurants.id, r.id));
      migrated++;
      details.push(`[restaurant ${r.id}] OK → ${publicUrl}`);
    } catch (err: any) {
      failed++;
      details.push(`[restaurant ${r.id}] FAILED to upload: ${err.message}`);
    }
  }

  const allMenuItems = await db
    .select({ id: menuItems.id, imageUrl: menuItems.imageUrl, name: menuItems.name })
    .from(menuItems);

  for (const mi of allMenuItems) {
    if (!needsMigration(mi.imageUrl, r2PublicUrl)) {
      skipped++;
      continue;
    }

    const fetchUrl = getFullUrl(mi.imageUrl!, baseUrl);
    details.push(`[menuItem ${mi.id}] Fetching ${fetchUrl}`);
    const data = await fetchImageBuffer(fetchUrl);

    if (!data) {
      failed++;
      details.push(`[menuItem ${mi.id}] FAILED to fetch image`);
      continue;
    }

    try {
      const ext = mi.imageUrl!.split(".").pop()?.split("?")[0] || "jpg";
      const { publicUrl } = await r2Storage.uploadBuffer(data.buffer, `menu-item-${mi.id}.${ext}`, data.contentType, "menu-items");
      await db.update(menuItems).set({ imageUrl: publicUrl }).where(eq(menuItems.id, mi.id));
      migrated++;
      details.push(`[menuItem ${mi.id}] OK → ${publicUrl}`);
    } catch (err: any) {
      failed++;
      details.push(`[menuItem ${mi.id}] FAILED to upload: ${err.message}`);
    }
  }

  const allVouchers = await db
    .select({ id: voucherPackages.id, imageUrl: voucherPackages.imageUrl, name: voucherPackages.name })
    .from(voucherPackages);

  for (const v of allVouchers) {
    if (!needsMigration(v.imageUrl, r2PublicUrl)) {
      skipped++;
      continue;
    }

    const fetchUrl = getFullUrl(v.imageUrl!, baseUrl);
    details.push(`[voucher ${v.id}] Fetching ${fetchUrl}`);
    const data = await fetchImageBuffer(fetchUrl);

    if (!data) {
      failed++;
      details.push(`[voucher ${v.id}] FAILED to fetch image`);
      continue;
    }

    try {
      const ext = v.imageUrl!.split(".").pop()?.split("?")[0] || "jpg";
      const { publicUrl } = await r2Storage.uploadBuffer(data.buffer, `voucher-${v.id}.${ext}`, data.contentType, "vouchers");
      await db.update(voucherPackages).set({ imageUrl: publicUrl }).where(eq(voucherPackages.id, v.id));
      migrated++;
      details.push(`[voucher ${v.id}] OK → ${publicUrl}`);
    } catch (err: any) {
      failed++;
      details.push(`[voucher ${v.id}] FAILED to upload: ${err.message}`);
    }
  }

  const allEatoffVouchers = await db
    .select({ id: eatoffVouchers.id, imageUrl: eatoffVouchers.imageUrl, name: eatoffVouchers.name })
    .from(eatoffVouchers);

  for (const ev of allEatoffVouchers) {
    if (!needsMigration(ev.imageUrl, r2PublicUrl)) {
      skipped++;
      continue;
    }

    const fetchUrl = getFullUrl(ev.imageUrl!, baseUrl);
    details.push(`[eatoffVoucher ${ev.id}] Fetching ${fetchUrl}`);
    const data = await fetchImageBuffer(fetchUrl);

    if (!data) {
      failed++;
      details.push(`[eatoffVoucher ${ev.id}] FAILED to fetch image`);
      continue;
    }

    try {
      const ext = ev.imageUrl!.split(".").pop()?.split("?")[0] || "jpg";
      const { publicUrl } = await r2Storage.uploadBuffer(data.buffer, `eatoff-voucher-${ev.id}.${ext}`, data.contentType, "vouchers");
      await db.update(eatoffVouchers).set({ imageUrl: publicUrl }).where(eq(eatoffVouchers.id, ev.id));
      migrated++;
      details.push(`[eatoffVoucher ${ev.id}] OK → ${publicUrl}`);
    } catch (err: any) {
      failed++;
      details.push(`[eatoffVoucher ${ev.id}] FAILED to upload: ${err.message}`);
    }
  }

  const allChefs = await db
    .select({ id: chefProfiles.id, profileImage: chefProfiles.profileImage, name: chefProfiles.name })
    .from(chefProfiles);

  for (const chef of allChefs) {
    if (!needsMigration(chef.profileImage, r2PublicUrl)) {
      skipped++;
      continue;
    }

    const fetchUrl = getFullUrl(chef.profileImage!, baseUrl);
    details.push(`[chef ${chef.id}] Fetching ${fetchUrl}`);
    const data = await fetchImageBuffer(fetchUrl);

    if (!data) {
      failed++;
      details.push(`[chef ${chef.id}] FAILED to fetch image`);
      continue;
    }

    try {
      const ext = chef.profileImage!.split(".").pop()?.split("?")[0] || "jpg";
      const { publicUrl } = await r2Storage.uploadBuffer(data.buffer, `chef-${chef.id}.${ext}`, data.contentType, "chefs");
      await db.update(chefProfiles).set({ profileImage: publicUrl }).where(eq(chefProfiles.id, chef.id));
      migrated++;
      details.push(`[chef ${chef.id}] OK → ${publicUrl}`);
    } catch (err: any) {
      failed++;
      details.push(`[chef ${chef.id}] FAILED to upload: ${err.message}`);
    }
  }

  return { migrated, failed, skipped, details };
}
