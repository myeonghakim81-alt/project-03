import { NextRequest, NextResponse } from "next/server";

const GOOGLE_SEARCH_ENDPOINT = "https://www.googleapis.com/customsearch/v1";

export type ImageResult = {
  title: string;
  link: string;
  thumbnailLink: string;
  contextLink: string;
  displayLink: string;
  mime: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "검색어(q)를 입력해 주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    return NextResponse.json(
      {
        error:
          "서버에 GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX 환경변수가 설정되지 않았습니다. .env.local을 확인해 주세요.",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    searchType: "image",
    num: "10",
    safe: "active",
  });

  try {
    const res = await fetch(`${GOOGLE_SEARCH_ENDPOINT}?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message ?? "Google Custom Search API 호출에 실패했습니다.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const items: ImageResult[] = (data.items ?? []).map(
      (item: {
        title: string;
        link: string;
        image?: { thumbnailLink?: string; contextLink?: string };
        displayLink: string;
        mime: string;
      }) => ({
        title: item.title,
        link: item.link,
        thumbnailLink: item.image?.thumbnailLink ?? item.link,
        contextLink: item.image?.contextLink ?? item.link,
        displayLink: item.displayLink,
        mime: item.mime,
      })
    );

    return NextResponse.json({ query, results: items });
  } catch {
    return NextResponse.json(
      { error: "검색 중 알 수 없는 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
