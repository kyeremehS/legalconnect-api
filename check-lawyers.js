const { PrismaClient } = require('./generated/prisma');

async function checkLawyers() {
  const prisma = new PrismaClient();
  
  try {
    const lawyers = await prisma.user.findMany({ 
      where: { role: 'LAWYER' } 
    });
    
    console.log('Available Lawyers in Database:');
    lawyers.forEach(l => {
      console.log(`- ID: ${l.id}`);
      console.log(`  Name: ${l.fullName}`);
      console.log(`  Email: ${l.email}`);
      console.log('');
    });
    
    console.log(`Total: ${lawyers.length} lawyers found`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLawyers();
