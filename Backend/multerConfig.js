const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";
    
    const routePath = req.path || '';
    if (routePath.includes('event')) {
      folder = path.join(folder, "Events");
    } else if (routePath.includes('fundraiser')) {
      folder = path.join(folder, "Fundraisers");
    } else if (routePath.includes('carehome')) {
      folder = path.join(folder, "Carehomes");
    }

    const targetDir = path.join(__dirname, "public", folder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

module.exports = upload;