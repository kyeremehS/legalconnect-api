import { PrismaClient, UserRole } from './generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create sample users first
    const hashedPassword = await bcrypt.hash('lawyer123', 10);

    const sampleUsers = [
      {
        firstName: 'Ama',
        lastName: 'Kwarteng',
        username: 'ama_kwarteng',
        email: 'ama@kwartenglaw.com',
        role: UserRole.LAWYER,
        password: hashedPassword
      },
      {
        firstName: 'Kwame',
        lastName: 'Mensah',
        username: 'kwame_mensah',
        email: 'kwame@mensahlegal.com',
        role: UserRole.LAWYER, 
        password: hashedPassword
      },
      {
        firstName: 'Kojo',
        lastName: 'Asante',
        username: 'kojo_asante',
        email: 'kojo@asantelaw.com',
        role: UserRole.LAWYER,
        password: hashedPassword
      }
    ];

    const createdUsers = [];
    for (const user of sampleUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: user
        });
        createdUsers.push(newUser);
        console.log(`Created user: ${user.firstName} ${user.lastName}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${user.firstName} ${user.lastName}`);
      }
    }

    // Create sample lawyers
    const sampleLawyers = [
      {
        userId: createdUsers[0].id,
        professionalSummary: 'Legal practitioner specializing in corporate and commercial matters with over 15 years of experience.',
        firm: 'Kwarteng & Associates',
        location: 'Accra',
        barAdmissionYear: '2008',
        experience: 15,
        practiceAreas: ['Corporate Law', 'Commercial Litigation', 'Contract Law'],
        education: 'University of Ghana School of Law, LLB (2007)',
        barAssociation: 'Ghana Bar Association',
        website: 'www.kwartenglaw.com',
        specializations: ['Mergers & Acquisitions', 'Securities Law', 'International Trade'],
        languages: ['English', 'Twi', 'French']
      },
      {
        userId: createdUsers[1].id,
        professionalSummary: 'Experienced property and land law specialist with focus on real estate transactions and land disputes.',
        firm: 'Mensah Legal Consultancy',
        location: 'Kumasi',
        barAdmissionYear: '2011',
        experience: 12,
        practiceAreas: ['Land Law', 'Property Law', 'Real Estate'],
        education: 'KNUST Faculty of Law, LLB (2010)',
        barAssociation: 'Ghana Bar Association',
        specializations: ['Land Disputes', 'Property Transactions', 'Real Estate Development'],
        languages: ['English', 'Twi', 'Fante']
      },
      {
        userId: createdUsers[2].id,
        professionalSummary: 'Criminal defense attorney and constitutional law expert with focus on human rights advocacy.',
        firm: 'Asante Legal Services',
        location: 'Accra',
        barAdmissionYear: '2010',
        experience: 13,
        practiceAreas: ['Criminal Law', 'Constitutional Law', 'Human Rights'],
        education: 'University of Ghana School of Law, LLB (2009), LLM Constitutional Law (2012)',
        barAssociation: 'Ghana Bar Association',
        website: 'www.asantelaw.com',
        specializations: ['Criminal Defense', 'Constitutional Litigation', 'Human Rights Advocacy'],
        languages: ['English', 'Twi', 'Ga']
      }
    ];

    for (const lawyer of sampleLawyers) {
      const existingLawyer = await prisma.lawyer.findUnique({
        where: { userId: lawyer.userId }
      });

      if (!existingLawyer) {
        await prisma.lawyer.create({
          data: lawyer
        });
        console.log(`Created lawyer profile for user: ${lawyer.userId}`);
      } else {
        console.log(`Lawyer profile already exists for user: ${lawyer.userId}`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
