import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'

async function seed() {
  console.log('🌱 Starting comprehensive realistic demo seed for CampusGigs...')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Fetch Department and Category maps
    const { rows: depts } = await client.query<{ id: string; code: string }>('SELECT id, code FROM departments')
    const deptMap = new Map(depts.map((d) => [d.code, d.id]))

    const { rows: cats } = await client.query<{ id: string; name: string }>('SELECT id, name FROM categories')
    const catMap = new Map(cats.map((c) => [c.name, c.id]))

    console.log(`✓ Loaded ${deptMap.size} departments and ${catMap.size} categories.`)

    const defaultPassword = 'Password123!'
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    // 2. Define Showcase Users
    const showcaseUsers = [
      {
        email: 'dr.sharma@thapar.edu',
        fullName: 'Dr. Rajesh Sharma',
        role: 'faculty',
        deptCode: 'CSED',
        rollId: 'EMP-CS-1042',
        designation: 'Associate Professor & AI Lab Head',
        experience: 'advanced',
        bio: 'Associate Professor in CSED with 12+ years of research in Distributed Systems and Deep Learning. Faculty Coordinator for Campus Open Source.',
        headline: 'Associate Professor | CSED Faculty Mentor',
        skillTags: ['Distributed Systems', 'Python', 'Machine Learning', 'Cloud Computing', 'Git'],
        canHostWorkshops: true,
        isAdmin: true,
        walletBalance: 240.0,
        avgRating: 5.0,
        completedCount: 8,
        interests: ['Machine Learning', 'DevOps & Cloud', 'GitHub & Open Source', 'Data Science'],
      },
      {
        email: 'aarav.sharma@thapar.edu',
        fullName: 'Aarav Sharma',
        role: 'ug_student',
        deptCode: 'CSED',
        rollId: '102103456',
        year: 4,
        experience: 'intermediate',
        bio: 'Final year CS undergrad passionate about full-stack web engineering and microservices. Active open-source contributor and hackathon lead.',
        headline: 'Final Year CS Undergrad | Full-Stack Developer',
        skillTags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
        canHostWorkshops: false,
        isAdmin: false,
        walletBalance: 175.0,
        avgRating: 4.9,
        completedCount: 5,
        interests: ['Frontend', 'Backend', 'Mobile Apps', 'DevOps & Cloud'],
      },
      {
        email: 'priya.verma@thapar.edu',
        fullName: 'Priya Verma',
        role: 'ug_student',
        deptCode: 'ECED',
        rollId: '102203789',
        year: 3,
        experience: 'advanced',
        bio: '3rd Year Electronics & Computing. Top-rated campus freelancer specializing in sleek React/Next.js interfaces, UI/UX prototyping, and embedded apps.',
        headline: 'UI/UX Designer & React Frontend Specialist | 4.96 ★',
        skillTags: ['React', 'Next.js', 'Figma', 'UI/UX Design', 'Tailwind CSS', 'Flutter', 'TypeScript'],
        canHostWorkshops: true,
        isAdmin: false,
        walletBalance: 285.0,
        avgRating: 4.96,
        completedCount: 7,
        interests: ['Frontend', 'Design & Creative', 'Mobile Apps', 'GitHub & Open Source'],
      },
      {
        email: 'rohit.kumar@thapar.edu',
        fullName: 'Rohit Kumar',
        role: 'mtech',
        deptCode: 'CSED',
        rollId: '202302114',
        year: 2,
        experience: 'advanced',
        bio: 'M.Tech Research Scholar focusing on Computer Vision and NLP. Published in IEEE workshops. Available for research consulting and advanced ML debugging.',
        headline: 'M.Tech Research Scholar | Computer Vision & PyTorch Host',
        skillTags: ['PyTorch', 'TensorFlow', 'Python', 'Computer Vision', 'NLP', 'LaTeX'],
        canHostWorkshops: true,
        isAdmin: false,
        walletBalance: 160.0,
        avgRating: 4.88,
        completedCount: 5,
        interests: ['Machine Learning', 'Data Science', 'Research Help', 'Tutoring & Academics'],
      },
      {
        email: 'ananya.patel@thapar.edu',
        fullName: 'Ananya Patel',
        role: 'ug_student',
        deptCode: 'CSED',
        rollId: '102304891',
        year: 2,
        experience: 'intermediate',
        bio: '2nd Year CS student. Graphic designer for college societies, newsletter editor, and frontend enthusiast.',
        headline: 'Creative Designer & Content Strategist | 2nd Year UG',
        skillTags: ['Graphic Design', 'Figma', 'Content Writing', 'Canva', 'HTML/CSS'],
        canHostWorkshops: false,
        isAdmin: false,
        walletBalance: 120.0,
        avgRating: 5.0,
        completedCount: 3,
        interests: ['Design & Creative', 'Content & Writing', 'Campus Errands'],
      },
      {
        email: 'neha.singh@thapar.edu',
        fullName: 'Neha Singh',
        role: 'ug_student',
        deptCode: 'EIED',
        rollId: '102208123',
        year: 3,
        experience: 'intermediate',
        bio: 'Instrumentation & IoT enthusiast. Loves building robotics projects, Arduino sensors, and data scrapers.',
        headline: 'IoT & Embedded Systems Enthusiast | Robotics Team',
        skillTags: ['Arduino', 'ESP32', 'Python', 'IoT', 'C++', 'Raspberry Pi'],
        canHostWorkshops: false,
        isAdmin: false,
        walletBalance: 95.0,
        avgRating: 4.75,
        completedCount: 3,
        interests: ['Backend', 'Technical (Other)', 'Lab & Project Support'],
      },
      {
        email: 'kabir.manchanda@thapar.edu',
        fullName: 'Kabir Manchanda',
        role: 'ug_student',
        deptCode: 'CSED',
        rollId: '102103999',
        year: 4,
        experience: 'advanced',
        bio: 'Senior student, backend builder, and coordinator for campus technical events.',
        headline: 'Senior CS Undergrad | Project Coordinator',
        skillTags: ['Node.js', 'Python', 'PostgreSQL', 'Express', 'Redis'],
        canHostWorkshops: false,
        isAdmin: false,
        walletBalance: 175.0,
        avgRating: 4.9,
        completedCount: 4,
        interests: ['Backend', 'DevOps & Cloud', 'Mentorship & Career'],
      },
    ]

    const userMap = new Map<string, string>()

    for (const u of showcaseUsers) {
      // Upsert app_users
      const { rows: userRows } = await client.query<{ id: string }>(
        `INSERT INTO app_users (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email)
         DO UPDATE SET password_hash = $2, updated_at = now()
         RETURNING id`,
        [u.email, passwordHash],
      )
      const userId = userRows[0].id
      userMap.set(u.email, userId)

      // Upsert profile
      const deptId = deptMap.get(u.deptCode) || null
      await client.query(
        `INSERT INTO profiles (
           id, full_name, college_email, campus_role, department_id,
           roll_or_employee_id, year_of_study, designation, experience_level,
           bio, headline, skill_tags, can_host_workshops, is_admin,
           wallet_balance, avg_rating, completed_count, onboarding_completed, is_open_to_work
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true,true)
         ON CONFLICT (id) DO UPDATE SET
           full_name = $2,
           campus_role = $4,
           department_id = $5,
           roll_or_employee_id = $6,
           year_of_study = $7,
           designation = $8,
           experience_level = $9,
           bio = $10,
           headline = $11,
           skill_tags = $12,
           can_host_workshops = $13,
           is_admin = $14,
           wallet_balance = $15,
           avg_rating = $16,
           completed_count = $17,
           onboarding_completed = true,
           is_open_to_work = true`,
        [
          userId,
          u.fullName,
          u.email,
          u.role,
          deptId,
          u.rollId ?? null,
          u.year ?? null,
          u.designation ?? null,
          u.experience ?? null,
          u.bio,
          u.headline,
          u.skillTags,
          u.canHostWorkshops,
          u.isAdmin,
          u.walletBalance,
          u.avgRating ?? 0,
          u.completedCount ?? 0,
        ],
      )

      // Upsert interests
      if (u.interests && u.interests.length > 0) {
        for (const intName of u.interests) {
          const catId = catMap.get(intName)
          if (catId) {
            await client.query(
              `INSERT INTO user_interests (user_id, category_id)
               VALUES ($1, $2)
               ON CONFLICT (user_id, category_id) DO NOTHING`,
              [userId, catId],
            )
          }
        }
      }

      // Record welcome signup bonus in ledger if not already recorded
      await client.query(
        `INSERT INTO transactions (to_user, amount, type)
         SELECT $1, 100.00, 'signup_bonus'
         WHERE NOT EXISTS (
           SELECT 1 FROM transactions WHERE to_user = $1 AND type = 'signup_bonus'
         )`,
        [userId],
      )
    }

    console.log(`✓ Upserted ${showcaseUsers.length} showcase users with password "${defaultPassword}".`)

    // Helper IDs
    const drSharmaId = userMap.get('dr.sharma@thapar.edu')!
    const aaravId = userMap.get('aarav.sharma@thapar.edu')!
    const priyaId = userMap.get('priya.verma@thapar.edu')!
    const rohitId = userMap.get('rohit.kumar@thapar.edu')!
    const ananyaId = userMap.get('ananya.patel@thapar.edu')!
    const nehaId = userMap.get('neha.singh@thapar.edu')!
    const kabirId = userMap.get('kabir.manchanda@thapar.edu')!
    const allUserIds = [drSharmaId, aaravId, priyaId, rohitId, ananyaId, nehaId, kabirId]

    // 2b. Clean up previous showcase tasks and notifications for clean idempotent resets
    console.log('🧹 Purging prior showcase activity for idempotent demo reset...')
    await client.query(
      `DELETE FROM transactions WHERE task_id IN (SELECT id FROM tasks WHERE poster_id = ANY($1) OR worker_id = ANY($1))`,
      [allUserIds],
    )
    await client.query(
      `DELETE FROM notifications WHERE user_id = ANY($1)`,
      [allUserIds],
    )
    await client.query(
      `DELETE FROM tasks WHERE poster_id = ANY($1) OR worker_id = ANY($1)`,
      [allUserIds],
    )

    // Seed Priya's user_category_stats for recommendations test
    const frontendCatId = catMap.get('Frontend')!
    const designCatId = catMap.get('Design & Creative')!
    await client.query(
      `INSERT INTO user_category_stats (user_id, category_id, completed_count)
       VALUES ($1, $2, 4), ($1, $3, 3)
       ON CONFLICT (user_id, category_id)
       DO UPDATE SET completed_count = EXCLUDED.completed_count`,
      [priyaId, frontendCatId, designCatId],
    )

    // 3. Define Showcase Listings across all Archetypes and States
    console.log('📌 Seeding listings across all lifecycle states...')

    // A. Open Gigs (for browsing and live applying)
    const openGigs = [
      {
        posterId: aaravId,
        type: 'gig',
        title: 'Debug PyTorch Loss Divergence in ResNet-50 Model',
        description:
          'Working on an image classification project for our Computer Vision lab. Loss explodes to NaN after epoch 12. Need an experienced ML engineer to inspect our gradient clipping, learning rate schedule, and custom cross-entropy loss implementation.',
        category: 'Machine Learning',
        difficulty: 'advanced',
        budget: 35.0,
        deadlineDays: 5,
        mode: 'online',
        targetDept: 'CSED',
      },
      {
        posterId: aaravId,
        type: 'gig',
        title: 'Build React Native Navigation & Auth Flow for Fest App',
        description:
          'We have the backend APIs ready for the Saturnalia companion app. Need someone to wire up React Navigation 7, secure token storage with Expo SecureStore, and clean splash screen transitions.',
        category: 'Mobile Apps',
        difficulty: 'intermediate',
        budget: 30.0,
        deadlineDays: 7,
        mode: 'online',
        targetDept: 'CSED',
      },
      {
        posterId: rohitId,
        type: 'gig',
        title: 'Format 8-Page Research Paper to IEEE Conference LaTeX Template',
        description:
          'Draft manuscript has been accepted for presentation. Need clean conversion from MS Word to IEEEtran LaTeX format, including subfigures, equation numbering, and BibTeX bibliography citations.',
        category: 'Research Help',
        difficulty: 'intermediate',
        budget: 20.0,
        deadlineDays: 4,
        mode: 'online',
        targetDept: 'CSED',
      },
      {
        posterId: ananyaId,
        type: 'gig',
        title: 'Create 3D Blender Assets & Banner for Thapar Saturnalia Tech Stage',
        description:
          'Looking for a 3D artist proficient in Blender to model a futuristic cyberpunk campus mascot. Assets must be rendered with transparent background and delivered as high-resolution PNGs.',
        category: 'Design & Creative',
        difficulty: 'intermediate',
        budget: 40.0,
        deadlineDays: 8,
        mode: 'hybrid',
        targetDept: 'SOM',
      },
      {
        posterId: nehaId,
        type: 'gig',
        title: 'One-on-One Tutoring: Discrete Mathematics & Graph Theory',
        description:
          'Need 3 tutoring sessions covering recurrence relations, Dijkstra algorithm proofs, and planar graphs before the mid-semester evaluation. Preference for someone with an A grade in CS Discrete Math.',
        category: 'Tutoring & Academics',
        difficulty: 'beginner',
        budget: 15.0,
        deadlineDays: 3,
        venue: 'Central Library Study Room 2',
        mode: 'in_person',
        targetDept: 'CSED',
      },
      {
        posterId: kabirId,
        type: 'gig',
        title: 'Dockerize Microservices Architecture & Write Compose File',
        description:
          'Containerize our Node.js auth service, Python recommendation engine, and Redis cache. Create a clean docker-compose.yml with healthchecks, environment files, and persistent volume mounts.',
        category: 'DevOps & Cloud',
        difficulty: 'advanced',
        budget: 25.0,
        deadlineDays: 6,
        mode: 'online',
        targetDept: 'CSED',
      },
    ]

    const openGigIds: string[] = []
    for (const g of openGigs) {
      const catId = catMap.get(g.category)!
      const deptId = g.targetDept ? deptMap.get(g.targetDept) : null
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO tasks (
           poster_id, listing_type, title, description, category_id, difficulty,
           budget, deadline, venue, mode, target_department_id, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, now() + ($8 || ' days')::interval, $9, $10, $11, 'open')
         RETURNING id`,
        [g.posterId, g.type, g.title, g.description, catId, g.difficulty, g.budget, g.deadlineDays, g.venue ?? null, g.mode, deptId],
      )
      openGigIds.push(rows[0].id)
    }

    // Add applicants to some open gigs
    // Priya & Ananya applied to Aarav's React Native gig (index 1)
    await client.query(
      `INSERT INTO applications (task_id, applicant_id, message, status) VALUES
       ($1, $2, 'I have built 4 production apps with React Navigation 7 and Expo SecureStore. Can deliver in 48 hours.', 'pending'),
       ($1, $3, 'Experienced with Expo UI and authentication state handling. Ready to collaborate!', 'pending')`,
      [openGigIds[1], priyaId, ananyaId],
    )

    // Kabir & Ananya applied to Rohit's IEEE LaTeX gig (index 2)
    await client.query(
      `INSERT INTO applications (task_id, applicant_id, message, status) VALUES
       ($1, $2, 'I have formatted 3 IEEE conference papers and have pre-built BibTeX automation scripts.', 'pending'),
       ($1, $3, 'Proficient in Overleaf and vector diagram inclusion. Can finish this weekend.', 'pending')`,
      [openGigIds[2], kabirId, ananyaId],
    )

    // Aarav applied to Neha's Tutoring gig (index 4)
    await client.query(
      `INSERT INTO applications (task_id, applicant_id, message, status)
       VALUES ($1, $2, 'Scored A+ in Discrete Math under Dr. Sharma. Happy to host sessions in the library.', 'pending')`,
      [openGigIds[4], aaravId],
    )

    // B. Multiple Realistic Workshops Hosted Across Roles
    console.log('🎓 Seeding realistic workshops across faculty, scholar, and student hosts...')

    const workshops = [
      {
        hostId: drSharmaId,
        title: 'Hands-on Workshop: Git, GitHub CI/CD & Open Source Workflows',
        description:
          'Learn practical industry Git techniques: interactive rebasing, merge conflict resolution, conventional commits, and setting up automated GitHub Actions CI/CD workflows for campus repositories.',
        category: 'GitHub & Open Source',
        difficulty: 'beginner',
        venue: 'LP-108 Auditorium',
        mode: 'in_person',
        startDays: 3,
        durationHours: 2,
        maxParticipants: 30,
        deptCode: 'CSED',
        attendees: [
          { id: aaravId, status: 'accepted' },
          { id: priyaId, status: 'accepted' },
          { id: ananyaId, status: 'accepted' },
          { id: rohitId, status: 'accepted' },
          { id: nehaId, status: 'accepted' },
          { id: kabirId, status: 'accepted' },
        ],
      },
      {
        hostId: drSharmaId,
        title: 'Industry Deep-Dive: Cloud Architecture with AWS & Docker',
        description:
          'Explore production cloud deployments. Topics include ECS Fargate containers, VPC networking, S3 static assets, and IAM role segregation for scalable university web services.',
        category: 'DevOps & Cloud',
        difficulty: 'intermediate',
        venue: 'CSED Advanced Lab 3',
        mode: 'in_person',
        startDays: 5,
        durationHours: 3,
        maxParticipants: 25,
        deptCode: 'CSED',
        attendees: [
          { id: rohitId, status: 'accepted' },
          { id: kabirId, status: 'accepted' },
          { id: nehaId, status: 'accepted' },
          { id: aaravId, status: 'pending' },
        ],
      },
      {
        hostId: rohitId,
        title: 'Mastering PyTorch: Deep Learning & Vision Transformers Hands-on',
        description:
          'Hands-on masterclass on building and fine-tuning Vision Transformers (ViT) on custom datasets using PyTorch Lightning, Mixed Precision training, and Weights & Biases telemetry.',
        category: 'Machine Learning',
        difficulty: 'advanced',
        venue: 'CSED Room 304 / Online Hybrid',
        mode: 'hybrid',
        startDays: 4,
        durationHours: 3,
        maxParticipants: 20,
        deptCode: 'CSED',
        attendees: [
          { id: aaravId, status: 'accepted' },
          { id: priyaId, status: 'accepted' },
          { id: kabirId, status: 'accepted' },
          { id: nehaId, status: 'accepted' },
          { id: ananyaId, status: 'pending' },
        ],
      },
      {
        hostId: priyaId,
        title: 'Figma to Code: Building Accessible Design Systems & Tokens',
        description:
          'A designer-developer bridge workshop: master Figma component properties, design token synchronization with Style Dictionary, and building accessible WCAG-compliant React component libraries.',
        category: 'Design & Creative',
        difficulty: 'intermediate',
        venue: 'LP-105 Design Lab',
        mode: 'in_person',
        startDays: 6,
        durationHours: 2,
        maxParticipants: 15,
        deptCode: 'ECED',
        attendees: [
          { id: ananyaId, status: 'accepted' },
          { id: aaravId, status: 'accepted' },
          { id: nehaId, status: 'accepted' },
          { id: kabirId, status: 'pending' },
        ],
      },
    ]

    const workshopIds: string[] = []
    for (const w of workshops) {
      const catId = catMap.get(w.category)!
      const deptId = deptMap.get(w.deptCode) || null
      const { rows: tRows } = await client.query<{ id: string }>(
        `INSERT INTO tasks (
           poster_id, listing_type, title, description, category_id, difficulty,
           venue, mode, starts_at, ends_at, max_participants, target_department_id, status
         ) VALUES (
           $1, 'workshop', $2, $3, $4, $5, $6, $7,
           now() + ($8 || ' days')::interval,
           now() + ($8 || ' days')::interval + ($9 || ' hours')::interval,
           $10, $11, 'open'
         ) RETURNING id`,
        [w.hostId, w.title, w.description, catId, w.difficulty, w.venue, w.mode, w.startDays, w.durationHours, w.maxParticipants, deptId],
      )
      const wId = tRows[0].id
      workshopIds.push(wId)

      for (const att of w.attendees) {
        await client.query(
          `INSERT INTO applications (task_id, applicant_id, message, status)
           VALUES ($1, $2, 'Excited to attend and participate actively!', $3)
           ON CONFLICT (task_id, applicant_id) DO NOTHING`,
          [wId, att.id, att.status],
        )
      }
    }

    // C. Academic Collaborative Projects
    const projects = [
      {
        posterId: nehaId,
        title: 'Autonomous Ground Vehicle (AGV) Team — ROS2 & LiDAR Mapping',
        description:
          'Building a campus autonomous delivery prototype using TurtleBot, ROS2 Galactic, and SLAM mapping. Looking for team members interested in sensor fusion and path-planning algorithms.',
        category: 'Technical (Other)',
        difficulty: 'advanced',
        budget: 50.0,
        deadlineDays: 14,
        venue: 'Robotics & Automation Lab',
        mode: 'in_person',
        deptCode: 'EIED',
      },
      {
        posterId: kabirId,
        title: 'Campus Food Delivery & Mess Queue Tracking App',
        description:
          'Collaborative project to build real-time queue estimation for hostel night canteens. Looking for a backend developer proficient in WebSockets and PostgreSQL query optimization.',
        category: 'Backend',
        difficulty: 'intermediate',
        budget: 30.0,
        deadlineDays: 10,
        mode: 'hybrid',
        deptCode: 'CSED',
      },
    ]

    for (const p of projects) {
      const catId = catMap.get(p.category)!
      const deptId = deptMap.get(p.deptCode) || null
      await client.query(
        `INSERT INTO tasks (
           poster_id, listing_type, title, description, category_id, difficulty,
           budget, deadline, venue, mode, target_department_id, status
         ) VALUES ($1, 'project', $2, $3, $4, $5, $6, now() + ($7 || ' days')::interval, $8, $9, $10, 'open')`,
        [p.posterId, p.title, p.description, catId, p.difficulty, p.budget, p.deadlineDays, p.venue ?? null, p.mode, deptId],
      )
    }

    // D. Mentorship Listings
    await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, target_department_id, status
       ) VALUES (
         $1, 'mentorship',
         'Placement Strategy: Cracking Product-Based SWE Interviews',
         '1-on-1 personalized 45-minute mentorship session: resume review, LeetCode roadmap strategy, and mock behavioral interview prep.',
         $2, 'beginner', 15.0, now() + interval '20 days', 'online', $3, 'open'
       ) RETURNING id`,
      [drSharmaId, catMap.get('Mentorship & Career')!, deptMap.get('CSED')!],
    )

    // E. Tasks With Active State Demonstrations

    // Scenario 1: Open Gig with 2 Competing Applicants (To demonstrate Accept / Cascading Rejection live!)
    const { rows: competingTask } = await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, status
       ) VALUES (
         $1, 'gig',
         'Optimize Next.js 15 Server Components & Image Caching',
         'Need a frontend expert to diagnose LCP issues and configure Next.js Image caching headers for our society portal.',
         $2, 'advanced', 30.0, now() + interval '5 days', 'online', 'open'
       ) RETURNING id`,
      [aaravId, catMap.get('Frontend')!],
    )
    const competingTaskId = competingTask[0].id
    await client.query(
      `INSERT INTO applications (task_id, applicant_id, message, status) VALUES
       ($1, $2, 'I have worked extensively with Next.js App Router and server actions. Can fix LCP in 24 hours.', 'pending'),
       ($1, $3, 'I can inspect your caching headers and bundle chunk sizes.', 'pending')`,
      [competingTaskId, priyaId, rohitId],
    )

    // Scenario 2: ASSIGNED Task (Escrow Held, Active Chat Thread)
    const { rows: assignedTask } = await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, worker_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, status
       ) VALUES (
         $1, $2, 'gig',
         'Design Responsive Landing Page for Robotics Society',
         'Figma designs are finalized. Need a responsive Tailwind CSS + React landing page with hero animation, member grid, and event timeline.',
         $3, 'intermediate', 25.0, now() + interval '3 days', 'online', 'assigned'
       ) RETURNING id`,
      [aaravId, priyaId, catMap.get('Frontend')!],
    )
    const assignedTaskId = assignedTask[0].id
    await client.query(
      `INSERT INTO transactions (task_id, from_user, amount, type)
       VALUES ($1, $2, 25.0, 'escrow_hold')`,
      [assignedTaskId, aaravId],
    )
    await client.query(
      `INSERT INTO messages (task_id, sender_id, content, created_at) VALUES
       ($1, $2, 'Hi Priya! Thanks for taking up the design task. The Figma link is in your email.', now() - interval '2 hours'),
       ($1, $3, 'Got it Aarav! Reviewing the components now. Will have the mobile responsive layout ready by tonight.', now() - interval '1 hour 45 minutes'),
       ($1, $2, 'Awesome, let me know if you need any asset exports or SVGs.', now() - interval '1 hour 30 minutes')`,
      [assignedTaskId, aaravId, priyaId],
    )

    // Scenario 2b: Second ASSIGNED Task (Kabir & Aarav)
    const { rows: assignedTask2 } = await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, worker_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, status
       ) VALUES (
         $1, $2, 'gig',
         'Implement Redis Caching Layer for Mess Queue Service',
         'Integrate Redis cache to store recent 5-minute queue depth estimates. Includes connection retry logic and TTL expiration.',
         $3, 'intermediate', 30.0, now() + interval '4 days', 'online', 'assigned'
       ) RETURNING id`,
      [kabirId, aaravId, catMap.get('Backend')!],
    )
    const assignedTaskId2 = assignedTask2[0].id
    await client.query(
      `INSERT INTO transactions (task_id, from_user, amount, type)
       VALUES ($1, $2, 30.0, 'escrow_hold')`,
      [assignedTaskId2, kabirId],
    )
    await client.query(
      `INSERT INTO messages (task_id, sender_id, content, created_at) VALUES
       ($1, $2, 'Hey Aarav, check out the mess queue branch on our GitHub repo. Redis configs are in .env.example.', now() - interval '4 hours'),
       ($1, $3, 'Started on it Kabir! Setting up redis cluster client and pipeline batches for the 5-min TTL.', now() - interval '3 hours 15 minutes'),
       ($1, $2, 'Sounds solid! Test with simulated load when ready.', now() - interval '2 hours')`,
      [assignedTaskId2, kabirId, aaravId],
    )

    // Scenario 3: SUBMITTED Task (Proof attached, Review & Complete button active for poster!)
    const { rows: submittedTask } = await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, worker_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, proof_url, status
       ) VALUES (
         $1, $2, 'gig',
         'Build REST API for Campus Room Booking with PostgreSQL',
         'Need Express.js routes for checking slot availability, preventing double-bookings, and filtering rooms by AC/projector capacity.',
         $3, 'intermediate', 30.0, now() + interval '2 days', 'online',
         'https://github.com/campusgigs-demo/room-booking-api', 'submitted'
       ) RETURNING id`,
      [aaravId, priyaId, catMap.get('Backend')!],
    )
    const submittedTaskId = submittedTask[0].id
    await client.query(
      `INSERT INTO transactions (task_id, from_user, amount, type)
       VALUES ($1, $2, 30.0, 'escrow_hold')`,
      [submittedTaskId, aaravId],
    )
    await client.query(
      `INSERT INTO messages (task_id, sender_id, content, created_at) VALUES
       ($1, $2, 'Hey Priya, how is the PostgreSQL room booking API coming along?', now() - interval '5 hours'),
       ($1, $3, 'All done! Added collision checks, indexed room_id and slot_time, and wrote full test suites. Submitting the PR now!', now() - interval '2 hours'),
       ($1, $3, 'Deliverables submitted with repository link. Please review!', now() - interval '1 hour')`,
      [submittedTaskId, aaravId, priyaId],
    )

    // Scenario 4: COMPLETED Tasks with Reviews & Ratings
    const completedTasks = [
      {
        posterId: rohitId,
        workerId: priyaId,
        title: 'Optimize PostgreSQL Queries & Indexes for Capstone Database',
        category: 'Backend',
        budget: 25.0,
        starsP: 5,
        reviewP: 'Fantastic work! Priya diagnosed our slow table scans, added B-tree indexes, and reduced query latency by 75%.',
        starsW: 5,
        reviewW: 'Clear schema documentation and prompt feedback. Pleasure working with Rohit!',
      },
      {
        posterId: aaravId,
        workerId: ananyaId,
        title: 'Figma to Tailwind CSS Component Conversion',
        category: 'Design & Creative',
        budget: 20.0,
        starsP: 5,
        reviewP: 'Pixel-perfect conversion and clean semantic HTML. Delivered a day ahead of the deadline.',
        starsW: 5,
        reviewW: 'Great communication and prompt escrow release. Would gladly collaborate again.',
      },
      {
        posterId: nehaId,
        workerId: priyaId,
        title: 'MATLAB DSP Signal Filtering & FFT Spectrum Analysis',
        category: 'Lab & Project Support',
        budget: 20.0,
        starsP: 5,
        reviewP: 'Very clear step-by-step comments in the .m script and helped explain the Butterworth filter cutoff.',
        starsW: 5,
        reviewW: 'Provided clean lab data files and was super helpful throughout.',
      },
      {
        posterId: kabirId,
        workerId: aaravId,
        title: 'Dockerize Node.js Auth Microservice with Healthchecks',
        category: 'DevOps & Cloud',
        budget: 25.0,
        starsP: 5,
        reviewP: 'Aarav set up lightweight Alpine containers and multistage builds. Bundle size cut by 60%!',
        starsW: 5,
        reviewW: 'Kabir had clean requirements and provided quick access to the testing server.',
      },
    ]

    for (const c of completedTasks) {
      const catId = catMap.get(c.category)!
      const { rows: compRow } = await client.query<{ id: string }>(
        `INSERT INTO tasks (
           poster_id, worker_id, listing_type, title, description, category_id, difficulty,
           budget, mode, status
         ) VALUES (
           $1, $2, 'gig', $3, 'Delivered and verified campus gig.',
           $4, 'intermediate', $5, 'online', 'completed'
         ) RETURNING id`,
        [c.posterId, c.workerId, c.title, catId, c.budget],
      )
      const cTaskId = compRow[0].id

      await client.query(
        `INSERT INTO transactions (task_id, from_user, to_user, amount, type) VALUES
         ($1, $2, null, $4, 'escrow_hold'),
         ($1, $2, $3, $4, 'escrow_release')`,
        [cTaskId, c.posterId, c.workerId, c.budget],
      )

      await client.query(
        `INSERT INTO reviews (task_id, reviewer_id, reviewee_id, stars, comment) VALUES
         ($1, $2, $3, $4, $5),
         ($1, $3, $2, $6, $7)`,
        [cTaskId, c.posterId, c.workerId, c.starsP, c.reviewP, c.starsW, c.reviewW],
      )
    }

    // Scenario 5: DISPUTED Task (For Teacher Demo of Admin Resolution Queue!)
    const { rows: disputedTask } = await client.query<{ id: string }>(
      `INSERT INTO tasks (
         poster_id, worker_id, listing_type, title, description, category_id, difficulty,
         budget, deadline, mode, status
       ) VALUES (
         $1, $2, 'gig',
         'Scrape Campus Course Catalog & Build Search API',
         'Build a Python script using BeautifulSoup and SQLite to index all Thapar elective descriptions.',
         $3, 'intermediate', 30.0, now() - interval '1 day', 'online', 'disputed'
       ) RETURNING id`,
      [kabirId, nehaId, catMap.get('Backend')!],
    )
    const disputedTaskId = disputedTask[0].id
    await client.query(
      `INSERT INTO transactions (task_id, from_user, amount, type)
       VALUES ($1, $2, 30.0, 'escrow_hold')`,
      [disputedTaskId, kabirId],
    )
    await client.query(
      `INSERT INTO disputes (task_id, raised_by, reason, status)
       VALUES ($1, $2, 'Submitted script crashes on pages with infinite scroll and documentation was omitted.', 'open')`,
      [disputedTaskId, kabirId],
    )
    await client.query(
      `INSERT INTO messages (task_id, sender_id, content, created_at) VALUES
       ($1, $2, 'Hi Neha, when I ran the scraper on elective codes, it crashed on the second page with unhandled IndexError.', now() - interval '1 day 4 hours'),
       ($1, $3, 'I tested it on the sample URLs from the syllabus portal. The DOM changed recently which is why it broke.', now() - interval '1 day 2 hours'),
       ($1, $2, 'We agreed on full pagination support. Submitting for admin arbitration to resolve fairly.', now() - interval '1 day')`,
      [disputedTaskId, kabirId, nehaId],
    )

    // 4. Realistic Notifications for ALL 7 Showcase Accounts
    console.log('🔔 Seeding comprehensive in-app notifications for all accounts...')

    const allNotifications = [
      // Aarav Sharma
      {
        userId: aaravId,
        type: 'work_submitted',
        isRead: false,
        timeAgo: '45 minutes',
        payload: { task_id: submittedTaskId, title: 'Build REST API for Campus Room Booking with PostgreSQL' },
      },
      {
        userId: aaravId,
        type: 'new_application',
        isRead: false,
        timeAgo: '2 hours',
        payload: { task_id: competingTaskId, title: 'Optimize Next.js 15 Server Components & Image Caching' },
      },
      {
        userId: aaravId,
        type: 'workshop_enrolled',
        isRead: false,
        timeAgo: '5 hours',
        payload: { task_id: workshopIds[0], title: 'Hands-on Workshop: Git, GitHub CI/CD & Open Source Workflows' },
      },
      {
        userId: aaravId,
        type: 'task_assigned',
        isRead: true,
        timeAgo: '1 day',
        payload: { task_id: assignedTaskId2, title: 'Implement Redis Caching Layer for Mess Queue Service' },
      },
      {
        userId: aaravId,
        type: 'review_received',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: 'Dockerize Node.js Auth Microservice with Healthchecks' },
      },

      // Priya Verma
      {
        userId: priyaId,
        type: 'task_assigned',
        isRead: false,
        timeAgo: '1 hour',
        payload: { task_id: assignedTaskId, title: 'Design Responsive Landing Page for Robotics Society' },
      },
      {
        userId: priyaId,
        type: 'new_application',
        isRead: false,
        timeAgo: '3 hours',
        payload: { task_id: workshopIds[3], title: 'Figma to Code: Building Accessible Design Systems' },
      },
      {
        userId: priyaId,
        type: 'workshop_enrolled',
        isRead: false,
        timeAgo: '6 hours',
        payload: { task_id: workshopIds[2], title: 'Mastering PyTorch: Deep Learning & Vision Transformers' },
      },
      {
        userId: priyaId,
        type: 'escrow_released',
        isRead: true,
        timeAgo: '1 day',
        payload: { title: 'Optimize PostgreSQL Queries & Indexes for Capstone Database' },
      },
      {
        userId: priyaId,
        type: 'review_received',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: '5-star rating received from Rohit Kumar' },
      },

      // Dr. Rajesh Sharma
      {
        userId: drSharmaId,
        type: 'new_dispute',
        isRead: false,
        timeAgo: '30 minutes',
        payload: { task_id: disputedTaskId, title: 'Scrape Campus Course Catalog & Build Search API' },
      },
      {
        userId: drSharmaId,
        type: 'new_application',
        isRead: false,
        timeAgo: '4 hours',
        payload: { task_id: workshopIds[0], title: '6 students registered for Git & GitHub Workflows' },
      },
      {
        userId: drSharmaId,
        type: 'workshop_enrolled',
        isRead: true,
        timeAgo: '1 day',
        payload: { task_id: workshopIds[1], title: 'Industry Deep-Dive: Cloud Architecture with AWS & Docker' },
      },
      {
        userId: drSharmaId,
        type: 'system_alert',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: 'Campus platform active: 16 listings, 4 workshops across CSED & ECED' },
      },

      // Rohit Kumar
      {
        userId: rohitId,
        type: 'new_application',
        isRead: false,
        timeAgo: '1 hour',
        payload: { task_id: workshopIds[2], title: '5 students registered for Mastering PyTorch Masterclass' },
      },
      {
        userId: rohitId,
        type: 'new_application',
        isRead: false,
        timeAgo: '3 hours',
        payload: { task_id: openGigIds[2], title: 'Format 8-Page Research Paper to IEEE LaTeX Template' },
      },
      {
        userId: rohitId,
        type: 'workshop_enrolled',
        isRead: true,
        timeAgo: '1 day',
        payload: { task_id: workshopIds[0], title: 'Hands-on Workshop: Git, GitHub CI/CD & Open Source' },
      },
      {
        userId: rohitId,
        type: 'review_received',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: 'Priya Verma left a 5-star review for your collaboration' },
      },

      // Ananya Patel
      {
        userId: ananyaId,
        type: 'workshop_enrolled',
        isRead: false,
        timeAgo: '2 hours',
        payload: { task_id: workshopIds[3], title: 'Confirmed registration for Figma to Code Workshop' },
      },
      {
        userId: ananyaId,
        type: 'new_application',
        isRead: false,
        timeAgo: '5 hours',
        payload: { task_id: openGigIds[3], title: 'Create 3D Blender Assets & Banner for Saturnalia' },
      },
      {
        userId: ananyaId,
        type: 'review_received',
        isRead: true,
        timeAgo: '1 day',
        payload: { title: 'Aarav Sharma left a 5-star review: Pixel-perfect conversion!' },
      },
      {
        userId: ananyaId,
        type: 'welcome_bonus',
        isRead: true,
        timeAgo: '3 days',
        payload: { title: 'Welcome to CampusGigs! 100 bonus credits added to your wallet.' },
      },

      // Neha Singh
      {
        userId: nehaId,
        type: 'new_dispute',
        isRead: false,
        timeAgo: '1 hour',
        payload: { task_id: disputedTaskId, title: 'Dispute opened on Scrape Campus Course Catalog' },
      },
      {
        userId: nehaId,
        type: 'workshop_enrolled',
        isRead: false,
        timeAgo: '4 hours',
        payload: { task_id: workshopIds[2], title: 'Confirmed seat for Mastering PyTorch Masterclass' },
      },
      {
        userId: nehaId,
        type: 'new_application',
        isRead: true,
        timeAgo: '1 day',
        payload: { task_id: openGigIds[4], title: 'Aarav Sharma applied for Discrete Mathematics Tutoring' },
      },
      {
        userId: nehaId,
        type: 'review_received',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: 'Priya Verma left a 5-star review for DSP filtering lab support' },
      },

      // Kabir Manchanda
      {
        userId: kabirId,
        type: 'new_dispute',
        isRead: false,
        timeAgo: '1 hour',
        payload: { task_id: disputedTaskId, title: 'Dispute submitted for Dr. Sharma arbitration' },
      },
      {
        userId: kabirId,
        type: 'task_assigned',
        isRead: false,
        timeAgo: '3 hours',
        payload: { task_id: assignedTaskId2, title: 'Aarav Sharma started work on Redis Caching Layer' },
      },
      {
        userId: kabirId,
        type: 'workshop_enrolled',
        isRead: true,
        timeAgo: '1 day',
        payload: { task_id: workshopIds[0], title: 'Confirmed seat for Git & GitHub Workflows' },
      },
      {
        userId: kabirId,
        type: 'review_received',
        isRead: true,
        timeAgo: '2 days',
        payload: { title: 'Aarav Sharma left a 5-star review: Clean requirements and quick setup!' },
      },
    ]

    for (const notif of allNotifications) {
      await client.query(
        `INSERT INTO notifications (user_id, type, payload, is_read, created_at)
         VALUES ($1, $2, $3, $4, now() - ($5 || ' ')::interval)`,
        [notif.userId, notif.type, JSON.stringify(notif.payload), notif.isRead, notif.timeAgo],
      )
    }

    await client.query('COMMIT')
    console.log('🎉 COMPREHENSIVE REALISTIC DEMO DATA SUCCESSFULLY SEEDED!')
    console.log(`- 7 Showcase Accounts with updated balances & avatars`)
    console.log(`- 4 Interactive Workshops (Faculty, Scholar, Top Freelancer hosted)`)
    console.log(`- 12+ Gigs across all lifecycle states (open, assigned, submitted, completed, disputed)`)
    console.log(`- Live chat message threads across assigned & disputed listings`)
    console.log(`- 32 Contextual in-app notifications with unread counts`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error seeding demo data:', err)
    throw err
  } finally {
    client.release()
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
