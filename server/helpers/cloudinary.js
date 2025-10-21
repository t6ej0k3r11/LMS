const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

//configure with env data
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = async (filePath) => {
  try {
    // Check if Cloudinary is properly configured (not using placeholder values)
    if (process.env.CLOUDINARY_API_KEY === "your_cloudinary_api_key") {
      // Use local storage instead
      return await uploadMediaLocally(filePath);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Error uploading to cloudinary");
  }
};

const uploadMediaLocally = async (filePath) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = `file_${Date.now()}_${path.basename(filePath)}`;
    const localPath = path.join(uploadsDir, fileName);

    // Copy file to local uploads directory
    fs.copyFileSync(filePath, localPath);

    // Get the actual port the server is running on
    const PORT =
      parseInt(process.env.ACTUAL_SERVER_PORT, 10) ||
      parseInt(process.env.PORT, 10) ||
      5000;

    // Return local file info in similar format to Cloudinary
    return {
      public_id: fileName,
      secure_url: `http://localhost:${PORT}/uploads/${fileName}`,
      url: `http://localhost:${PORT}/uploads/${fileName}`,
      format: path.extname(filePath).slice(1),
      bytes: fs.statSync(localPath).size,
      width: null,
      height: null,
      local: true,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error uploading locally");
  }
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    // Check if this is a local file
    if (publicId && publicId.includes && publicId.includes("file_")) {
      // Delete local file
      const filePath = path.join(__dirname, "../uploads", publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
    throw new Error("failed to delete assest from cloudinary");
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
