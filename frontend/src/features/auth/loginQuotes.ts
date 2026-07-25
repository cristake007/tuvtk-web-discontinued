export type LoginQuote = {
  text: string;
  attribution: string;
};

type WikiquoteCategoryMember = {
  pageid: number;
  ns: number;
  title: string;
};

type WikiquoteCategoryResponse = {
  query?: {
    categorymembers?: WikiquoteCategoryMember[];
  };
};

type WikiquotePage = {
  pageid: number;
  title: string;
  extract?: string;
  missing?: boolean;
};

type WikiquotePageResponse = {
  query?: {
    pages?: Record<string, WikiquotePage>;
  };
};

export const fallbackLoginQuotes: LoginQuote[] = [
  {
    text: "Victoria este principalul obiectiv al strategiei; dacă ea întârzie, resursele se consumă și moralul se macină.",
    attribution: "Sun Tzu",
  },
  {
    text: "Nu lucrurile în sine ne tulbură, ci părerile pe care ni le facem despre ele.",
    attribution: "Epictet",
  },
  {
    text: "Succesul nu este definitiv, iar eșecul nu este fatal; curajul de a continua este cel care contează.",
    attribution: "Principiu de leadership",
  },
];

const featuredAuthorTitles = [
  "Sun Tzu",
  "Marcus Aurelius",
  "Seneca",
  "Confucius",
  "Epictet",
  "Niccolò Machiavelli",
  "Platon",
  "Aristotel",
  "Socrate",
  "Lao Zi",
  "Miyamoto Musashi",
];

const excludedLinePattern = /^(bibliografie|categorie|citate|cuprins|despre|imagini|legături externe|note|referințe|surse|vezi și)\b/i;
const quoteSectionPattern = /^(aforisme|citate(?:\s+celebre)?|cugetări|maxime)$/i;
const wikiquoteApiBase = "https://ro.wikiquote.org/w/api.php";

function buildWikiquoteUrl(parameters: Record<string, string>): string {
  const url = new URL(wikiquoteApiBase);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    ...parameters,
  }).toString();
  return url.toString();
}

function cleanQuoteLine(line: string): string {
  return line
    .replace(/\[editare\]/gi, "")
    .replace(/^[\s*#:;–—-]+/, "")
    .replace(/^[„“\"]+|[”\"]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulQuote(line: string): boolean {
  if (line.length < 35 || line.length > 220) {
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

function extractQuotesFromPage(page: WikiquotePage): LoginQuote[] {
  if (!page.extract || page.missing) {
    return [];
  }

  const lines = page.extract
    .split(/\n+/)
    .map(cleanQuoteLine)
    .filter(Boolean);
  const sectionIndex = lines.findIndex((line) => quoteSectionPattern.test(line));
  const candidateLines = sectionIndex >= 0 ? lines.slice(sectionIndex + 1) : lines.slice(1);

  return candidateLines
    .filter(isUsefulQuote)
    .slice(0, 3)
    .map((text) => ({
      text,
      attribution: page.title,
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

async function fetchCategoryAuthors(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(
    buildWikiquoteUrl({
      list: "categorymembers",
      cmtitle: "Categorie:Filozofi",
      cmnamespace: "0",
      cmtype: "page",
      cmlimit: "50",
    }),
    {
      credentials: "omit",
      headers: { Accept: "application/json" },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Wikiquote category request failed: ${response.status}`);
  }

  const payload = (await response.json()) as WikiquoteCategoryResponse;
  return (payload.query?.categorymembers ?? []).map((member) => member.title);
}

async function fetchAuthorPages(
  authorTitles: string[],
  signal?: AbortSignal,
): Promise<WikiquotePage[]> {
  const response = await fetch(
    buildWikiquoteUrl({
      prop: "extracts",
      titles: authorTitles.join("|"),
      redirects: "1",
      explaintext: "1",
      exsectionformat: "plain",
    }),
    {
      credentials: "omit",
      headers: { Accept: "application/json" },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Wikiquote author request failed: ${response.status}`);
  }

  const payload = (await response.json()) as WikiquotePageResponse;
  return Object.values(payload.query?.pages ?? {});
}

export async function fetchRomanianLoginQuotes(
  signal?: AbortSignal,
): Promise<LoginQuote[]> {
  const categoryAuthors = await fetchCategoryAuthors(signal);
  const selectedAuthors = [
    ...featuredAuthorTitles,
    ...shuffle(categoryAuthors).slice(0, 14),
  ];
  const uniqueAuthorTitles = [...new Set(selectedAuthors)].slice(0, 24);
  const pages = await fetchAuthorPages(uniqueAuthorTitles, signal);
  const quotes = pages.flatMap(extractQuotesFromPage);
  const uniqueQuotes = [
    ...new Map(quotes.map((quote) => [quote.text, quote])).values(),
  ];

  if (uniqueQuotes.length === 0) {
    throw new Error("Wikiquote did not return usable professional quotes.");
  }

  return shuffle(uniqueQuotes).slice(0, 18);
}
