const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Clan = require('../models/Clan');
const Session = require('../models/Session');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Clan.deleteMany({});
    await Session.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.insertMany([
      {
        username: 'testuser1',
        email: 'test1@example.com',
        password: hashedPassword,
        profile: {
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser1',
          bio: 'Love to study and compete!'
        },
        gamification: {
          totalPoints: 1500,
          currentHearts: 5,
          level: 3,
          streak: 7,
          lastHeartRegen: new Date()
        }
      },
      {
        username: 'testuser2',
        email: 'test2@example.com',
        password: hashedPassword,
        profile: {
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser2',
          bio: 'Focused learner'
        },
        gamification: {
          totalPoints: 2300,
          currentHearts: 4,
          level: 5,
          streak: 12,
          lastHeartRegen: new Date()
        }
      },
      {
        username: 'testuser3',
        email: 'test3@example.com',
        password: hashedPassword,
        profile: {
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser3',
          bio: 'Study warrior'
        },
        gamification: {
          totalPoints: 800,
          currentHearts: 5,
          level: 2,
          streak: 3,
          lastHeartRegen: new Date()
        }
      }
    ]);

    console.log(`✅ Created ${users.length} test users`);

    // Create test clan
    const clan = await Clan.create({
      name: 'Study Warriors',
      description: 'A clan for serious students who want to excel',
      leaderId: users[0]._id,
      inviteCode: 'TESTCLAN123',
      members: [
        { userId: users[0]._id, role: 'leader', contributionPoints: 1500 },
        { userId: users[1]._id, role: 'member', contributionPoints: 2300 },
        { userId: users[2]._id, role: 'member', contributionPoints: 800 }
      ],
      totalPoints: 4600,
      stats: {
        totalSessions: 15,
        totalStudyTime: 54000,
        avgConcentration: 0.78,
        memberCount: 3
      }
    });

    console.log('✅ Created test clan:', clan.name);

    // Update users with clan
    await User.updateMany(
      { _id: { $in: [users[0]._id, users[1]._id, users[2]._id] } },
      { clanId: clan._id }
    );

    // Create some test sessions
    const sessions = await Session.insertMany([
      {
        userId: users[0]._id,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 600000),
        duration: 3000,
        status: 'completed',
        analytics: {
          totalDistractions: 2,
          totalPauses: 1,
          blockedSiteAttempts: 0,
          avgConcentrationScore: 0.85,
          postureAlerts: 1,
          eyeTrackingAlerts: 3,
          totalProductiveTime: 2850
        },
        pointsEarned: 350,
        pointsLost: 25,
        netPoints: 325,
        tags: ['focused', 'productive']
      },
      {
        userId: users[1]._id,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 1800000),
        duration: 5400,
        status: 'completed',
        analytics: {
          totalDistractions: 1,
          totalPauses: 2,
          blockedSiteAttempts: 0,
          avgConcentrationScore: 0.92,
          postureAlerts: 0,
          eyeTrackingAlerts: 1,
          totalProductiveTime: 5200
        },
        pointsEarned: 580,
        pointsLost: 15,
        netPoints: 565,
        tags: ['deep work']
      }
    ]);

    console.log(`✅ Created ${sessions.length} test sessions`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    test1@example.com');
    console.log('Email:    test2@example.com');
    console.log('Email:    test3@example.com');
    console.log('Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Clan Invite Code: TESTCLAN123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
