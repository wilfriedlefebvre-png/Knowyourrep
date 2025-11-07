import { NextResponse } from "next/server";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json(
      { error: "Missing title parameter" },
      { status: 400 }
    );
  }

  const url =
    `${WIKI_API}?action=query` +
    `&format=json` +
    `&prop=pageimages|extracts` +
    `&exintro=1&explaintext=1` +
    `&redirects=1` +
    `&piprop=thumbnail&pithumbsize=300` +
    `&titles=${encodeURIComponent(title)}`;

  const res = await fetch(url, {
    // MediaWiki requires a UA for heavy usage; good habit:
    headers: {
      "User-Agent": "KnowYourRepsApp/1.0 (contact: your-email@example.com)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: "Wikipedia API error", details: errText },
      { status: res.status }
    );
  }

  const data = await res.json();
  const pages = data?.query?.pages || {};
  const firstKey = Object.keys(pages)[0];
  const page = pages[firstKey];

  if (!page || page.missing) {
    return NextResponse.json(
      { error: "Page not found" },
      { status: 404 }
    );
  }

  const result = {
    title: page.title,
    summary: page.extract || "",
    image: page.thumbnail?.source || null,
    url: `https://en.wikipedia.org/?curid=${page.pageid}`,
  };

  return NextResponse.json(result);
}

