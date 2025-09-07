import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidVideo } from "@/lib/validate";
import { CloudinaryUploadResult } from "@/types";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

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
        if (file.size > MAX_VIDEO_SIZE)
            return NextResponse.json({ error: "Video too large. Max 100MB" }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!isValidVideo(buffer))
            return NextResponse.json({ error: "Uploaded file is not a valid video" }, { status: 400 });

        // Upload to Cloudinary with multiple resolutions, async
        const uploadResponse: CloudinaryUploadResult = await uploadToCloudinary(buffer, {
            folder: "cloudinary-saas/videos",
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
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
