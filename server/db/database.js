import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ruby_achievements',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const hardcodedCategories = [
  { name: 'Sports Bar', slug: 'sports-bar', description: 'Persistence in Physical Activity' },
  { name: 'Arts Bar', slug: 'arts-bar', description: 'Excellence in the Arts' },
  { name: 'Citizenship Bar 1', slug: 'citizenship-bar-1', description: 'Responsibility and Service to the School' },
  { name: 'Citizenship Bar 2', slug: 'citizenship-bar-2', description: 'Caring and Giving' },
];

const achievementsByCategory = {
  'sports-bar': [
    { title: 'P-1: Overnight Camp or Tramp', description: 'Explore the outdoors with a family member or friend by completing an overnight camp or tramp. Take photos of your trip and keep a diary of what you did.' },
    { title: 'P-2: Fitness Training', description: 'Improve your fitness by training for a minimum of 4 weeks. Create a schedule including the distances and times you have been running.' },
    { title: 'P-3: Mountain Bike Rides', description: 'Participate in after school or weekend mountain bike rides. Keep a written and photographic record of tracks, the people you were with and distances covered.' },
    { title: 'P-4: Individual Sporting Events', description: 'Compete in at least two different individual sporting events, for example, RATs duathlon, Weetbix tryathlon, tour de lakefront, motocross, equestrian or a swimming meet. Include participation, place certificates and/or photographs as evidence of your involvement.' },
    { title: 'P-5: Active Transport to School', description: 'Walk, scooter, skateboard or bike to school daily with others for a term. Keep a record of the days you did this and who you were with.' },
    { title: 'P-6: Team Sport Season', description: 'Compete in a team sport for an entire season. Keep a record of games, results and areas for improvement.' },
    { title: 'P-7: Fishing Adventures', description: 'Go fishing in fresh or salt water on at least 5 occasions recording the following: species and size of fish, numbers caught, method, tackle and bait used and weather conditions.' },
    { title: 'P-8: Design Your Own Challenge', description: 'Design your own challenge.' },
    { title: 'P-9: Design Your Own Challenge', description: 'Design your own challenge.' },
  ],
  'arts-bar': [
    { title: 'A-1: Performing Group', description: 'Join the school choir, orchestra, rock band, marimba or kapa haka group and participate in a public performance. You must be involved for at least 3 terms and attend all rehearsals. Be creative with how you evidence your participation.' },
    { title: 'A-2: Wearable Arts Costume', description: 'Create a wearable arts costume with a partner. You will need to decide on a theme, design and make your costume then present it to your class with music and commentary.' },
    { title: 'A-3: Dance or Drama Group', description: 'Join a dance or drama group, attend lessons and record the journey of your learning.' },
    { title: 'A-4: Learn a Musical Instrument', description: 'Learn a musical instrument over the course of the year and learn to read music. Keep a record of this journey and perform a piece to your class towards the end of the year.' },
    { title: 'A-5: Learn a New Craft', description: 'Learn a new craft and teach another person. Things you could try include modelling, making jewellery, embroidery, knitting, poker art or carving.' },
    { title: 'A-6: Famous NZ Artist Study', description: 'Use the inquiry approach to investigate a famous New Zealand artist and their methods. Create a portfolio displaying your findings and own art work in that style.' },
    { title: 'A-7: Performance Review', description: 'Attend a musical, dance or production by a local (community) or nation wide group. Write a review that shares your impression of the performance, including comments about the set, costumes, props, script etc.' },
    { title: 'A-8: Design Your Own Challenge', description: 'Design your own challenge.' },
    { title: 'A-9: Design Your Own Challenge', description: 'Design your own challenge.' },
  ],
  'citizenship-bar-1': [
    { title: 'CR-1: School Responsibility Role', description: 'Commit to a responsibility such as road patrol, ICT techie, school council or dynamo leader and stay with this for the minimum of 3 terms.' },
    { title: 'CR-2: Organise Activities', description: 'Organise lunchtime or wet weather activities for a target group. Choose an area that you are passionate about or see a need for and run a minimum of 8 planned sessions. Submit your planning along with photographs as evidence.' },
    { title: 'CR-3: Volunteer for a Teacher', description: 'Volunteer your services before school for a term to a teacher. Negotiate your weekly time with them. As evidence, show how you have supported or helped them.' },
    { title: 'CR-4: School Area Review', description: 'Review an area or function of the school such as library books, class readers, ICT equipment/programmes or sports gear. Explore what we have, survey your peers and then present a plan of your recommendations to the teacher in charge.' },
    { title: 'CR-5: Support a School Team', description: 'Support a school team over the course of a season by attending matches. You could be a supporter from the side-line or even volunteer your services to the coach during this time.' },
    { title: 'CR-6: Assembly Song', description: 'Introduce a new song to sing during area assemblies. When you have found something suitable approach the team leader and put a plan in place to teach this to students in all teams.' },
    { title: 'CR-7: Key Competencies Ads', description: 'Design a series of propaganda/advertisements on the computer/iPad that illustrate all of the key competencies, school values or Lynmore learner qualities. You will first need to find out what effective advertisements should contain and then make your own ones.' },
    { title: 'CR-8: Design Your Own Challenge', description: 'Design your own challenge.' },
    { title: 'CR-9: Design Your Own Challenge', description: 'Design your own challenge.' },
  ],
  'citizenship-bar-2': [
    { title: 'CC-1: Board Games Night', description: 'Have a board games night with friends and/or family. Try to play at least three different games. As evidence, include photos and record some strategies used by the winning players in each game.' },
    { title: 'CC-2: Family Jobs', description: 'Complete 10 jobs for your family. Keep a record of the task, date completed and also include photographs.', checklist: ['', '', '', '', '', '', '', '', '', ''] },
    { title: 'CC-3: Civil Defence Preparedness', description: 'Find out about the Civil Defence, where your nearest Civil Defence sector post is and where to go to turn off the power and water in a civil defence emergency. Take time to help prepare your civil defence kit at home and check your items against the list in the phone book. Record your findings and photograph your kit.' },
    { title: 'CC-4: Themed Meals', description: 'Prepare three themed meals of three courses. Include the menus, photos, and comments from family members as part of your evidence.' },
    { title: 'CC-5: Recycling at Home', description: 'Be involved in recycling rubbish at home for 2 terms. You may need to set up some recycling bins at home (if you don\'t already have some) and help with sorting these items at the recycling centre. Take photos of your recycling journey as well as your set up at home. Share your thoughts about how this has affected the amount of household rubbish you have.' },
    { title: 'CC-6: Environmental Clean-Up', description: 'Take part in an environmental clean-up day in your local community. Provide photographic evidence (with captions) of your participation in this event.' },
    { title: 'CC-7: Helping Others or Charity', description: 'Give your time to help others in need or a charity. Record who you helped, the days you helped, length of time and the tasks you performed. Take photographs to show your involvement.' },
    { title: 'CC-8: Design Your Own Challenge', description: 'Design your own challenge.' },
    { title: 'CC-9: Design Your Own Challenge', description: 'Design your own challenge.' },
  ],
};

async function initializeDatabase() {
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      featured_image TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      date TEXT,
      featured_image TEXT,
      gallery_images JSONB,
      status TEXT DEFAULT 'uncompleted',
      checklist JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS media_library (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'image',
      cloudinary_public_id TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add checklist column if missing (migration for existing DBs)
  await pool.query(`
    ALTER TABLE achievements ADD COLUMN IF NOT EXISTS checklist JSONB
  `);

  // Add video column if missing (migration for existing DBs)
  await pool.query(`
    ALTER TABLE achievements ADD COLUMN IF NOT EXISTS video TEXT
  `);

  // Add content_sections column if missing (migration for existing DBs)
  await pool.query(`
    ALTER TABLE achievements ADD COLUMN IF NOT EXISTS content_sections JSONB
  `);

  // Seed default admin user
  const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE username = $1', ['ruby']);
  if (existingUsers.length === 0) {
    const hashedPassword = bcrypt.hashSync('ruby123', 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['ruby', hashedPassword]);
    console.log('Default user created');
  }

  // Migration guard: if old 'academic' category exists or placeholder achievements exist, wipe old data
  const { rows: oldCat } = await pool.query("SELECT id FROM categories WHERE slug = 'academic'");
  const { rows: placeholderCheck } = await pool.query("SELECT id FROM achievements WHERE title LIKE '%Achievement 1' LIMIT 1");
  if (oldCat.length > 0 || placeholderCheck.length > 0) {
    await pool.query('DELETE FROM achievements');
    await pool.query('DELETE FROM categories');
    console.log('Migrated: cleared old categories and achievements');
  }

  // Seed hardcoded categories
  for (const cat of hardcodedCategories) {
    const { rows } = await pool.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
    if (rows.length === 0) {
      await pool.query('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', [cat.name, cat.slug, cat.description]);
      console.log(`Category created: ${cat.name}`);
    }
  }

  // Seed achievements per category (if not already seeded)
  const { rows: allCategories } = await pool.query('SELECT id, slug FROM categories ORDER BY id');
  for (const cat of allCategories) {
    const { rows: existing } = await pool.query('SELECT COUNT(*)::int as count FROM achievements WHERE category_id = $1', [cat.id]);
    if (existing[0].count === 0) {
      const achievements = achievementsByCategory[cat.slug];
      if (achievements) {
        for (const a of achievements) {
          await pool.query(
            `INSERT INTO achievements (title, description, category_id, status, checklist) VALUES ($1, $2, $3, 'uncompleted', $4)`,
            [a.title, a.description, cat.id, a.checklist ? JSON.stringify(a.checklist) : null]
          );
        }
        console.log(`Seeded ${achievements.length} achievements for: ${cat.slug}`);
      }
    }
  }

  // Seed default site settings
  const defaultSettings = {
    hero_image: '/hero.jpg',
    home_title: "Ruby's Achievement Portfolio",
    home_subtitle: 'Celebrating success, one achievement at a time',
    home_bio_1: "Hi, I'm Ruby! I love keeping busy with all kinds of activities. I'm passionate about dance, kapa haka, and playing sports with my friends. Whether it's performing on stage, competing in duathlons, or playing football, I always give it my best.",
    home_bio_2: 'This portfolio tracks my progress towards earning my achievement bars at Lynmore School. Each bar has 9 challenges to complete across sports, arts, and citizenship.',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }

  console.log('Database initialized');
}

export { pool, initializeDatabase };
