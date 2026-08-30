"use client";

import { useState, FormEvent } from "react";
import type { ImageResult } from "./api/search/route";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "검색에 실패했습니다.");
        return;
      }

      setResults(data.results ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            이미지 검색
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            자연어로 원하는 이미지를 설명해 보세요. (예: 가을 느낌의 산책로)
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-3 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </form>

        {error && (
          <p className="max-w-xl text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {results.length > 0 && (
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {results.map((item, i) => (
              <a
                key={i}
                href={item.contextLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2 overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnailLink}
                  alt={item.title}
                  className="aspect-square w-full rounded object-cover"
                  loading="lazy"
                />
                <div className="flex flex-col gap-0.5 px-1 pb-1">
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {item.title}
                  </span>
                  <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-500">
                    {item.displayLink}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <p className="text-sm text-zinc-500">검색 버튼을 눌러 결과를 확인하세요.</p>
        )}
      </main>
    </div>
  );
}
