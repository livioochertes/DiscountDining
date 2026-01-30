import fs from 'fs';
import readline from 'readline';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importGeonames() {
  const filePath = '/tmp/cities1000.txt';
  
  console.log('Starting GeoNames import...');
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch: any[] = [];
  let count = 0;
  const BATCH_SIZE = 1000;

  for await (const line of rl) {
    const fields = line.split('\t');
    if (fields.length < 19) continue;

    const city = {
      geonameId: parseInt(fields[0]),
      name: fields[1],
      asciiName: fields[2],
      countryCode: fields[8],
      admin1Code: fields[10] || null,
      population: parseInt(fields[14]) || 0,
      latitude: parseFloat(fields[4]) || null,
      longitude: parseFloat(fields[5]) || null,
      timezone: fields[17] || null
    };

    batch.push(city);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      count += batch.length;
      console.log(`Imported ${count} cities...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    count += batch.length;
  }

  console.log(`Import complete! Total: ${count} cities`);
  await pool.end();
}

async function insertBatch(cities: any[]) {
  const values: any[] = [];
  const placeholders: string[] = [];
  
  cities.forEach((city, index) => {
    const offset = index * 9;
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);
    values.push(
      city.geonameId,
      city.name,
      city.asciiName,
      city.countryCode,
      city.admin1Code,
      city.population,
      city.latitude,
      city.longitude,
      city.timezone
    );
  });

  const query = `
    INSERT INTO geonames_cities (geoname_id, name, ascii_name, country_code, admin1_code, population, latitude, longitude, timezone)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (geoname_id) DO NOTHING
  `;

  await pool.query(query, values);
}

importGeonames().catch(console.error);
