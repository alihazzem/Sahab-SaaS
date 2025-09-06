import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidImageStrict } from "@/lib/validate";
import prisma from "@/lib/prisma";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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

        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "Image is too large. Max 5MB" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!(await isValidImageStrict(buffer))) {
            return NextResponse.json({ error: "Uploaded file is not a valid image" }, { status: 400 });
        }

        // Upload to Cloudinary
        const uploadResponse = await uploadToCloudinary(buffer, {
            folder: "cloudinary-saas/images",
            resourceType: "image",
        });

        // Extract width and height from response if available
        const width: number | null = typeof uploadResponse.width === "number" ? uploadResponse.width : null;
        const height: number | null = typeof uploadResponse.height === "number" ? uploadResponse.height : null;


        // Save in DB
        const savedMedia = await prisma.media.create({
            data: {
                userId,
                type: "image",
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url ?? "",
                originalSize: file.size,
                width,
                height,
                optimized: true,
            },
        });

        return NextResponse.json({
            id: savedMedia.id,
            publicId: savedMedia.publicId,
            url: savedMedia.url,
            width: savedMedia.width,
            height: savedMedia.height,
            originalSize: savedMedia.originalSize,
        }, { status: 200 });

    } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
