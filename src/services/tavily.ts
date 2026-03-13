const TAVILY_API_KEY = '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';
const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
}

export async function searchCaliforniaDivorceInfo(query: string): Promise<TavilySearchResponse> {
  const enhancedQuery = `${query} California divorce family law site:.ca.gov OR site:courts.ca.gov`;
  
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: enhancedQuery,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
        include_domains: [
          'courts.ca.gov',
          'selfhelp.courts.ca.gov',
          'calbar.ca.gov',
          'childsup.courts.ca.gov',
          'leginfo.legislature.ca.gov',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      query: data.query,
      results: data.results || [],
      answer: data.answer,
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    return {
      query,
      results: [],
    };
  }
}

export async function searchCourtForms(formType: string): Promise<TavilySearchResult[]> {
  const query = `California divorce ${formType} court forms FL- site:courts.ca.gov/documents`;
  
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 10,
        include_domains: ['courts.ca.gov'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Court forms search error:', error);
    return [];
  }
}

export async function getLatestCaseLaw(topic: string): Promise<TavilySearchResult[]> {
  const query = `California ${topic} divorce case law appellate decision 2020-2024`;
  
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_domains: [
          'courts.ca.gov',
          'leginfo.legislature.ca.gov',
          'scholar.google.com',
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Case law search error:', error);
    return [];
  }
}
