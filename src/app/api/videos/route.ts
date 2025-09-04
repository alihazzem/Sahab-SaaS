import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const allVideos = await prisma.video.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(allVideos);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}
