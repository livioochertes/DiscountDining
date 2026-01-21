import { db } from "./db";
import { restaurants, voucherPackages, customers, menuItems, purchasedVouchers, tableReservations } from "@shared/schema";
import { hashPassword } from "./auth";

async function seedDatabase() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(tableReservations);
  await db.delete(purchasedVouchers);
  await db.delete(menuItems);
  await db.delete(voucherPackages);
  await db.delete(restaurants);
  await db.delete(customers);

  // Create demo customer account
  const hashedDemoPassword = await hashPassword('DemoPassword123!');
  const demoCustomer = await db.insert(customers).values({
    name: 'Demo User',
    email: 'demo@example.com',
    phone: '+1234567890',
    passwordHash: hashedDemoPassword,
    balance: 250.00,
    membershipTier: 'Gold',
    loyaltyPoints: 1250,
    dietaryPreferences: ['vegetarian'],
    allergies: [],
    dislikes: [],
    healthConditions: []
  }).returning();
  
  console.log(`Created demo customer: ${demoCustomer[0].email}`);

  // Seed restaurants
  const restaurantData = [
    {
      name: "Bella Vista",
      description: "Authentic Italian cuisine with fresh ingredients and traditional recipes",
      address: "Via Roma 123, Milan",
      location: "Milan",
      cuisine: "Italian",
      priceRange: "€€€",
      phone: "+39 02 1234567",
      email: "info@bellavista.it",
      website: "https://bellavista.it",
      imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Sakura Sushi",
      description: "Premium Japanese sushi experience with the freshest fish",
      address: "Sushi Street 45, Tokyo District",
      location: "Tokyo",
      cuisine: "Japanese",
      priceRange: "€€€€",
      phone: "+81 3 9876543",
      email: "hello@sakurasushi.jp",
      website: "https://sakurasushi.jp",
      imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
      rating: "4.8",
      isActive: true
    },
    {
      name: "Le Petit Bistro",
      description: "Classic French bistro serving traditional dishes with a modern twist",
      address: "Rue de la Paix 78, Paris",
      location: "Paris",
      cuisine: "French",
      priceRange: "€€",
      phone: "+33 1 45678901",
      email: "contact@lepetitbistro.fr",
      website: "https://lepetitbistro.fr",
      imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Mediterranean Breeze",
      description: "Fresh and healthy Mediterranean cuisine with organic ingredients",
      address: "Costa del Sol 234, Barcelona",
      location: "Barcelona",
      cuisine: "Mediterranean",
      priceRange: "€€€",
      phone: "+34 93 2345678",
      email: "info@medbreeze.es",
      website: "https://mediterraneanbreeze.es",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.6",
      isActive: true
    },
    // Additional 46 restaurants to reach 50 total
    {
      name: "Dragon Palace",
      description: "Authentic Chinese cuisine with traditional recipes",
      address: "Chinatown Street 45, Downtown",
      location: "Downtown",
      cuisine: "Asian",
      priceRange: "€€",
      phone: "+1 555 0101",
      email: "info@dragonpalace.com",
      website: "https://dragonpalace.com",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d51a",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Taco Fiesta",
      description: "Vibrant Mexican street food and margaritas",
      address: "Mission District 789, City Center",
      location: "City Center",
      cuisine: "Mexican",
      priceRange: "€",
      phone: "+1 555 0102",
      email: "hola@tacofiesta.com",
      website: "https://tacofiesta.com",
      imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      rating: "4.2",
      isActive: true
    },
    {
      name: "Curry House",
      description: "Spicy Indian curries and fresh naan bread",
      address: "Little India 567, Suburbs",
      location: "Suburbs",
      cuisine: "Indian",
      priceRange: "€€",
      phone: "+1 555 0103",
      email: "contact@curryhouse.com",
      website: "https://curryhouse.com",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
      rating: "4.7",
      isActive: true
    },
    {
      name: "Pizza Corner",
      description: "Wood-fired pizzas with fresh toppings",
      address: "Main Street 123, Downtown",
      location: "Downtown",
      cuisine: "Italian",
      priceRange: "€",
      phone: "+1 555 0104",
      email: "orders@pizzacorner.com",
      website: "https://pizzacorner.com",
      imageUrl: "https://images.unsplash.com/photo-1565299585323-38174c8617c1",
      rating: "4.1",
      isActive: true
    },
    {
      name: "Sushi Zen",
      description: "Minimalist sushi bar with premium fish",
      address: "Zen Garden 234, City Center",
      location: "City Center",
      cuisine: "Asian",
      priceRange: "€€€",
      phone: "+1 555 0105",
      email: "reservations@sushizen.com",
      website: "https://sushizen.com",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d51a",
      rating: "4.9",
      isActive: true
    },
    {
      name: "Burger Station",
      description: "Gourmet burgers and craft beer selection",
      address: "Brewery Lane 345, Suburbs",
      location: "Suburbs",
      cuisine: "American",
      priceRange: "€€",
      phone: "+1 555 0106",
      email: "info@burgerstation.com",
      website: "https://burgerstation.com",
      imageUrl: "https://images.unsplash.com/photo-1561758033-d89a9ad46330",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Green Garden",
      description: "Organic vegetarian and vegan options",
      address: "Organic Plaza 456, City Center",
      location: "City Center",
      cuisine: "Vegetarian",
      priceRange: "€€",
      phone: "+1 555 0107",
      email: "hello@greengarden.com",
      website: "https://greengarden.com",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Ocean Catch",
      description: "Fresh seafood straight from the harbor",
      address: "Harbor View 567, Downtown",
      location: "Downtown",
      cuisine: "Seafood",
      priceRange: "€€€",
      phone: "+1 555 0108",
      email: "catch@oceancatch.com",
      website: "https://oceancatch.com",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      rating: "4.6",
      isActive: true
    },
    {
      name: "Steakhouse Prime",
      description: "Premium steaks and fine wine selection",
      address: "Luxury Avenue 678, City Center",
      location: "City Center",
      cuisine: "Steakhouse",
      priceRange: "€€€",
      phone: "+1 555 0109",
      email: "reservations@steakhouseprime.com",
      website: "https://steakhouseprime.com",
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462",
      rating: "4.8",
      isActive: true
    },
    {
      name: "Noodle Express",
      description: "Quick and delicious Asian noodle bowls",
      address: "Food Court 789, Suburbs",
      location: "Suburbs",
      cuisine: "Asian",
      priceRange: "€",
      phone: "+1 555 0110",
      email: "orders@noodleexpress.com",
      website: "https://noodleexpress.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.0",
      isActive: true
    },
    // Continue adding more restaurants to reach 50 total
    {
      name: "BBQ Masters",
      description: "Smoky barbecue ribs and pulled pork",
      address: "Smokehouse Road 111, Downtown",
      location: "Downtown",
      cuisine: "American",
      priceRange: "€€",
      phone: "+1 555 0111",
      email: "grill@bbqmasters.com",
      website: "https://bbqmasters.com",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Pasta Paradise",
      description: "Homemade pasta with traditional Italian sauces",
      address: "Little Italy 222, City Center",
      location: "City Center",
      cuisine: "Italian",
      priceRange: "€€",
      phone: "+1 555 0112",
      email: "ciao@pastaparadise.com",
      website: "https://pastaparadise.com",
      imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Greek Corner",
      description: "Traditional Greek dishes and fresh ingredients",
      address: "Olive Street 333, Suburbs",
      location: "Suburbs",
      cuisine: "Mediterranean",
      priceRange: "€€",
      phone: "+1 555 0113",
      email: "yamas@greekcorner.com",
      website: "https://greekcorner.com",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Thai Spice",
      description: "Authentic Thai cuisine with adjustable spice levels",
      address: "Bangkok Boulevard 444, Downtown",
      location: "Downtown",
      cuisine: "Asian",
      priceRange: "€€",
      phone: "+1 555 0114",
      email: "hello@thaispice.com",
      website: "https://thaispice.com",
      imageUrl: "https://images.unsplash.com/photo-1569058242779-54d6c8bdd3bb",
      rating: "4.6",
      isActive: true
    },
    {
      name: "Fish & Chips Co.",
      description: "Classic British fish and chips",
      address: "Pub Lane 555, City Center",
      location: "City Center",
      cuisine: "British",
      priceRange: "€",
      phone: "+1 555 0115",
      email: "order@fishandchipsco.com",
      website: "https://fishandchipsco.com",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      rating: "4.1",
      isActive: true
    },
    {
      name: "Ramen Station",
      description: "Authentic Japanese ramen with rich broths",
      address: "Tokyo Street 666, Suburbs",
      location: "Suburbs",
      cuisine: "Asian",
      priceRange: "€€",
      phone: "+1 555 0116",
      email: "slurp@ramenstation.com",
      website: "https://ramenstation.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.7",
      isActive: true
    },
    {
      name: "Cafe Bonjour",
      description: "French cafe with pastries and coffee",
      address: "Croissant Street 777, Downtown",
      location: "Downtown",
      cuisine: "French",
      priceRange: "€",
      phone: "+1 555 0117",
      email: "cafe@bonjour.com",
      website: "https://cafebonjour.com",
      imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      rating: "4.2",
      isActive: true
    },
    {
      name: "Tapas Bar",
      description: "Spanish small plates and sangria",
      address: "Barcelona Square 888, City Center",
      location: "City Center",
      cuisine: "Spanish",
      priceRange: "€€",
      phone: "+1 555 0118",
      email: "hola@tapasbar.com",
      website: "https://tapasbar.com",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Wing Stop",
      description: "Buffalo wings with variety of sauces",
      address: "Sports Complex 999, Suburbs",
      location: "Suburbs",
      cuisine: "American",
      priceRange: "€",
      phone: "+1 555 0119",
      email: "wings@wingstop.com",
      website: "https://wingstop.com",
      imageUrl: "https://images.unsplash.com/photo-1561758033-d89a9ad46330",
      rating: "4.0",
      isActive: true
    },
    {
      name: "Healthy Bowl",
      description: "Fresh salads and protein bowls",
      address: "Fitness Avenue 1010, City Center",
      location: "City Center",
      cuisine: "Healthy",
      priceRange: "€€",
      phone: "+1 555 0120",
      email: "fresh@healthybowl.com",
      website: "https://healthybowl.com",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      rating: "4.5",
      isActive: true
    },
    // Add remaining restaurants to reach 50 total
    {
      name: "Coffee Roasters",
      description: "Artisan coffee and light breakfast",
      address: "Bean Street 1111, Downtown",
      location: "Downtown",
      cuisine: "Coffee",
      priceRange: "€",
      phone: "+1 555 0121",
      email: "brew@coffeeroasters.com",
      website: "https://coffeeroasters.com",
      imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Mongolian Grill",
      description: "Interactive stir-fry with fresh ingredients",
      address: "Khan Avenue 1212, Suburbs",
      location: "Suburbs",
      cuisine: "Asian",
      priceRange: "€€",
      phone: "+1 555 0122",
      email: "grill@mongolian.com",
      website: "https://mongoliangrill.com",
      imageUrl: "https://images.unsplash.com/photo-1569058242779-54d6c8bdd3bb",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Crepe House",
      description: "Sweet and savory French crepes",
      address: "Brittany Lane 1313, City Center",
      location: "City Center",
      cuisine: "French",
      priceRange: "€",
      phone: "+1 555 0123",
      email: "crepes@crepehouse.com",
      website: "https://crepehouse.com",
      imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      rating: "4.2",
      isActive: true
    },
    {
      name: "Brazilian Grill",
      description: "Authentic churrasco and grilled meats",
      address: "Rio Street 1414, Downtown",
      location: "Downtown",
      cuisine: "Brazilian",
      priceRange: "€€€",
      phone: "+1 555 0124",
      email: "churrasco@braziliangrill.com",
      website: "https://braziliangrill.com",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947",
      rating: "4.7",
      isActive: true
    },
    {
      name: "Poke Bowl",
      description: "Fresh Hawaiian-style poke bowls",
      address: "Aloha Beach 1515, City Center",
      location: "City Center",
      cuisine: "Hawaiian",
      priceRange: "€€",
      phone: "+1 555 0125",
      email: "aloha@pokebowl.com",
      website: "https://pokebowl.com",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      rating: "4.6",
      isActive: true
    },
    {
      name: "German Brewery",
      description: "Traditional German food and craft beer",
      address: "Oktoberfest Square 1616, Suburbs",
      location: "Suburbs",
      cuisine: "German",
      priceRange: "€€",
      phone: "+1 555 0126",
      email: "prost@germanbrewery.com",
      website: "https://germanbrewery.com",
      imageUrl: "https://images.unsplash.com/photo-1561758033-d89a9ad46330",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Vegan Kitchen",
      description: "Plant-based cuisine and sustainable dining",
      address: "Green Plaza 1717, City Center",
      location: "City Center",
      cuisine: "Vegan",
      priceRange: "€€",
      phone: "+1 555 0127",
      email: "plants@vegankitchen.com",
      website: "https://vegankitchen.com",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Korean BBQ",
      description: "All-you-can-eat Korean barbecue",
      address: "Seoul Street 1818, Downtown",
      location: "Downtown",
      cuisine: "Korean",
      priceRange: "€€€",
      phone: "+1 555 0128",
      email: "gogi@koreanbbq.com",
      website: "https://koreanbbq.com",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947",
      rating: "4.8",
      isActive: true
    },
    {
      name: "Lebanese Mezze",
      description: "Middle Eastern small plates and kebabs",
      address: "Damascus Road 1919, Suburbs",
      location: "Suburbs",
      cuisine: "Middle Eastern",
      priceRange: "€€",
      phone: "+1 555 0129",
      email: "mezze@lebanese.com",
      website: "https://lebanese.com",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.6",
      isActive: true
    },
    {
      name: "Argentinian Steakhouse",
      description: "Premium beef cuts and Malbec wine",
      address: "Buenos Aires Avenue 2020, City Center",
      location: "City Center",
      cuisine: "Argentinian",
      priceRange: "€€€",
      phone: "+1 555 0130",
      email: "asado@argentinian.com",
      website: "https://argentinian.com",
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462",
      rating: "4.9",
      isActive: true
    },
    {
      name: "Ethiopian Flavors",
      description: "Traditional Ethiopian cuisine and injera bread",
      address: "Addis Street 2121, Downtown",
      location: "Downtown",
      cuisine: "Ethiopian",
      priceRange: "€€",
      phone: "+1 555 0131",
      email: "injera@ethiopian.com",
      website: "https://ethiopian.com",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Turkish Delight",
      description: "Ottoman cuisine and traditional sweets",
      address: "Istanbul Boulevard 2222, Suburbs",
      location: "Suburbs",
      cuisine: "Turkish",
      priceRange: "€€",
      phone: "+1 555 0132",
      email: "sultan@turkish.com",
      website: "https://turkish.com",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Cajun Kitchen",
      description: "Spicy Louisiana-style cooking",
      address: "Bourbon Street 2323, City Center",
      location: "City Center",
      cuisine: "Cajun",
      priceRange: "€€",
      phone: "+1 555 0133",
      email: "spicy@cajun.com",
      website: "https://cajun.com",
      imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Peruvian Ceviche",
      description: "Fresh seafood and Peruvian specialties",
      address: "Lima Lane 2424, Downtown",
      location: "Downtown",
      cuisine: "Peruvian",
      priceRange: "€€€",
      phone: "+1 555 0134",
      email: "ceviche@peruvian.com",
      website: "https://peruvian.com",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      rating: "4.7",
      isActive: true
    },
    {
      name: "Russian Borscht",
      description: "Traditional Russian soups and hearty meals",
      address: "Moscow Street 2525, Suburbs",
      location: "Suburbs",
      cuisine: "Russian",
      priceRange: "€€",
      phone: "+1 555 0135",
      email: "borscht@russian.com",
      website: "https://russian.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.2",
      isActive: true
    },
    {
      name: "Moroccan Tagine",
      description: "North African spices and slow-cooked stews",
      address: "Marrakech Plaza 2626, City Center",
      location: "City Center",
      cuisine: "Moroccan",
      priceRange: "€€",
      phone: "+1 555 0136",
      email: "tagine@moroccan.com",
      website: "https://moroccan.com",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b",
      rating: "4.6",
      isActive: true
    },
    {
      name: "Caribbean Jerk",
      description: "Island flavors and jerk-spiced meats",
      address: "Jamaica Road 2727, Downtown",
      location: "Downtown",
      cuisine: "Caribbean",
      priceRange: "€€",
      phone: "+1 555 0137",
      email: "jerk@caribbean.com",
      website: "https://caribbean.com",
      imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Polish Pierogi",
      description: "Traditional Polish dumplings and comfort food",
      address: "Warsaw Way 2828, Suburbs",
      location: "Suburbs",
      cuisine: "Polish",
      priceRange: "€",
      phone: "+1 555 0138",
      email: "pierogi@polish.com",
      website: "https://polish.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Vietnamese Pho",
      description: "Authentic Vietnamese noodle soups",
      address: "Saigon Street 2929, City Center",
      location: "City Center",
      cuisine: "Vietnamese",
      priceRange: "€",
      phone: "+1 555 0139",
      email: "pho@vietnamese.com",
      website: "https://vietnamese.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Belgian Waffles",
      description: "Sweet and savory Belgian waffles",
      address: "Brussels Boulevard 3030, Downtown",
      location: "Downtown",
      cuisine: "Belgian",
      priceRange: "€",
      phone: "+1 555 0140",
      email: "waffles@belgian.com",
      website: "https://belgian.com",
      imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      rating: "4.2",
      isActive: true
    },
    {
      name: "Swiss Fondue",
      description: "Traditional cheese and chocolate fondues",
      address: "Alpine Avenue 3131, Suburbs",
      location: "Suburbs",
      cuisine: "Swiss",
      priceRange: "€€€",
      phone: "+1 555 0141",
      email: "fondue@swiss.com",
      website: "https://swiss.com",
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462",
      rating: "4.6",
      isActive: true
    },
    {
      name: "Norwegian Salmon",
      description: "Fresh Nordic seafood and Scandinavian cuisine",
      address: "Fjord Street 3232, City Center",
      location: "City Center",
      cuisine: "Scandinavian",
      priceRange: "€€€",
      phone: "+1 555 0142",
      email: "salmon@norwegian.com",
      website: "https://norwegian.com",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44",
      rating: "4.8",
      isActive: true
    },
    {
      name: "Hungarian Goulash",
      description: "Traditional Hungarian stews and paprika dishes",
      address: "Budapest Road 3333, Downtown",
      location: "Downtown",
      cuisine: "Hungarian",
      priceRange: "€€",
      phone: "+1 555 0143",
      email: "goulash@hungarian.com",
      website: "https://hungarian.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.4",
      isActive: true
    },
    {
      name: "Indonesian Satay",
      description: "Southeast Asian street food and satay skewers",
      address: "Bali Beach 3434, Suburbs",
      location: "Suburbs",
      cuisine: "Indonesian",
      priceRange: "€",
      phone: "+1 555 0144",
      email: "satay@indonesian.com",
      website: "https://indonesian.com",
      imageUrl: "https://images.unsplash.com/photo-1569058242779-54d6c8bdd3bb",
      rating: "4.3",
      isActive: true
    },
    {
      name: "Nepalese Momos",
      description: "Himalayan dumplings and mountain cuisine",
      address: "Everest Path 3535, City Center",
      location: "City Center",
      cuisine: "Nepalese",
      priceRange: "€",
      phone: "+1 555 0145",
      email: "momos@nepalese.com",
      website: "https://nepalese.com",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      rating: "4.5",
      isActive: true
    },
    {
      name: "Jamaican Curry",
      description: "Spicy Caribbean curries and island vibes",
      address: "Kingston Court 3636, Downtown",
      location: "Downtown",
      cuisine: "Jamaican",
      priceRange: "€€",
      phone: "+1 555 0146",
      email: "curry@jamaican.com",
      website: "https://jamaican.com",
      imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828",
      rating: "4.4",
      isActive: true
    }
  ];

  const insertedRestaurants = await db.insert(restaurants).values(restaurantData).returning();
  console.log(`Inserted ${insertedRestaurants.length} restaurants`);

  // Seed voucher packages with diverse options
  const packageData = [
    // Bella Vista packages - Flexible options from small to large
    { restaurantId: insertedRestaurants[0].id, name: "Taste Test", description: "Try our signature dishes", mealCount: 3, pricePerMeal: "32.00", discountPercentage: "10.00", validityMonths: 6, isActive: true },
    { restaurantId: insertedRestaurants[0].id, name: "Monthly Special", description: "Perfect for regular visits", mealCount: 8, pricePerMeal: "32.00", discountPercentage: "15.00", validityMonths: 12, isActive: true },
    { restaurantId: insertedRestaurants[0].id, name: "Family Package", description: "Great for family dinners", mealCount: 15, pricePerMeal: "32.00", discountPercentage: "20.00", validityMonths: 12, isActive: true },
    { restaurantId: insertedRestaurants[0].id, name: "VIP Experience", description: "Ultimate dining package", mealCount: 30, pricePerMeal: "32.00", discountPercentage: "25.00", validityMonths: 18, isActive: true },
    
    // Sakura Sushi packages - Premium pricing with varying discounts
    { restaurantId: insertedRestaurants[1].id, name: "Sushi Sampler", description: "Discover our chef's selection", mealCount: 4, pricePerMeal: "45.00", discountPercentage: "8.00", validityMonths: 9, isActive: true },
    { restaurantId: insertedRestaurants[1].id, name: "Sushi Enthusiast", description: "For serious sushi lovers", mealCount: 12, pricePerMeal: "45.00", discountPercentage: "15.00", validityMonths: 12, isActive: true },
    { restaurantId: insertedRestaurants[1].id, name: "Omakase Package", description: "Premium chef's choice experience", mealCount: 20, pricePerMeal: "65.00", discountPercentage: "18.00", validityMonths: 15, isActive: true },
    
    // Le Petit Bistro packages - French cuisine with generous discounts
    { restaurantId: insertedRestaurants[2].id, name: "Petit Dejeuner", description: "Start your French journey", mealCount: 5, pricePerMeal: "28.00", discountPercentage: "12.00", validityMonths: 8, isActive: true },
    { restaurantId: insertedRestaurants[2].id, name: "Bon Appetit", description: "Classic French dining", mealCount: 12, pricePerMeal: "28.00", discountPercentage: "22.00", validityMonths: 12, isActive: true },
    { restaurantId: insertedRestaurants[2].id, name: "Gourmand Special", description: "For the true French food connoisseur", mealCount: 25, pricePerMeal: "28.00", discountPercentage: "28.00", validityMonths: 18, isActive: true },
    
    // Mediterranean Breeze packages - Healthy options with competitive pricing
    { restaurantId: insertedRestaurants[3].id, name: "Fresh Start", description: "Healthy Mediterranean meals", mealCount: 6, pricePerMeal: "35.00", discountPercentage: "14.00", validityMonths: 10, isActive: true },
    { restaurantId: insertedRestaurants[3].id, name: "Mediterranean Journey", description: "Explore our full menu", mealCount: 18, pricePerMeal: "35.00", discountPercentage: "20.00", validityMonths: 14, isActive: true },
    { restaurantId: insertedRestaurants[3].id, name: "Wellness Package", description: "Complete healthy dining experience", mealCount: 40, pricePerMeal: "35.00", discountPercentage: "30.00", validityMonths: 24, isActive: true }
  ];

  const insertedPackages = await db.insert(voucherPackages).values(packageData).returning();
  console.log(`Inserted ${insertedPackages.length} voucher packages`);

  // Create purchased vouchers for demo account (use actual customer ID)
  const purchasedVouchersData = [
    {
      customerId: demoCustomer[0].id,  // Demo customer ID
      packageId: insertedPackages[0].id,  // Bella Vista Family Package
      restaurantId: insertedRestaurants[0].id,
      totalMeals: 15,
      usedMeals: 3,
      purchasePrice: "180.00",
      discountReceived: "45.00",
      expiryDate: new Date(Date.now() + 8 * 30 * 24 * 60 * 60 * 1000), // 8 months from now
      status: "active",
      qrCode: "DEMO_QR_BV_001"
    },
    {
      customerId: demoCustomer[0].id,  // Demo customer ID
      packageId: insertedPackages[1].id,  // Sakura Sushi Starter Package
      restaurantId: insertedRestaurants[1].id,
      totalMeals: 8,
      usedMeals: 1,
      purchasePrice: "120.00",
      discountReceived: "20.00",
      expiryDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
      status: "active",
      qrCode: "DEMO_QR_SS_002"
    },
    {
      customerId: demoCustomer[0].id,  // Demo customer ID
      packageId: insertedPackages[2].id,  // Le Petit Bistro Premium Package
      restaurantId: insertedRestaurants[2].id,
      totalMeals: 12,
      usedMeals: 0,
      purchasePrice: "240.00",
      discountReceived: "60.00",
      expiryDate: new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000), // 10 months from now
      status: "active",
      qrCode: "DEMO_QR_LPB_003"
    }
  ];

  const insertedPurchasedVouchers = await db.insert(purchasedVouchers).values(purchasedVouchersData).returning();
  console.log(`Inserted ${insertedPurchasedVouchers.length} purchased vouchers for demo account`);

  // Create test reservations for demo customer
  const testReservationData = [
    {
      customerId: demoCustomer[0].id,
      customerName: demoCustomer[0].name,
      customerPhone: demoCustomer[0].phone || "+1234567890",
      customerEmail: demoCustomer[0].email,
      restaurantId: insertedRestaurants[0].id, // Bella Vista
      reservationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now at 7:00 PM
      partySize: 2,
      specialRequests: "Window table preferred, celebrating anniversary",
      voucherPackageId: insertedPackages[0].id, // Bella Vista Family Package
      isVoucherReservation: true,
      status: "pending"
    },
    {
      customerId: demoCustomer[0].id,
      customerName: demoCustomer[0].name,
      customerPhone: demoCustomer[0].phone || "+1234567890", 
      customerEmail: demoCustomer[0].email,
      restaurantId: insertedRestaurants[1].id, // Sakura Sushi
      reservationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now at 6:30 PM
      partySize: 4,
      specialRequests: "Birthday celebration, please prepare a dessert",
      voucherPackageId: insertedPackages[1].id, // Sakura Sushi Starter Package
      isVoucherReservation: true,
      status: "confirmed",
      confirmedAt: new Date(),
      restaurantNotes: "Table reserved in VIP section"
    }
  ];

  // Set proper times for reservations
  testReservationData[0].reservationDate.setHours(19, 0, 0, 0); // 7:00 PM
  testReservationData[1].reservationDate.setHours(18, 30, 0, 0); // 6:30 PM

  const insertedReservations = await db.insert(tableReservations).values(testReservationData).returning();
  console.log(`Inserted ${insertedReservations.length} test reservations for demo account`);

  // Seed enhanced customer data with health profile
  const customerData = {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 555 0123",
    balance: "0.00",
    age: 32,
    weight: "75.5",
    height: 180,
    activityLevel: "moderately_active",
    healthGoal: "weight_loss",
    dietaryPreferences: ["vegetarian", "low_carb"],
    allergies: ["nuts", "dairy"],
    dislikes: ["spicy_food"],
    healthConditions: []
  };

  const [insertedCustomer] = await db.insert(customers).values(customerData).returning();
  console.log(`Inserted customer: ${insertedCustomer.name}`);

  // Seed menu items for each restaurant
  const menuItemsData = [
    // Bella Vista (Italian) - Restaurant ID will be from insertedRestaurants[0]
    { restaurantId: insertedRestaurants[0].id, name: "Margherita Pizza", description: "Fresh tomato sauce, mozzarella, basil", category: "mains", price: "14.50", imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop", ingredients: ["tomato", "mozzarella", "basil"], allergens: ["dairy", "gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 280, preparationTime: 15, isPopular: true },
    { restaurantId: insertedRestaurants[0].id, name: "Caesar Salad", description: "Romaine lettuce, parmesan, croutons, caesar dressing", category: "appetizers", price: "9.75", imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop", ingredients: ["romaine", "parmesan", "croutons"], allergens: ["dairy", "gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 190, preparationTime: 10, isPopular: false },
    { restaurantId: insertedRestaurants[0].id, name: "Tiramisu", description: "Classic Italian dessert with mascarpone and coffee", category: "desserts", price: "7.25", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop", ingredients: ["mascarpone", "coffee", "ladyfingers"], allergens: ["dairy", "eggs", "gluten"], dietaryTags: [], spiceLevel: 0, calories: 350, preparationTime: 5, isPopular: true },
    { restaurantId: insertedRestaurants[0].id, name: "Bruschetta", description: "Grilled bread with tomatoes, garlic, and basil", category: "appetizers", price: "8.25", imageUrl: "https://images.unsplash.com/photo-1572441713132-51c75654db73?w=300&h=200&fit=crop", ingredients: ["bread", "tomatoes", "garlic", "basil"], allergens: ["gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 150, preparationTime: 8, isPopular: true },
    
    // Sakura Sushi (Japanese) - Restaurant ID will be from insertedRestaurants[1]
    { restaurantId: insertedRestaurants[1].id, name: "Salmon Sashimi", description: "Fresh Atlantic salmon, expertly sliced", category: "appetizers", price: "18.50", imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop", ingredients: ["salmon"], allergens: ["fish"], dietaryTags: ["gluten_free"], spiceLevel: 0, calories: 180, preparationTime: 5, isPopular: true },
    { restaurantId: insertedRestaurants[1].id, name: "Dragon Roll", description: "Tempura shrimp, avocado, eel sauce", category: "mains", price: "22.00", imageUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300&h=200&fit=crop", ingredients: ["shrimp", "avocado", "nori", "rice"], allergens: ["shellfish", "gluten"], dietaryTags: [], spiceLevel: 1, calories: 320, preparationTime: 12, isPopular: true },
    { restaurantId: insertedRestaurants[1].id, name: "Miso Soup", description: "Traditional soybean paste soup with tofu", category: "appetizers", price: "6.50", imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop", ingredients: ["miso", "tofu", "seaweed"], allergens: ["soy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 80, preparationTime: 8, isPopular: false },
    
    // Le Petit Bistro (French) - Restaurant ID will be from insertedRestaurants[2]
    { restaurantId: insertedRestaurants[2].id, name: "Coq au Vin", description: "Classic French chicken braised in red wine", category: "mains", price: "24.00", imageUrl: "https://images.unsplash.com/photo-1598515213357-d2e3f2bafc5c?w=300&h=200&fit=crop", ingredients: ["chicken", "red wine", "mushrooms"], allergens: [], dietaryTags: ["gluten_free"], spiceLevel: 0, calories: 420, preparationTime: 25, isPopular: true },
    { restaurantId: insertedRestaurants[2].id, name: "French Onion Soup", description: "Rich broth with caramelized onions and gruyere", category: "appetizers", price: "11.50", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop", ingredients: ["onions", "broth", "gruyere"], allergens: ["dairy"], dietaryTags: [], spiceLevel: 0, calories: 250, preparationTime: 18, isPopular: false },
    { restaurantId: insertedRestaurants[2].id, name: "Crème Brûlée", description: "Vanilla custard with caramelized sugar", category: "desserts", price: "9.75", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop", ingredients: ["cream", "vanilla", "sugar"], allergens: ["dairy", "eggs"], dietaryTags: [], spiceLevel: 0, calories: 380, preparationTime: 5, isPopular: true },
    
    // Mediterranean Breeze - Restaurant ID will be from insertedRestaurants[3]
    { restaurantId: insertedRestaurants[3].id, name: "Greek Salad", description: "Fresh vegetables with feta and olive oil", category: "appetizers", price: "10.25", imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop", ingredients: ["tomatoes", "cucumber", "feta", "olives"], allergens: ["dairy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 180, preparationTime: 8, isPopular: true },
    { restaurantId: insertedRestaurants[3].id, name: "Lamb Moussaka", description: "Layered lamb and eggplant with béchamel", category: "mains", price: "19.50", imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d04a?w=300&h=200&fit=crop", ingredients: ["lamb", "eggplant", "bechamel"], allergens: ["dairy", "gluten"], dietaryTags: [], spiceLevel: 1, calories: 450, preparationTime: 30, isPopular: true },
    { restaurantId: insertedRestaurants[3].id, name: "Baklava", description: "Flaky pastry with honey and pistachios", category: "desserts", price: "7.75", imageUrl: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=300&h=200&fit=crop", ingredients: ["phyllo", "honey", "pistachios"], allergens: ["nuts", "gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 320, preparationTime: 5, isPopular: false },
  ];

  // Add comprehensive menus for all remaining restaurants
  for (let i = 4; i < insertedRestaurants.length; i++) {
    const restaurant = insertedRestaurants[i];
    const cuisineMenus = {
      "Chinese": [
        { name: "Sweet & Sour Pork", description: "Crispy pork with pineapple and bell peppers", category: "mains", price: "16.50", ingredients: ["pork", "pineapple", "bell peppers"], allergens: ["gluten"], dietaryTags: [], spiceLevel: 1, calories: 380, preparationTime: 18, isPopular: true },
        { name: "Kung Pao Chicken", description: "Spicy chicken with peanuts and vegetables", category: "mains", price: "15.75", ingredients: ["chicken", "peanuts", "vegetables"], allergens: ["nuts"], dietaryTags: [], spiceLevel: 3, calories: 350, preparationTime: 15, isPopular: true },
        { name: "Hot & Sour Soup", description: "Traditional Chinese soup with tofu and mushrooms", category: "appetizers", price: "8.25", ingredients: ["tofu", "mushrooms", "bamboo shoots"], allergens: ["soy"], dietaryTags: ["vegetarian"], spiceLevel: 2, calories: 120, preparationTime: 12, isPopular: false },
        { name: "Fried Rice", description: "Wok-fried rice with eggs and vegetables", category: "mains", price: "12.50", ingredients: ["rice", "eggs", "vegetables"], allergens: ["eggs"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 280, preparationTime: 10, isPopular: true },
        { name: "Mango Pudding", description: "Sweet mango dessert with coconut", category: "desserts", price: "6.75", ingredients: ["mango", "coconut", "gelatin"], allergens: [], dietaryTags: ["gluten_free"], spiceLevel: 0, calories: 180, preparationTime: 5, isPopular: false }
      ],
      "Indian": [
        { name: "Chicken Tikka Masala", description: "Creamy tomato curry with tender chicken", category: "mains", price: "17.25", ingredients: ["chicken", "tomatoes", "cream", "spices"], allergens: ["dairy"], dietaryTags: [], spiceLevel: 2, calories: 420, preparationTime: 22, isPopular: true },
        { name: "Vegetable Biryani", description: "Fragrant basmati rice with mixed vegetables", category: "mains", price: "14.50", ingredients: ["basmati rice", "vegetables", "spices"], allergens: [], dietaryTags: ["vegetarian"], spiceLevel: 1, calories: 320, preparationTime: 25, isPopular: true },
        { name: "Samosas", description: "Crispy pastries filled with spiced potatoes", category: "appetizers", price: "7.50", ingredients: ["potatoes", "onions", "spices"], allergens: ["gluten"], dietaryTags: ["vegetarian"], spiceLevel: 2, calories: 180, preparationTime: 8, isPopular: true },
        { name: "Naan Bread", description: "Fresh baked flatbread with garlic", category: "sides", price: "4.25", ingredients: ["flour", "garlic", "butter"], allergens: ["gluten", "dairy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 150, preparationTime: 6, isPopular: false },
        { name: "Gulab Jamun", description: "Sweet milk dumplings in syrup", category: "desserts", price: "6.25", ingredients: ["milk powder", "sugar", "cardamom"], allergens: ["dairy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 280, preparationTime: 5, isPopular: false }
      ],
      "Mexican": [
        { name: "Beef Tacos", description: "Seasoned ground beef in soft tortillas", category: "mains", price: "13.75", ingredients: ["beef", "tortillas", "lettuce", "cheese"], allergens: ["dairy", "gluten"], dietaryTags: [], spiceLevel: 2, calories: 320, preparationTime: 12, isPopular: true },
        { name: "Chicken Quesadilla", description: "Grilled chicken and cheese in crispy tortilla", category: "mains", price: "12.50", ingredients: ["chicken", "cheese", "tortilla"], allergens: ["dairy", "gluten"], dietaryTags: [], spiceLevel: 1, calories: 380, preparationTime: 10, isPopular: true },
        { name: "Guacamole", description: "Fresh avocado dip with lime and cilantro", category: "appetizers", price: "8.75", ingredients: ["avocado", "lime", "cilantro", "onions"], allergens: [], dietaryTags: ["vegetarian", "vegan"], spiceLevel: 1, calories: 120, preparationTime: 5, isPopular: true },
        { name: "Churros", description: "Fried pastry with cinnamon sugar", category: "desserts", price: "7.25", ingredients: ["flour", "sugar", "cinnamon"], allergens: ["gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 250, preparationTime: 8, isPopular: false }
      ],
      "Thai": [
        { name: "Pad Thai", description: "Stir-fried noodles with shrimp and peanuts", category: "mains", price: "15.50", ingredients: ["rice noodles", "shrimp", "peanuts"], allergens: ["shellfish", "nuts"], dietaryTags: [], spiceLevel: 2, calories: 380, preparationTime: 15, isPopular: true },
        { name: "Green Curry", description: "Coconut curry with chicken and vegetables", category: "mains", price: "16.75", ingredients: ["chicken", "coconut milk", "vegetables"], allergens: [], dietaryTags: [], spiceLevel: 3, calories: 420, preparationTime: 20, isPopular: true },
        { name: "Tom Yum Soup", description: "Spicy and sour soup with shrimp", category: "appetizers", price: "9.25", ingredients: ["shrimp", "lemongrass", "lime leaves"], allergens: ["shellfish"], dietaryTags: [], spiceLevel: 3, calories: 150, preparationTime: 12, isPopular: false },
        { name: "Mango Sticky Rice", description: "Sweet sticky rice with fresh mango", category: "desserts", price: "8.50", ingredients: ["sticky rice", "mango", "coconut milk"], allergens: [], dietaryTags: ["vegetarian", "gluten_free"], spiceLevel: 0, calories: 280, preparationTime: 5, isPopular: true }
      ],
      "American": [
        { name: "Classic Burger", description: "Beef patty with lettuce, tomato, and fries", category: "mains", price: "14.25", ingredients: ["beef", "lettuce", "tomato", "potatoes"], allergens: ["gluten"], dietaryTags: [], spiceLevel: 0, calories: 480, preparationTime: 15, isPopular: true },
        { name: "BBQ Ribs", description: "Slow-cooked pork ribs with barbecue sauce", category: "mains", price: "22.50", ingredients: ["pork ribs", "bbq sauce"], allergens: [], dietaryTags: [], spiceLevel: 1, calories: 520, preparationTime: 25, isPopular: true },
        { name: "Caesar Salad", description: "Romaine lettuce with parmesan and croutons", category: "appetizers", price: "9.75", ingredients: ["romaine", "parmesan", "croutons"], allergens: ["dairy", "gluten"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 190, preparationTime: 8, isPopular: false },
        { name: "Apple Pie", description: "Classic American dessert with vanilla ice cream", category: "desserts", price: "7.95", ingredients: ["apples", "pastry", "ice cream"], allergens: ["gluten", "dairy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 380, preparationTime: 5, isPopular: true }
      ],
      "Korean": [
        { name: "Bulgogi", description: "Marinated beef with steamed rice", category: "mains", price: "18.75", ingredients: ["beef", "rice", "vegetables"], allergens: ["soy"], dietaryTags: [], spiceLevel: 1, calories: 420, preparationTime: 20, isPopular: true },
        { name: "Kimchi Fried Rice", description: "Spicy fermented cabbage with rice", category: "mains", price: "13.50", ingredients: ["rice", "kimchi", "vegetables"], allergens: ["soy"], dietaryTags: ["vegetarian"], spiceLevel: 3, calories: 280, preparationTime: 12, isPopular: true },
        { name: "Korean BBQ", description: "Grilled meat with various side dishes", category: "mains", price: "24.00", ingredients: ["beef", "pork", "vegetables"], allergens: ["soy"], dietaryTags: [], spiceLevel: 2, calories: 480, preparationTime: 18, isPopular: true },
        { name: "Mochi Ice Cream", description: "Sweet rice cake with ice cream filling", category: "desserts", price: "6.75", ingredients: ["rice flour", "ice cream"], allergens: ["dairy"], dietaryTags: ["vegetarian"], spiceLevel: 0, calories: 180, preparationTime: 5, isPopular: false }
      ]
    };

    // Assign cuisine-specific menus based on restaurant index
    const cuisineTypes = Object.keys(cuisineMenus) as (keyof typeof cuisineMenus)[];
    const assignedCuisine = cuisineTypes[i % cuisineTypes.length];
    const menuTemplate = cuisineMenus[assignedCuisine];

    // Add the menu items for this restaurant
    menuTemplate.forEach((item: any) => {
      menuItemsData.push({
        restaurantId: restaurant.id,
        ...item,
        imageUrl: `https://images.unsplash.com/photo-${1500000000000 + (i * 1000) + menuTemplate.indexOf(item)}?w=300&h=200&fit=crop`
      });
    });
  }

  const insertedMenuItems = await db.insert(menuItems).values(menuItemsData).returning();
  console.log(`Inserted ${insertedMenuItems.length} menu items`);

  console.log("Database seeding completed successfully!");
}

// Run seeding if this file is executed directly
seedDatabase().catch(console.error);

export { seedDatabase };