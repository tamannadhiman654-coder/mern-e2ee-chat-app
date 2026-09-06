export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    next(error);
  }
};