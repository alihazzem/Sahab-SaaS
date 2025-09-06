import sharp from "sharp";

export async function isValidImageStrict(buffer: Buffer): Promise<boolean> {
    try {
        await sharp(buffer).metadata(); // tries to read image metadata
        return true;                     // if succeeds, it’s a valid image
    } catch {
        return false;                    // invalid image or corrupted
    }
}

export function isValidVideo(buffer: Buffer): boolean {
    if (buffer.length < 12) return false;

    const hex = buffer.toString("hex", 0, 12);

    const mp4Signature = "66747970";
    const webmSignature = "1a45dfa3";

    if (hex.includes(mp4Signature)) return true;
    if (hex.includes(webmSignature)) return true;

    return false;
}
