import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing image url", { status: 400 });
  }

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    return new Response("Failed to fetch image", {
      status: imageResponse.status,
    });
  }

  const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imageResponse.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
