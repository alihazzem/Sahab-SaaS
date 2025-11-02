import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidImageStrict } from "@/lib/validate";
import prisma from "@/lib/prisma";
import { notifyUploadSuccess } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024; // 2MB for thumbnails/profile pics

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized Request" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Simple size check for thumbnails/profile pics
        if (file.size > MAX_THUMBNAIL_SIZE) {
            return NextResponse.json({ error: "Image too large. Max 2MB for thumbnails" }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!(await isValidImageStrict(buffer))) {
            return NextResponse.json({ error: "Uploaded file is not a valid image" }, { status: 400 });
        }

        const uploadResponse = await uploadToCloudinary(buffer, {
            folder: "Sahab-SaaS/profiles",
            resourceType: "image",
            // Optimize for thumbnails
            eager: [
                { width: 400, height: 400, crop: "limit", quality: "auto", format: "webp" }
            ]
        });

        // Extract width and height from response
        const width: number | null = typeof uploadResponse.width === "number" ? uploadResponse.width : null;
        const height: number | null = typeof uploadResponse.height === "number" ? uploadResponse.height : null;

        // Save thumbnail to database as 'image' type
        const savedMedia = await prisma.media.create({
            data: {
                userId,
                type: "image",
                title: file.name || "Thumbnail/Profile Image",
                description: "Thumbnail or profile image",
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url || "",
                originalSize: file.size,
                compressedSize: uploadResponse.bytes || file.size,
                duration: null,
                width,
                height,
                versions: {
                    thumbnail: uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url
                },
                optimized: true, // Thumbnails are pre-optimized
            },
        });

        console.log(`✅ Thumbnail saved to database with ID: ${savedMedia.id}`);

        // Send upload success notification
        try {
            await notifyUploadSuccess(userId, file.name || "Thumbnail", "image");
        } catch (notifError) {
            console.error("Failed to send upload notification:", notifError);
        }

        return NextResponse.json({
            id: savedMedia.id,
            publicId: uploadResponse.public_id,
            url: uploadResponse.secure_url ?? "",
            width,
            height,
            originalSize: file.size,
        }, { status: 200 });

    } catch (error) {
        console.error("Thumbnail upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
