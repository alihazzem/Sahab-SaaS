import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from '@/generated/prisma'
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") as "video" | "image" | null;

        // Prisma's findMany accepts MediaWhereInput directly
        const whereClause: Prisma.MediaWhereInput = {
            userId,
            ...(type ? { type } : {}),
        };

        const media = await prisma.media.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                type: true,
                title: true,
                description: true,
                originalSize: true,
                compressedSize: true,
                duration: true,
                versions: true,
            },
        });

        return NextResponse.json({
            success: true,
            count: media.length,
            data: media,
        });
    } catch (error) {
        console.error("Media fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
