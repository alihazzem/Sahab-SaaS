import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidVideo } from "@/lib/validate";
import { CloudinaryUploadResult } from "@/types";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string | null;
        const description = formData.get("description") as string | null;

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        if (!file.type.startsWith("video/"))
            return NextResponse.json({ error: "Uploaded file is not a video" }, { status: 400 });

        // Get user's current subscription and plan
        const subscription = await prisma.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            include: { plan: true }
        });

        const currentPlan = subscription?.plan || await prisma.plan.findFirst({
            where: { name: 'Free' }
        });

        if (!currentPlan) {
            return NextResponse.json({ error: "No plan found" }, { status: 500 });
        }

        // Check file size against plan limit
        const maxFileSize = currentPlan.maxUploadSize * 1024 * 1024; // Convert MB to bytes
        if (file.size > maxFileSize) {
            return NextResponse.json({
                error: `Video too large. Max ${currentPlan.maxUploadSize}MB for ${currentPlan.name} plan`
            }, { status: 413 });
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
            return NextResponse.json({
                error: `Storage limit exceeded. Used ${Math.round(usage.storageUsed / (1024 * 1024))}MB of ${currentPlan.storageLimit}MB. Upgrade your plan for more storage.`
            }, { status: 413 });
        }

        // Check transformations limit (video processing creates 3 versions)
        const transformationsNeeded = 3; // 1080p, 720p, 480p
        if (usage.transformationsUsed + transformationsNeeded > currentPlan.transformationsLimit) {
            return NextResponse.json({
                error: `Transformation limit exceeded. Used ${usage.transformationsUsed} of ${currentPlan.transformationsLimit} transformations. Upgrade your plan for more transformations.`
            }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!isValidVideo(buffer))
            return NextResponse.json({ error: "Uploaded file is not a valid video" }, { status: 400 });

        // Upload to Cloudinary with multiple resolutions, async
        const uploadResponse: CloudinaryUploadResult = await uploadToCloudinary(buffer, {
            folder: "SkyMedia-SaaS/videos",
            resourceType: "video",
            eager: [
                { width: 1920, height: 1080, crop: "limit", format: "mp4", quality: "auto" },
                { width: 1280, height: 720, crop: "limit", format: "mp4", quality: "auto" },
                { width: 854, height: 480, crop: "limit", format: "mp4", quality: "auto" },
            ],
            eager_async: true, // async processing
        });

        // Create versions map
        const versions: Record<string, string> = {};
        uploadResponse.eager?.forEach(v => {
            if (!v.width || !v.secure_url) return;
            if (v.width >= 1920) versions["1080p"] = v.secure_url;
            else if (v.width >= 1280) versions["720p"] = v.secure_url;
            else if (v.width >= 854) versions["480p"] = v.secure_url;
        });

        // Save metadata in Prisma
        const savedMedia = await prisma.media.create({
            data: {
                userId,
                type: "video",
                title,
                description,
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url!,
                versions,
                originalSize: file.size,
                compressedSize: uploadResponse.eager?.[0]?.bytes ?? null,
                duration: Math.round(uploadResponse.duration ?? 0),
                optimized: true,
            },
        });

        // Update usage tracking
        await prisma.usageTracking.update({
            where: { id: usage.id },
            data: {
                storageUsed: usage.storageUsed + file.size,
                transformationsUsed: usage.transformationsUsed + transformationsNeeded,
                uploadsCount: usage.uploadsCount + 1
            }
        });

        return NextResponse.json(
            {
                id: savedMedia.id,
                title: savedMedia.title,
                description: savedMedia.description,
                publicId: savedMedia.publicId,
                url: savedMedia.url,
                originalSize: savedMedia.originalSize,
                compressedSize: savedMedia.compressedSize,
                duration: savedMedia.duration,
                versions, // 1080p/720p/480p URLs
                usage: {
                    storageUsed: usage.storageUsed + file.size,
                    storageLimit: storageLimit,
                    transformationsUsed: usage.transformationsUsed + transformationsNeeded,
                    transformationsLimit: currentPlan.transformationsLimit
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
