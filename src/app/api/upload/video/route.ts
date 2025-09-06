import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidVideo } from "@/lib/validate";
import prisma from "@/lib/prisma";
import { formatSize, formatDuration } from "@/utils/format";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string | null;
        const description = formData.get("description") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!file.type.startsWith("video/")) {
            return NextResponse.json({ error: "Uploaded file is not a video" }, { status: 400 });
        }

        if (file.size > MAX_VIDEO_SIZE) {
            return NextResponse.json({ error: "Video is too large. Max 100MB" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        if (!isValidVideo(buffer)) {
            return NextResponse.json({ error: "Uploaded file is not a valid video" }, { status: 400 });
        }

        const uploadResponse = await uploadToCloudinary(
            buffer,
            {
                folder: "cloudinary-saas/videos",
                resourceType: "video",
                eager: [
                    {
                        width: 1280,
                        height: 720,
                        crop: "limit",
                        format: "mp4",
                        quality: "auto",
                    },
                ],
            });

        const originalSize = formatSize(file.size);
        const compressedSize = formatSize(uploadResponse.eager?.[0]?.bytes ?? file.size);
        const duration = uploadResponse.duration != null
            ? formatDuration(uploadResponse.duration)
            : "0s";



        const savedVideo = await prisma.video.create({
            data: {
                title,
                description,
                publicId: uploadResponse.public_id,
                originalSize,
                compressedSize,
                duration,
            },
        });

        return NextResponse.json(
            {
                id: savedVideo.id,
                title: savedVideo.title,
                description: savedVideo.description,
                publicId: savedVideo.publicId,
                originalSize: savedVideo.originalSize,
                compressedSize: savedVideo.compressedSize,
                duration: savedVideo.duration,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
