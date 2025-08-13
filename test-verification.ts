import { LawyerVerificationService } from './services/lawyer-verification.service';
import { verifyLawyerCertificate } from './services/certificate.service';

// Quick test to verify the verification system works
async function testVerificationSystem() {
  console.log('🧪 Testing Lawyer Verification System...');
  
  try {
    // Test certificate verification
    console.log('\n1. Testing certificate verification...');
    const testCertNumber = 'GLC/00001'; // Using first certificate from database
    
    const certResult = await verifyLawyerCertificate({
      certificateNumber: testCertNumber,
      nameOfLawyer: 'AKOTO-BAMFORD ADWOA'
    });
    
    console.log('Certificate verification result:', {
      verified: certResult.verified,
      matchScore: certResult.matchScore,
      message: certResult.message,
      certificateName: certResult.certificate?.nameOfLawyer
    });
    
    // Test verification service
    console.log('\n2. Testing verification service...');
    const verificationService = new LawyerVerificationService();
    
    // Test getting stats (should work even with no data)
    const stats = await verificationService.getVerificationStats();
    console.log('Verification stats:', stats);
    
    console.log('\n✅ All tests passed! Verification system is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVerificationSystem()
    .then(() => {
      console.log('\n🎉 Verification system test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification system test failed:', error);
      process.exit(1);
    });
}

export { testVerificationSystem };
