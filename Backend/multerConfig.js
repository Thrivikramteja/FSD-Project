const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";

    if (req.body.userRole == "Carehome") {
      folder += "Carehomes";
    } else if (req.body.userRole == "NGO") {
      if (req.body.type === "event") {
        folder += "Events";
      } else if (req.body.type === "fundraiser") {
        folder += "Fundraisers";
      }
    }
    
    // Ensure the path is constructed correctly relative to the current directory
    cb(null, path.join(__dirname, "public", folder));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

module.exports = upload;