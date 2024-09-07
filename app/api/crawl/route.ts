import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@libsql/client';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const inputSchema = z.object({
  url: z.string().url(),
  limit: z.number().int().min(1).max(100).default(10),
});

// Define the type for pageData
interface PageData {
  metadata?: {
    sourceURL?: string;
    linksOnPage?: string[];
  };
}

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await rateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Input validation
  const body = await request.json();
  const result = inputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { url, limit } = result.data;

  try {
    // Check cache
    const cachedResult = await db.execute({
      sql: 'SELECT content FROM crawled_results WHERE url = ? AND expires_at > CURRENT_TIMESTAMP',
      args: [url],
    });

    if (cachedResult.rows.length > 0) {
      return NextResponse.json({ scrapedContent: JSON.parse(cachedResult.rows[0].content as string) });
    }

    // Crawl and scrape
    const crawlResult = await app.crawlUrl(url, { limit });
    console.log('Crawl result:', JSON.stringify(crawlResult, null, 2));

    if ('error' in crawlResult) {
      throw new Error(crawlResult.error);
    }

    if (!crawlResult.data || !Array.isArray(crawlResult.data)) {
      throw new Error('Unexpected crawl result structure');
    }

    const urlsToScrape = crawlResult.data.flatMap((pageData: PageData) => {
      const sourceUrl = pageData.metadata?.sourceURL;
      const linksOnPage = pageData.metadata?.linksOnPage || [];
      return sourceUrl ? [sourceUrl, ...linksOnPage] : linksOnPage;
    });

    const scrapedContent = await Promise.all(
      urlsToScrape.map(async (url: string) => {
        let retries = 3;
        while (retries > 0) {
          try {
            const response = await app.scrapeUrl(url, {
              formats: ['markdown'],
              onlyMainContent: true,
              waitFor: 5000,
            });
            if ('error' in response) {
              throw new Error(response.error);
            }
            return {
              url,
              markdown: response.markdown,
            };
          } catch (error) {
            console.error(`Error scraping ${url}, retries left: ${retries - 1}`, error);
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          }
        }
      })
    );

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days
    await db.execute({
      sql: 'INSERT INTO crawled_results (url, content, expires_at) VALUES (?, ?, ?)',
      args: [url, JSON.stringify(scrapedContent), expiresAt.toISOString()],
    });

    return NextResponse.json({ scrapedContent });
  } catch (error) {
    console.error('Error during crawl and scrape:', error);
    return NextResponse.json({ error: 'Failed to crawl and scrape' }, { status: 500 });
  }
}