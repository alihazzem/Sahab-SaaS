import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id)
            return NextResponse.json({ error: "Media ID is required" }, { status: 400 });

        // Find media in DB to get type and publicId
        const media = await prisma.media.findUnique({ where: { id } });
        if (!media)
            return NextResponse.json({ error: "Media not found" }, { status: 404 });

        if (media.userId !== userId)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Delete from Cloudinary
        const resourceType = media.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType });

        // Delete from database
        await prisma.media.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} deleted successfully`,
        });
    } catch (error: unknown) {
        console.error("Media delete error:", error);
        let message = "Failed to delete media";
        if (error instanceof Error) message = error.message;
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
