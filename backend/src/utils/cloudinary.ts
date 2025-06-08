import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'element-adega',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
});

export const upload = multer({ storage: storage });

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.path, {
      folder: 'element-adega'
    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result?.secure_url || '');
      }
    });
  });
}; 