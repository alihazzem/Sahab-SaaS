import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/uploadToCloudianry";
import { isValidImageStrict } from "@/lib/validate";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: "Image is too large. Max 5MB" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        if (!(await isValidImageStrict(buffer))) {
            return NextResponse.json({ error: "Uploaded file is not a valid image" }, { status: 400 });
        }

        const uploadResponse = await uploadToCloudinary(
            buffer,
            {
                folder: "cloudinary-saas/images",
                resourceType: "image",
            }
        );

        return NextResponse.json(
            {
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url,
                size: `${Math.round(file.size / 1024)} KB`,
            },
            { status: 200 });
    } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
