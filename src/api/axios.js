import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("PROD URL:", import.meta.env.VITE_API_BASE_URL);

// Helper to fetch all pages from a paginated API (DRF style)
export async function fetchAll(endpoint, params = {}) {
  const results = [];
  try {
    let resp = await api.get(endpoint, { params });

    // If the API already returns an array, return it directly
    if (Array.isArray(resp.data)) return resp.data;

    // If there's a results field, collect it and follow `next` links
    const firstChunk = Array.isArray(resp.data.results)
      ? resp.data.results
      : Array.isArray(resp.data.items)
        ? resp.data.items
        : [];

    results.push(...firstChunk);

    let next = resp.data.next;
    while (next) {
      // `next` may be an absolute URL
      const pageResp = await axios.get(next);
      const chunk = Array.isArray(pageResp.data.results)
        ? pageResp.data.results
        : Array.isArray(pageResp.data)
          ? pageResp.data
          : [];
      results.push(...chunk);
      next = pageResp.data.next;
    }
  } catch (err) {
    // If something went wrong, rethrow so callers can handle/log
    throw err;
  }

  return results;
}

export default api;

// import axios from "axios";

// const isDevelopment = import.meta.env.MODE === "development";

// const myBaseURL = isDevelopment
//   ? import.meta.env.VITE_API_BASE_URL
//   : import.meta.env.VITE_API_BASE_URL_DEPLOY;

// const api = axios.create({
//   baseURL: myBaseURL,
//   timeout: 5000,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   accept: "application/json",
//   withCredentials: false, // No login yet
// });

// export default api;
