import { auth } from "@clerk/nextjs/server";
import { Prisma } from '@/generated/prisma'
import prisma from "@/lib/prisma";
import {
    createSuccessResponse,
    ApiErrors,
    logError
} from "@/lib/api-response";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ApiErrors.UNAUTHORIZED("Please sign in to view your media");
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") as "video" | "image" | null;

        // Validate type parameter if provided
        if (type && !["video", "image"].includes(type)) {
            return ApiErrors.BAD_REQUEST("Invalid media type. Must be 'video' or 'image'");
        }

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
                publicId: true,
                url: true,
                originalSize: true,
                compressedSize: true,
                duration: true,
                width: true,
                height: true,
                versions: true,
                createdAt: true,
                optimized: true,
            },
        });

        console.log(`Found ${media.length} media items for user ${userId}`);

        const responseData = {
            count: media.length,
            data: media,
            filters: {
                type: type || "all",
                userId
            }
        };

        return createSuccessResponse(
            responseData,
            media.length > 0 ?
                `Found ${media.length} media ${media.length === 1 ? 'file' : 'files'}` :
                "No media files found"
        );

    } catch (error) {
        logError("Media List API", error, "unknown");

        if (error instanceof Error) {
            // Handle database connection issues
            if (error.message.includes("connection") || error.message.includes("timeout")) {
                return ApiErrors.INTERNAL_ERROR("Database connection error. Please try again.");
            }
            // Handle Prisma specific errors
            if (error.message.includes("Prisma")) {
                return ApiErrors.INTERNAL_ERROR("Database query error. Please try again.");
            }
        }

        return ApiErrors.INTERNAL_ERROR("Failed to load media files. Please try again.");
    }
}
