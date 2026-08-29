const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get current Social Media settings
const getSocialSettings = async (req, res) => {
  try {
    let social = await prisma.socialSetting.findFirst();
    if (!social) {
      social = {
        id: null,
        instagramUrl: 'https://instagram.com',
        twitterUrl: 'https://twitter.com',
        youtubeUrl: 'https://youtube.com',
        facebookUrl: 'https://facebook.com',
        linkedinUrl: 'https://linkedin.com',
        threadsUrl: 'https://threads.net',
        isActive: true
      };
    }
    res.json({
      success: true,
      data: social
    });
  } catch (error) {
    console.error('Error fetching social media setting:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil informasi media sosial'
    });
  }
};

// Create or Update Social Media settings
const updateSocialSettings = async (req, res) => {
  try {
    const { instagramUrl, twitterUrl, youtubeUrl, facebookUrl, linkedinUrl, threadsUrl } = req.body;

    let existingSocial = await prisma.socialSetting.findFirst();

    let result;
    if (existingSocial) {
      result = await prisma.socialSetting.update({
        where: { id: existingSocial.id },
        data: {
          instagramUrl: instagramUrl !== undefined ? instagramUrl : existingSocial.instagramUrl,
          twitterUrl: twitterUrl !== undefined ? twitterUrl : existingSocial.twitterUrl,
          youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : existingSocial.youtubeUrl,
          facebookUrl: facebookUrl !== undefined ? facebookUrl : existingSocial.facebookUrl,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : existingSocial.linkedinUrl,
          threadsUrl: threadsUrl !== undefined ? threadsUrl : existingSocial.threadsUrl,
          isActive: true
        }
      });
    } else {
      result = await prisma.socialSetting.create({
        data: {
          instagramUrl: instagramUrl || 'https://instagram.com',
          twitterUrl: twitterUrl || 'https://twitter.com',
          youtubeUrl: youtubeUrl || 'https://youtube.com',
          facebookUrl: facebookUrl || 'https://facebook.com',
          linkedinUrl: linkedinUrl || 'https://linkedin.com',
          threadsUrl: threadsUrl || 'https://threads.net',
          isActive: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Pengaturan Media Sosial berhasil diperbarui',
      data: result
    });
  } catch (error) {
    console.error('Error updating social media setting:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal memperbarui pengaturan media sosial'
    });
  }
};

module.exports = {
  getSocialSettings,
  updateSocialSettings
};
