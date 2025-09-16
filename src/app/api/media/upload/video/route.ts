import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidVideo } from "@/lib/validate";
import { CloudinaryUploadResult } from "@/types";
import {
    createSuccessResponse,
    ApiErrors,
    logError,
    validateFileType
} from "@/lib/api-response";
import {
    checkStorageLimit,
    checkFileSizeLimit,
    checkTransformationLimit
} from "@/lib/usage-limits";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ApiErrors.UNAUTHORIZED("Please sign in to upload videos");
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string | null;
        const description = formData.get("description") as string | null;

        // Validate required fields
        if (!file) {
            return ApiErrors.BAD_REQUEST("No video file provided");
        }
        if (!title?.trim()) {
            return ApiErrors.BAD_REQUEST("Video title is required");
        }

        // Validate file type
        if (!validateFileType(file, ["video/"])) {
            return ApiErrors.INVALID_FILE_TYPE(["MP4", "AVI", "MOV", "MKV", "WebM"]);
        }

        // Check file size limit based on user's plan
        const fileSizeCheck = await checkFileSizeLimit(userId, file.size);
        if (!fileSizeCheck.isValid) {
            return ApiErrors.FILE_TOO_LARGE(fileSizeCheck.reason || "File too large for your plan");
        }

        // Check storage limit before upload
        const storageCheck = await checkStorageLimit(userId, file.size);
        if (!storageCheck.canUpload) {
            return ApiErrors.QUOTA_EXCEEDED(
                "Storage",
                Math.round(storageCheck.usage?.current || 0),
                Math.round(storageCheck.usage?.limit || 0)
            );
        }

        // Check transformation limits for video processing
        const transformationCheck = await checkTransformationLimit(userId, 3);
        const canProcessVideo = transformationCheck.canProcess;

        // Create usage tracking entry if needed (for now, we'll use current storage usage)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        let usage = await prisma.usageTracking.findFirst({
            where: { userId, month: currentMonth, year: currentYear }
        });

        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    userId,
                    month: currentMonth,
                    year: currentYear,
                    storageUsed: 0,
                    transformationsUsed: 0,
                    uploadsCount: 0
                }
            });
        }

        if (!canProcessVideo) {
            console.log(`⚠️ Transformations exhausted. Uploading raw video only for user ${userId}`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!isValidVideo(buffer)) {
            return ApiErrors.VALIDATION_ERROR("Invalid video file format");
        }

        // Upload to Cloudinary with conditional processing
        const uploadResponse: CloudinaryUploadResult = await uploadToCloudinary(buffer, {
            folder: "Sahab-SaaS/videos",
            resourceType: "video",
            ...(canProcessVideo && {
                eager: [
                    { width: 1920, height: 1080, crop: "limit", format: "mp4", quality: "auto" },
                    { width: 1280, height: 720, crop: "limit", format: "mp4", quality: "auto" },
                    { width: 854, height: 480, crop: "limit", format: "mp4", quality: "auto" },
                ],
                eager_async: true, // async processing
            })
        });

        if (!uploadResponse?.secure_url) {
            logError("Video Upload", new Error("Cloudinary upload failed"), userId);
            return ApiErrors.UPLOAD_FAILED("Failed to upload to cloud storage");
        }

        // Create versions map (only if processing was done)
        const versions: Record<string, string> = {};
        if (canProcessVideo && uploadResponse.eager) {
            uploadResponse.eager.forEach(v => {
                if (!v.width || !v.secure_url) return;
                if (v.width >= 1920) versions["1080p"] = v.secure_url;
                else if (v.width >= 1280) versions["720p"] = v.secure_url;
                else if (v.width >= 854) versions["480p"] = v.secure_url;
            });
        }

        // Save metadata in Prisma
        const savedMedia = await prisma.media.create({
            data: {
                userId,
                type: "video",
                title: title.trim(),
                description: description?.trim() || null,
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url,
                versions,
                originalSize: file.size,
                compressedSize: uploadResponse.eager?.[0]?.bytes ?? null,
                duration: Math.round(uploadResponse.duration ?? 0),
                optimized: canProcessVideo,
            },
        });

        // Update usage tracking (only count transformations if processing was done)
        const transformationsNeeded = 3; // 1080p, 720p, 480p
        const transformationsUsed = canProcessVideo ? transformationsNeeded : 0;
        await prisma.usageTracking.update({
            where: { id: usage.id },
            data: {
                storageUsed: usage.storageUsed + file.size,
                transformationsUsed: usage.transformationsUsed + transformationsUsed,
                uploadsCount: usage.uploadsCount + 1
            }
        });

        // Get plan limits for response
        const planLimits = await import('@/lib/plan-limits').then(m => m.PLAN_LIMITS.FREE);

        const responseData = {
            id: savedMedia.id,
            title: savedMedia.title,
            description: savedMedia.description,
            publicId: savedMedia.publicId,
            url: savedMedia.url,
            originalSize: savedMedia.originalSize,
            compressedSize: savedMedia.compressedSize,
            duration: savedMedia.duration,
            versions, // 1080p/720p/480p URLs (empty if no processing)
            optimized: canProcessVideo,
            processingNote: canProcessVideo ?
                "Video processed with multiple resolutions" :
                "Raw upload only - transformation limits exceeded",
            usage: {
                storageUsed: usage.storageUsed + file.size,
                storageLimit: planLimits.storageLimit * 1024 * 1024, // Convert MB to bytes
                transformationsUsed: usage.transformationsUsed + transformationsUsed,
                transformationsLimit: planLimits.transformationsLimit
            }
        };

        const successMessage = canProcessVideo ?
            "Video uploaded and optimized successfully!" :
            "Video uploaded successfully (processing skipped due to plan limits)";

        return createSuccessResponse(responseData, successMessage);

    } catch (error) {
        logError("Video Upload API", error, "unknown");

        if (error instanceof Error) {
            // Handle specific error types
            if (error.message.includes("File too large")) {
                return ApiErrors.FILE_TOO_LARGE("100MB");
            }
            if (error.message.includes("quota") || error.message.includes("limit")) {
                return ApiErrors.QUOTA_EXCEEDED("Upload", 0, 0);
            }
        }

        return ApiErrors.INTERNAL_ERROR("Failed to upload video. Please try again.");
    }
}
