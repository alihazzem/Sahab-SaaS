import cloudinary from "@/lib/cloudinary";
import { CloudinaryUploadResult } from "@/types";
import { UploadOptions } from "@/types";

export async function uploadToCloudinary(
    buffer: Buffer,
    options: UploadOptions
): Promise<CloudinaryUploadResult> {
    const { folder, resourceType = "image", eager } = options;

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                eager,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result as CloudinaryUploadResult);
            }
        ).end(buffer);
    });
}
