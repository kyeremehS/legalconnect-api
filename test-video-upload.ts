/**
 * Test script to create a user, lawyer profile, and add a video URL for testing
 */

import { PrismaClient } from './generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestLawyerWithVideo() {
  try {
    console.log('Creating test lawyer with video...');

    // Create a user first
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test.lawyer@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        role: 'LAWYER',
        username: 'testlawyer'
      }
    });

    console.log('User created:', user.id);

    // Create lawyer profile with a video URL
    const lawyer = await prisma.lawyer.create({
      data: {
        userId: user.id,
        firm: 'Doe & Associates',
        location: 'Accra, Ghana',
        barAdmissionYear: '2020',
        experience: 5,
        practiceAreas: ['Family Law', 'Criminal Law'],
        education: 'University of Ghana School of Law',
        barAssociation: 'Ghana Bar Association',
        professionalSummary: 'Experienced lawyer specializing in family and criminal law.',
        languages: ['English', 'Twi'],
        specializations: ['Divorce proceedings', 'Criminal defense'],
        videoUrl: [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        ], // Test video URLs
        barCertificateUrl: [],
        practicingCertificateUrl: [],
        idDocumentUrl: [],
        cvResumeUrl: [],
        lawDegreeUrl: [],
        otherDocumentUrl: [],
        verificationStatus: 'VERIFIED',
        isVerified: true
      }
    });

    console.log('Lawyer created with videos:', lawyer.id);
    console.log('Video URLs:', lawyer.videoUrl);

    console.log('\n✅ Test lawyer with videos created successfully!');
    console.log('📧 Email: test.lawyer@example.com');
    console.log('🔐 Password: testpassword123');
    console.log('🎬 Videos:', lawyer.videoUrl.length);

  } catch (error) {
    console.error('Error creating test lawyer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestLawyerWithVideo();
