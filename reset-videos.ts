import prisma from './prisma/prismaClient';

async function resetVideoData() {
  try {
    console.log('🧹 Starting video data reset...');
    
    // Delete all video interactions first (due to foreign key constraints)
    const deletedViews = await prisma.videoView.deleteMany();
    console.log(`✅ Deleted ${deletedViews.count} video views`);
    
    const deletedComments = await prisma.videoComment.deleteMany();
    console.log(`✅ Deleted ${deletedComments.count} video comments`);
    
    const deletedLikes = await prisma.videoLike.deleteMany();
    console.log(`✅ Deleted ${deletedLikes.count} video likes`);
    
    // Delete all videos
    const deletedVideos = await prisma.video.deleteMany();
    console.log(`✅ Deleted ${deletedVideos.count} videos`);
    
    // Reset lawyer video URLs
    const updatedLawyers = await prisma.lawyer.updateMany({
      data: {
        videoUrl: []
      }
    });
    console.log(`✅ Reset video URLs for ${updatedLawyers.count} lawyers`);
    
    console.log('🎉 Video data reset completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Upload a new video through the frontend');
    console.log('   2. Test video interactions');
    
  } catch (error) {
    console.error('❌ Error resetting video data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Destructive dev utility — only run when explicitly invoked, never on import.
// Usage: npx ts-node reset-videos.ts (with NODE_ENV=development)
if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to reset video data in production.');
    process.exit(1);
  }
  resetVideoData();
}
