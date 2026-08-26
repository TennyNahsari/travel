const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Helper to get absolute path from relative upload path
const getFilePath = (relativeUrl) => {
  if (!relativeUrl) return null;
  // Strip leading slash if needed
  const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
  return path.join(process.cwd(), cleanPath);
};

// Get current QRIS settings
const getQris = async (req, res) => {
  try {
    let qris = await prisma.qrisSetting.findFirst();
    if (!qris) {
      qris = {
        id: null,
        accountName: 'PT Travel Shuttle Indonesia',
        imageUrl: null,
        instruction: 'Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)',
        bankBca: '123-456-7890 (a.n. PT Travel Shuttle Indonesia)',
        bankMandiri: '987-000-112233 (a.n. PT Travel Shuttle Indonesia)',
        bankOther: '',
        waNumber: '6281234567890',
        isActive: true
      };
    }
    res.json({
      success: true,
      data: qris
    });
  } catch (error) {
    console.error('Error fetching QRIS setting:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil informasi QRIS'
    });
  }
};

// Create or Update QRIS settings
const updateQris = async (req, res) => {
  try {
    const { accountName, instruction, bankBca, bankMandiri, bankOther, waNumber, imageBase64, imageName } = req.body;

    let existingQris = await prisma.qrisSetting.findFirst();
    let imageUrl = existingQris ? existingQris.imageUrl : null;

    // Handle image upload if base64 data provided
    if (imageBase64) {
      // 1. Delete previous file from disk if it exists
      if (existingQris && existingQris.imageUrl) {
        const oldFilePath = getFilePath(existingQris.imageUrl);
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`Deleted old QRIS image file: ${oldFilePath}`);
          } catch (err) {
            console.error('Failed to delete old QRIS image file:', err);
          }
        }
      }

      // 2. Process new base64 image
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = 'png';

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('svg')) ext = 'svg';
      } else {
        // Raw base64 string without data prefix
        buffer = Buffer.from(imageBase64, 'base64');
      }

      const uploadDir = path.join(process.cwd(), 'uploads', 'qris');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `qris_${Date.now()}.${ext}`;
      const savePath = path.join(uploadDir, fileName);
      fs.writeFileSync(savePath, buffer);

      imageUrl = `/uploads/qris/${fileName}`;
    }

    // Save to database
    let result;
    if (existingQris) {
      result = await prisma.qrisSetting.update({
        where: { id: existingQris.id },
        data: {
          accountName: accountName !== undefined ? accountName : existingQris.accountName,
          instruction: instruction !== undefined ? instruction : existingQris.instruction,
          bankBca: bankBca !== undefined ? bankBca : existingQris.bankBca,
          bankMandiri: bankMandiri !== undefined ? bankMandiri : existingQris.bankMandiri,
          bankOther: bankOther !== undefined ? bankOther : existingQris.bankOther,
          waNumber: waNumber !== undefined ? waNumber : existingQris.waNumber,
          imageUrl: imageUrl,
          isActive: true
        }
      });
    } else {
      result = await prisma.qrisSetting.create({
        data: {
          accountName: accountName || 'PT Travel Shuttle Indonesia',
          instruction: instruction || 'Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)',
          bankBca: bankBca || '123-456-7890 (a.n. PT Travel Shuttle Indonesia)',
          bankMandiri: bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle Indonesia)',
          bankOther: bankOther || '',
          waNumber: waNumber || '6281234567890',
          imageUrl: imageUrl,
          isActive: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Pengaturan QRIS berhasil diperbarui',
      data: result
    });
  } catch (error) {
    console.error('Error updating QRIS setting:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal memperbarui pengaturan QRIS'
    });
  }
};

// Delete QRIS (Delete image file from disk and clear imageUrl from DB)
const deleteQris = async (req, res) => {
  try {
    const existingQris = await prisma.qrisSetting.findFirst();
    if (!existingQris) {
      return res.status(404).json({
        success: false,
        error: 'Data QRIS belum dikonfigurasi'
      });
    }

    // Delete image file from server disk if present
    if (existingQris.imageUrl) {
      const filePath = getFilePath(existingQris.imageUrl);
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted QRIS image file: ${filePath}`);
        } catch (err) {
          console.error('Failed to delete QRIS image file:', err);
        }
      }
    }

    // Reset imageUrl in DB
    const updated = await prisma.qrisSetting.update({
      where: { id: existingQris.id },
      data: {
        imageUrl: null
      }
    });

    res.json({
      success: true,
      message: 'Gambar QRIS berhasil dihapus',
      data: updated
    });
  } catch (error) {
    console.error('Error deleting QRIS image:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus gambar QRIS'
    });
  }
};

module.exports = {
  getQris,
  updateQris,
  deleteQris
};
