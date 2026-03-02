const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let resourceType = "raw";

        if (file.mimetype.startsWith("image/")) {
            resourceType = "image";
        } else if (file.mimetype.startsWith("video/")) {
            resourceType = "video";
        } else if (file.mimetype === "application/pdf") {
            // PDFs work best as 'auto' or 'image' in Cloudinary to allow previews and proper handling
            resourceType = "auto";
        }

        // IMPORTANT: For 'raw' files, Cloudinary MUST have the extension in the public_id.
        const fileName = file.originalname;
        const public_id = `${Date.now()}-${fileName}`;

        console.log(`Uploading ${fileName} as ${resourceType}`);

        return {
            folder: "veloxchat",
            resource_type: resourceType,
            public_id: public_id,
            format: null,
            access_mode: "public",
        };
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

module.exports = upload;
