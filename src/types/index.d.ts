export interface CloudinaryEagerResult {
    bytes?: number;
    url?: string;
    secure_url?: string;
    public_id?: string;
    format?: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
}

export interface CloudinaryUploadResult {
    asset_id?: string;
    public_id: string;
    bytes?: number;
    secure_url?: string;
    format?: string;
    duration?: number;
    eager?: CloudinaryEagerResult[];
    [key: string]: unknown;
}

export interface CloudinaryEagerTransformation {
    width?: number;
    height?: number;
    crop?: "limit" | "scale" | "fit" | "fill";
    format?: string;
    quality?: string | number;
    [key: string]: string | number | undefined;
}

export interface UploadOptions {
    folder: string;
    resourceType?: "image" | "video" | "raw";
    eager?: CloudinaryEagerTransformation[];
}
