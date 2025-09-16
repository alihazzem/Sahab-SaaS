import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidImageStrict } from "@/lib/validate";
import prisma from "@/lib/prisma";
import {
    createSuccessResponse,
    ApiErrors,
    logError,
    validateFileSize,
    validateFileType
} from "@/lib/api-response";

const MAX_IMAGE_SIZE_MB = 5; // 5MB for supporting images

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ApiErrors.UNAUTHORIZED("Please sign in to upload images");
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string | null;
        const description = formData.get("description") as string | null;

        // Validate required fields
        if (!file) {
            return ApiErrors.BAD_REQUEST("No image file provided");
        }
        if (!title?.trim()) {
            return ApiErrors.BAD_REQUEST("Image title is required");
        }

        // Validate file type
        if (!validateFileType(file, ["image/"])) {
            return ApiErrors.INVALID_FILE_TYPE(["JPEG", "PNG", "WebP", "GIF"]);
        }

        // Validate file size (5MB limit for images)
        if (!validateFileSize(file, MAX_IMAGE_SIZE_MB)) {
            return ApiErrors.FILE_TOO_LARGE(`${MAX_IMAGE_SIZE_MB}MB`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!(await isValidImageStrict(buffer))) {
            return ApiErrors.VALIDATION_ERROR("Invalid image file format");
        }

        // Upload to Cloudinary
        const uploadResponse = await uploadToCloudinary(buffer, {
            folder: "Sahab-SaaS/images",
            resourceType: "image",
        });

        if (!uploadResponse?.secure_url) {
            logError("Image Upload", new Error("Cloudinary upload failed"), userId);
            return ApiErrors.UPLOAD_FAILED("Failed to upload to cloud storage");
        }

        // Extract width and height from response if available
        const width: number | null = typeof uploadResponse.width === "number" ? uploadResponse.width : null;
        const height: number | null = typeof uploadResponse.height === "number" ? uploadResponse.height : null;

        // Save to database
        const savedMedia = await prisma.media.create({
            data: {
                userId,
                type: "image",
                title: title.trim(),
                description: description?.trim() || null,
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url,
                originalSize: file.size,
                compressedSize: uploadResponse.bytes || file.size,
                duration: null,
                width,
                height,
                versions: {},
                optimized: false,
            },
        });

        console.log(`✅ Image saved to database with ID: ${savedMedia.id}`);

        const responseData = {
            id: savedMedia.id,
            title: savedMedia.title,
            description: savedMedia.description,
            publicId: uploadResponse.public_id,
            url: uploadResponse.secure_url,
            width,
            height,
            originalSize: file.size,
            compressedSize: uploadResponse.bytes || file.size,
        };

        return createSuccessResponse(responseData, "Image uploaded successfully!");

    } catch (error) {
        logError("Image Upload API", error, "unknown");

        if (error instanceof Error) {
            // Handle specific error types
            if (error.message.includes("File too large")) {
                return ApiErrors.FILE_TOO_LARGE("5MB");
            }
            if (error.message.includes("Invalid image")) {
                return ApiErrors.VALIDATION_ERROR("Invalid image format");
            }
        }

        return ApiErrors.INTERNAL_ERROR("Failed to upload image. Please try again.");
    }
}
