export interface Review {
  author: string;
  rating: number;
  date: string;
  body: string;
  sourceUrl: string;
}

export interface RatingSummary {
  ratingValue: number;
  reviewCount: number;
}

export interface GoogleReviewsResponse {
  reviews: Review[];
  ratingSummary: RatingSummary;
  businessName: string;
}

/**
 * Fetches Google reviews from the Netlify serverless function
 */
export async function fetchGoogleReviews(): Promise<GoogleReviewsResponse> {
  try {
    const response = await fetch('/.netlify/functions/get-google-reviews');

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    throw error;
  }
}
