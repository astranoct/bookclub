import { BookData } from "@/types/BookData";
import { SearchResult } from "@/types/searchResult";

const headers = new Headers({
  "User-Agent": "BookClubApp/1.0 (boosterlongstrong@gmail.com)"
});

// export async function fetchBookTitleAndCover(title:string): Promise<[JSON, string]> {
//   try {
//     const response = await fetch('https://openlibrary.org/search.json?q=' + title, { headers });
//     const data = await response.json();
//     return [data.docs[0], `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`];
//   } catch (error) {
//     console.error('Error fetching book data:', error);
//     throw error;
//   }
// }

// export async function fetchBookData(query:string): Promise<BookData> {
//   try {
//     const response = await fetch('https://openlibrary.org/search.json?q=' + query, { headers });
//     const data = await response.json();
//     const bookData = data.docs[0];

//     return {
//       title: bookData.title,
//       author: bookData.author_name[0],
//       coverId: bookData.cover_i,
//       pageCount: bookData.number_of_pages_median,
//       publishDate: bookData.first_publish_year,
//       ratingsAverage: bookData.ratings_average.toFixed(2),
//     }
//   }
//   catch (error) {
//     console.error('Error fetching book data:', error);
//     throw error;
//   }
// }

export async function searchForBook(query:string): Promise<SearchResult> {
  try {
    const response = await fetch('https://openlibrary.org/search.json?q=' + query, { headers });
    const data = await response.json();
    const bookData = data.docs[0];
    const numberOfResults = data.docs.length;
    const numberOfShownResults = numberOfResults > 5 ? 5 : numberOfResults;
    return {
      mostLikelyResult: {
        title: bookData.title,
        author: bookData?.author_name[0],
        coverId: bookData.cover_i,
        pageCount: bookData?.number_of_pages_median,
        publishDate: bookData?.first_publish_year,
        ratingsAverage: bookData.ratings_average ? bookData.ratings_average.toFixed(2) : 0,
      },
      possibleResults: data.docs.slice(1, numberOfShownResults).map((data: any) => {
        return {
          title: data.title,
          author: data?.author_name[0],
          coverId: data.cover_i,
          pageCount: data?.number_of_pages_median,
          publishDate: data?.first_publish_year,
          ratingsAverage: data.ratings_average ? data.ratings_average.toFixed(2) : 0,
        };
      }),
    }
  }
  catch (error) {
    console.error('Error fetching book data:', error);
    throw error;
  }
}