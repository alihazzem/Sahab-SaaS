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
    validateFileSize,
    validateFileType
} from "@/lib/api-response";

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

        // Get user's current subscription and plan
        const subscription = await prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            include: { plan: true }
        });

        const currentPlan = subscription?.plan || await prisma.plan.findFirst({
            where: { name: 'Free' }
        });

        if (!currentPlan) {
            logError("Video Upload", new Error("No plan found for user"), userId);
            return ApiErrors.INTERNAL_ERROR("Unable to determine user plan");
        }

        // Validate file size against plan limit
        const maxSizeMB = currentPlan.maxUploadSize;
        if (!validateFileSize(file, maxSizeMB)) {
            return ApiErrors.FILE_TOO_LARGE(
                `${maxSizeMB}MB (${currentPlan.name} plan limit)`
            );
        }

        // Get or create current month usage
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

        // Check storage limit
        const storageLimit = currentPlan.storageLimit * 1024 * 1024; // Convert MB to bytes
        if (usage.storageUsed + file.size > storageLimit) {
            const usedMB = Math.round(usage.storageUsed / (1024 * 1024));
            return ApiErrors.QUOTA_EXCEEDED(
                "Storage",
                usedMB,
                currentPlan.storageLimit
            );
        }

        // Check transformations limit (video processing creates 3 versions)
        const transformationsNeeded = 3; // 1080p, 720p, 480p
        const canProcessVideo = usage.transformationsUsed + transformationsNeeded <= currentPlan.transformationsLimit;

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
        const transformationsUsed = canProcessVideo ? transformationsNeeded : 0;
        await prisma.usageTracking.update({
            where: { id: usage.id },
            data: {
                storageUsed: usage.storageUsed + file.size,
                transformationsUsed: usage.transformationsUsed + transformationsUsed,
                uploadsCount: usage.uploadsCount + 1
            }
        });

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
                storageLimit: storageLimit,
                transformationsUsed: usage.transformationsUsed + transformationsUsed,
                transformationsLimit: currentPlan.transformationsLimit
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
