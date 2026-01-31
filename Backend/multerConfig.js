const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";

    if (req.body.userRole === "Carehome") {
      folder = path.join(folder, "Carehomes");
    } else if (req.body.userRole === "NGO") {
      if (req.body.type === "event") {
        folder = path.join(folder, "Events");
      } else if (req.body.type === "fundraiser") {
        folder = path.join(folder, "Fundraisers");
      }
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