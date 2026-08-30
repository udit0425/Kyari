import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PERSISTENT_DIR = '/var/data';
const DB_FILENAME = 'corbett_malbagadh.db';
const DB_PATH = fs.existsSync(PERSISTENT_DIR) 
  ? join(PERSISTENT_DIR, DB_FILENAME) 
  : join(__dirname, DB_FILENAME);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Helper to run query as Promise
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper to get all results as Promise
export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper to get single result as Promise
export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize schema and seed data
export const initDb = async () => {
  // Create tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_count INTEGER DEFAULT 2,
      total_price REAL DEFAULT 0,
      status TEXT DEFAULT 'Confirmed',
      created_at TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      author TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT NOT NULL,
      date TEXT NOT NULL,
      avatar TEXT,
      url TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS booking_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_phone TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guest_count INTEGER DEFAULT 2,
      status TEXT DEFAULT 'Pending',
      created_at TEXT NOT NULL
    )
  `);

  // Check if seeded
  const bookingsCount = await dbGet('SELECT COUNT(*) as count FROM bookings');
  if (bookingsCount.count === 0) {
    console.log('Seeding initial database content...');
    
    // Seed Bookings — realistic Aug/Sep 2026 dates
    const initialBookings = [
      // August 2026
      { platform: 'Airbnb', check_in: '2026-08-31', check_out: '2026-09-03', guest_name: 'Rohan Mehta', guest_count: 4, total_price: 48000, status: 'Confirmed', created_at: new Date().toISOString() },
      { platform: 'Direct', check_in: '2026-08-25', check_out: '2026-08-29', guest_name: 'Nandita Rao', guest_count: 2, total_price: 36000, status: 'Confirmed', created_at: new Date().toISOString() },
      // September 2026
      { platform: 'Airbnb', check_in: '2026-09-05', check_out: '2026-09-08', guest_name: 'Priya Kapoor', guest_count: 6, total_price: 54000, status: 'Confirmed', created_at: new Date().toISOString() },
      { platform: 'Rent By Owner', check_in: '2026-09-12', check_out: '2026-09-14', guest_name: 'Sarah Mitchell', guest_count: 4, total_price: 28000, status: 'Confirmed', created_at: new Date().toISOString() },
      { platform: 'JustDial', check_in: '2026-09-17', check_out: '2026-09-20', guest_name: 'Vikram Singh', guest_count: 5, total_price: 36000, status: 'Confirmed', created_at: new Date().toISOString() },
      { platform: 'Skyscanner', check_in: '2026-09-24', check_out: '2026-09-27', guest_name: 'Amit Patel', guest_count: 3, total_price: 42000, status: 'Confirmed', created_at: new Date().toISOString() },
      // October 2026
      { platform: 'Airbnb', check_in: '2026-10-03', check_out: '2026-10-07', guest_name: 'Kavya Sharma', guest_count: 4, total_price: 60000, status: 'Confirmed', created_at: new Date().toISOString() },
      { platform: 'Direct', check_in: '2026-10-15', check_out: '2026-10-19', guest_name: 'Arun Nair', guest_count: 2, total_price: 48000, status: 'Confirmed', created_at: new Date().toISOString() },
    ];

    for (const b of initialBookings) {
      await dbRun(
        'INSERT INTO bookings (platform, check_in, check_out, guest_name, guest_count, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [b.platform, b.check_in, b.check_out, b.guest_name, b.guest_count, b.total_price, b.status, b.created_at]
      );
    }

    // Seed Reviews
    const initialReviews = [
      {
        platform: 'Airbnb',
        author: 'Karan Sharma',
        rating: 5,
        comment: "A true gem in the heart of the mountains. Reaching here is a bit of an adventure (steep climb - make sure you have a robust car or take the Gypsy Bunty ji provides). Caretakers Bunty and cook Balam Singh make the stay so special. Balam's home-cooked food was delicious, and Bunty organized hikes for us. Saw Sambar deer directly from the deck!",
        date: '2026-08-10',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Pooja Bhatia',
        rating: 5,
        comment: 'Perfect space for bird watchers and nature enthusiasts. Tastefully done up bungalow. Loved the digital detox! Caretaker Bunty and cook Balam Singh ji are amazing. We paid the extra ₹2,500 cook fee and it was totally worth it. Bunty guided us on walks and Balam made incredible local food.',
        date: '2026-07-28',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Vikram Malhotra',
        rating: 5,
        comment: 'Corbett Malbagadh offers pure tranquility. Chef Balam prepared amazing breakfast spreads. Caretaker Bunty took us on a birdwatching walk early in the morning and we saw several hornbills. The mountain air is so fresh.',
        date: '2026-08-01',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Anjali Sen',
        rating: 5,
        comment: 'Spectacular property overlooking the forest valley. Reaching the cottage is adventurous, but Bunty ji was there to pick us up in the Gypsy. The food cooked by Balam Singh was high-quality and tasty.',
        date: '2026-07-15',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Rajesh Mehta',
        rating: 5,
        comment: 'Amazing host and staff. Bunty was super helpful with baggage and coordination. Chef Balam Singh cooked excellent local chicken curry and paneer. The stone design of the villa is beautiful.',
        date: '2026-06-30',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Sandeep K.',
        rating: 5,
        comment: 'Loved our stay at Corbett Malbagadh. The kids had a great time hiking around Jakh village with Bunty. Balam Singh ji prepared delicious and hygienic Kumaoni food. Very clean rooms and high-quality linen.',
        date: '2026-08-12',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Neha Gupta',
        rating: 5,
        comment: 'Best place for a quiet getaway. Bunty ji helped us with all our requests. Balam Singh ji is an absolute magician in the kitchen. Spotting barking deer in the morning was the highlight.',
        date: '2026-07-05',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Rohan Das',
        rating: 5,
        comment: 'Highly recommended wilderness retreat. Caretaker Bunty ji accompanied us on a trek to the river bed. Balam Singh cooked fresh meals three times a day. Excellent value and very clean.',
        date: '2026-08-20',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Sneha Reddy',
        rating: 5,
        comment: 'Beautiful views, spacious bedrooms, and peaceful environment. Balam Singh ji made fantastic mutton curry. Bunty ji arranged the pick up from Kyari parking safely. Highly recommended!',
        date: '2026-07-22',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'Airbnb',
        author: 'Aditya V.',
        rating: 5,
        comment: 'If you want a digital detox in Corbett, this is it. The staff, Bunty and Balam, are top-class. Food was outstanding. The offroad drive up the hill is thrilling.',
        date: '2026-08-22',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.airbnb.co.in/rooms/15366399'
      },
      {
        platform: 'JustDial',
        author: 'Amit Saxena',
        rating: 5,
        comment: 'Outstanding Kumaoni food prepared by Balam Singh and excellent hospitality by Bunty ji. Clean property, comfortable rooms, and very pet-friendly. Ideal for family gatherings. Note that the final stretch is very steep, so arrive before dark!',
        date: '2026-08-15',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Sanjay Kumar',
        rating: 5,
        comment: 'Excellent homestay experience near Almora betalghat road. Surrounded by rich green tree canopy. Staff (especially Bunty and Balam) are always smiling and helpful. The kids enjoyed the nature walk. Best pet friendly retreat!',
        date: '2026-06-20',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Harish Rawat',
        rating: 5,
        comment: 'Perfect getaway spot for locals and travelers alike near Totam Almora. Caretaker Bunty is very active and chef Balam Singh serves fresh hot food. Very clean toilets and bedrooms. Excellent hospitality.',
        date: '2026-07-10',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Preeti Joshi',
        rating: 5,
        comment: 'Loved the quiet surroundings and forest vibes. Balam Singh ji made delicious aloo ke gutke and local Kumaoni dishes. Bunty ji took great care of our family. Highly recommended.',
        date: '2026-08-05',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Manish Sharma',
        rating: 5,
        comment: 'A great pet-friendly property near Jakh village. We traveled with our two dogs and they loved the open garden. Caretaker Bunty was very supportive. Food by cook Balam was amazing.',
        date: '2026-07-18',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Divya P.',
        rating: 5,
        comment: 'Very peaceful retreat away from crowded spots of Ramnagar. The last 1km steep climb is adventurous, but Bunty ji drove us up safely. Balam Singh ji’s Kumaoni meals are excellent.',
        date: '2026-08-24',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Gaurav Negi',
        rating: 5,
        comment: 'Excellent location above Kyari. The cottage has premium modern amenities. Bunty ji and Balam Singh ji make a great team. Visited last week with family and had a fantastic stay.',
        date: '2026-06-15',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'JustDial',
        author: 'Rakesh Bisht',
        rating: 5,
        comment: 'Top class service. Chef Balam Singh cooked delicious Kumaoni chicken and local daal. Caretaker Bunty ji helped us with guiding hikes. Clean and hygienic.',
        date: '2026-07-30',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.justdial.com/Almora/Corbett-Malbagadh-Itc-Corbett-By-Welcomegroup-Totam/9999P5962-5962-251021192918-H1X1_BZDET'
      },
      {
        platform: 'Rent By Owner',
        author: 'Robert H.',
        rating: 5,
        comment: 'Beautiful stone structure with 3 bedrooms. Incredible view of the forest. Caretaker Bunty ji met us at the Kyari village and drove us up in the Gypsy. Cook Balam prepared delicious Kumaoni meals. Pet friendly, our retriever loved it.',
        date: '2026-08-04',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.rentbyowner.com/property/corbett-malbagadh-an-experience-with-nature/AB-15366399'
      },
      {
        platform: 'Rent By Owner',
        author: 'Emily S.',
        rating: 5,
        comment: 'Stunning nature retreat. Reaching the property involves an adventurous steep road, but Bunty ji was very helpful with logistics. We spotted barking deer in the morning mist from the balcony deck! Food prepared by Balam ji was delicious. Absolute privacy.',
        date: '2026-07-12',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.rentbyowner.com/property/corbett-malbagadh-an-experience-with-nature/AB-15366399'
      },
      {
        platform: 'Rent By Owner',
        author: 'Thomas W.',
        rating: 5,
        comment: 'Spacious stone bungalow. Perfect for family getaways. Cook Balam prepared high-quality meals. Caretaker Bunty drove us up the steep hill. Very comfortable rooms.',
        date: '2026-08-14',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.rentbyowner.com/property/corbett-malbagadh-an-experience-with-nature/AB-15366399'
      },
      {
        platform: 'Instagram',
        author: '@wanderlust_kumaon',
        rating: 5,
        comment: 'Waking up in a wooden cabin surrounded by betalghat forest fog is a vibe. Spotted a Sambar deer directly from the deck this morning! Corbett Malbagadh is the digital detox we all need! 🌄🦅 #corbett #jakh #homestay',
        date: '2026-08-25',
        avatar: 'https://images.unsplash.com/photo-1527983359383-4758693f760c?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.instagram.com/malbagadh/'
      },
      {
        platform: 'Instagram',
        author: '@shreya_travels',
        rating: 5,
        comment: 'Living with nature. No horn honking, just wind whistling and birds chirping. Caretaker Bunty guided us on a beautiful trek, and cook Balam ji made delicious food. Bonfire at night was magical. 🪵✨ #solitude #naturelovers',
        date: '2026-08-19',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.instagram.com/malbagadh/'
      },
      {
        platform: 'Skyscanner',
        author: 'David Miller',
        rating: 5,
        comment: 'Perfect seclusion near Jim Corbett. Modern amenities combined with rustic mountain charm. Professional cooking team in the kitchen. Very smooth coordination with the Gypsy ride. Fully recommend Balam and Bunty’s hospitality.',
        date: '2026-08-08',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.skyscanner.qa/hotels/india/almora-hotels/corbett-malbagadh/ht-225130046'
      },
      {
        platform: 'Skyscanner',
        author: 'Sarah Jenkins',
        rating: 5,
        comment: 'Stunning views from the Machan deck. A true sanctuary in Almora region. Hospitality by Bunty and Balam was exceptional. High-quality bedding and clean bathrooms.',
        date: '2026-07-02',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        url: 'https://www.skyscanner.qa/hotels/india/almora-hotels/corbett-malbagadh/ht-225130046'
      }
    ];

    for (const r of initialReviews) {
      await dbRun(
        'INSERT INTO reviews (platform, author, rating, comment, date, avatar, url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.platform, r.author, r.rating, r.comment, r.date, r.avatar, r.url]
      );
    }

    // Seed Gallery
    const initialImages = [
      'https://a0.muscache.com/im/pictures/1bc308b4-bbc8-44d8-8768-9c7348f4d108.jpg',
      'https://a0.muscache.com/im/pictures/403d6cfc-f56d-4cd4-9bac-0ae5f8f3fc53.jpg',
      'https://a0.muscache.com/im/pictures/2939a080-3f7d-43be-a1a4-4fde94abfa85.jpg',
      'https://a0.muscache.com/im/pictures/hosting/Hosting-15366399/original/773b9654-8186-4689-92d2-a35e89bae9cc.jpeg',
      'https://a0.muscache.com/im/pictures/hosting/Hosting-15366399/original/76380031-eb80-4f60-9719-529ddf45f99a.jpeg',
      'https://a0.muscache.com/im/pictures/052746bf-dea5-4c19-b259-c400ac9bdb49.jpg'
    ];
    for (const img of initialImages) {
      await dbRun(
        'INSERT OR IGNORE INTO gallery_images (url, created_at) VALUES (?, ?)',
        [img, new Date().toISOString()]
      );
    }
    
    console.log('Database seeded successfully.');
  }
};

export default db;
