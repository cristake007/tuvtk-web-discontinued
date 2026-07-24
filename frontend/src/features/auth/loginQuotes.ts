export type LoginQuote = {
  text: string;
  attribution: string;
  sourceUrl: string;
};

type WikiquotePage = {
  pageid: number;
  title: string;
  extract?: string;
};

type WikiquoteResponse = {
  query?: {
    pages?: Record<string, WikiquotePage>;
  };
};

export const fallbackLoginQuotes: LoginQuote[] = [
  {
    text: "Calitatea nu este un act, ci un obicei.",
    attribution: "Principiu de lucru",
    sourceUrl: "https://ro.wikiquote.org/",
  },
  {
    text: "Încrederea se construiește prin consecvență, claritate și responsabilitate.",
    attribution: "Principiu de lucru",
    sourceUrl: "https://ro.wikiquote.org/",
  },
  {
    text: "Îmbunătățirea continuă începe cu atenția acordată fiecărui detaliu.",
    attribution: "Principiu de lucru",
    sourceUrl: "https://ro.wikiquote.org/",
  },
];

const excludedLinePattern = /^(bibliografie|categorie|citate|cuprins|despre|imagini|legături externe|note|referințe|surse|vezi și)\b/i;
const wikiquoteApiUrl = new URL("https://ro.wikiquote.org/w/api.php");

wikiquoteApiUrl.search = new URLSearchParams({
  action: "query",
  format: "json",
  generator: "random",
  grnlimit: "12",
  grnnamespace: "0",
  origin: "*",
  prop: "extracts",
  explaintext: "1",
  exsectionformat: "plain",
}).toString();

function cleanQuoteLine(line: string): string {
  return line
    .replace(/\[editare\]/gi, "")
    .replace(/^[\s*#:;–—-]+/, "")
    .replace(/^[„“\"]+|[”\"]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulQuote(line: string): boolean {
  if (line.length < 45 || line.length > 240) {
    return false;
  }

  if (
    excludedLinePattern.test(line) ||
    line.endsWith(":") ||
    /https?:\/\/|ISBN|Wikimedia|Wikiquote/i.test(line)
  ) {
    return false;
  }

  return /[.!?…]$/.test(line);
}

function quotePageUrl(pageId: number): string {
  return `https://ro.wikiquote.org/?curid=${pageId}`;
}

function extractQuotesFromPage(page: WikiquotePage): LoginQuote[] {
  if (!page.extract) {
    return [];
  }

  return page.extract
    .split(/\n+/)
    .map(cleanQuoteLine)
    .filter(isUsefulQuote)
    .slice(0, 2)
    .map((text) => ({
      text,
      attribution: page.title,
      sourceUrl: quotePageUrl(page.pageid),
    }));
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const replacementIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[replacementIndex]] = [
      shuffled[replacementIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export async function fetchRomanianLoginQuotes(
  signal?: AbortSignal,
): Promise<LoginQuote[]> {
  const response = await fetch(wikiquoteApiUrl, {
    credentials: "omit",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Wikiquote request failed: ${response.status}`);
  }

  const payload = (await response.json()) as WikiquoteResponse;
  const pages = Object.values(payload.query?.pages ?? {});
  const quotes = pages.flatMap(extractQuotesFromPage);
  const uniqueQuotes = [
    ...new Map(quotes.map((quote) => [quote.text, quote])).values(),
  ];

  if (uniqueQuotes.length === 0) {
    throw new Error("Wikiquote did not return usable Romanian quotes.");
  }

  return shuffle(uniqueQuotes).slice(0, 10);
}
