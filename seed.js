require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const db = require("./db");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/animeCharacters";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Curated YouTube Video IDs for top anime characters to use as high-quality fallbacks
const CURATED_VIDEOS = {
  "Satoru Gojo": "M25zXPxF8HY",
  "Gojou": "M25zXPxF8HY",
  "Levi": "SP7T5bU5hUY",
  "Eren": "SP7T5bU5hUY",
  "Mikasa": "SP7T5bU5hUY",
  "Lelouch": "v-AGjx0N3y4",
  "Luffy": "S8_YwFLCh4U",
  "Zoro": "S8_YwFLCh4U",
  "Naruto": "QczGoHcXtOc",
  "Kakashi": "QczGoHcXtOc",
  "Itachi": "QczGoHcXtOc",
  "Light Yagami": "8y60_jH6U0M",
  "L Lawliet": "8y60_jH6U0M",
  "Edward Elric": "W29H5rW8z1w",
  "Killua": "dopTsz_907I",
  "Guts": "qP7sK2mXq6k",
  "Saitama": "5N4b84kL45M",
  "Emilia": "c3X1mS9O_4Y",
  "Kurisu": "uMYhjVlaY1I",
  "Makima": "v4yJOo_39DY",
  "Thorfinn": "f8JrG4K23y8",
  "Reigen": "191Z41Xv_xQ",
  "Mai Sakurajima": "8Ovxv614b8U"
};

// Fallback video ID for other characters
const DEFAULT_VIDEO_ID = "S8_YwFLCh4U"; // Official Netflix One Piece trailer (guaranteed embed)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromAniList() {
  console.log("Fetching characters from AniList...");
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        characters (sort: FAVOURITES_DESC) {
          id
          name {
            full
            native
          }
          image {
            large
          }
          description
          gender
          favourites
          media (type: ANIME, sort: POPULARITY_DESC) {
            nodes {
              title {
                english
                romaji
                userPreferred
              }
              trailer {
                id
                site
              }
            }
          }
        }
      }
    }
  `;

  const variables = { page: 1, perPage: 50 };

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API request failed with status: ${response.status}`);
  }

  const result = await response.json();
  return result.data.Page.characters;
}

async function fetchJikanData(characterName) {
  try {
    // Jikan search endpoint
    const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(characterName)}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Jikan rate limit hit. Retrying after 2 seconds...");
        await sleep(2000);
        return fetchJikanData(characterName);
      }
      return null;
    }
    const result = await response.json();
    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error(`Error fetching from Jikan for ${characterName}:`, error.message);
    return null;
  }
}

async function fetchJikanPictures(malId) {
  try {
    const url = `https://api.jikan.moe/v4/characters/${malId}/pictures`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        await sleep(2000);
        return fetchJikanPictures(malId);
      }
      return [];
    }
    const result = await response.json();
    if (result.data) {
      return result.data.map(p => p.jpg.image_url).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching pictures from Jikan for MAL ID ${malId}:`, error.message);
    return [];
  }
}

async function searchYoutubeWithoutKey(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.error("Error scraping YouTube search:", error.message);
  }
  return null;
}

async function fetchYoutubeVideo(characterName, seriesName) {
  // 1. Try to search YouTube keyless for character specific moments first!
  try {
    console.log(`Searching YouTube keyless for character showcase: ${characterName} (${seriesName})`);
    const query = `${characterName} ${seriesName} showcase moments compilation`;
    const videoId = await searchYoutubeWithoutKey(query);
    if (videoId) {
      console.log(`  Found character video ID: ${videoId}`);
      return videoId;
    }
  } catch (err) {
    console.error(`Keyless YouTube search failed for ${characterName}:`, err.message);
  }

  // 2. Fallback to API Key search if configured
  if (YOUTUBE_API_KEY) {
    try {
      const query = `${characterName} ${seriesName} moments compilation`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=1`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.items && result.items.length > 0) {
          return result.items[0].id.videoId;
        }
      }
    } catch (error) {
      console.error("YouTube API search failed:", error.message);
    }
  }

  // 3. Fallback to curated list
  for (const key of Object.keys(CURATED_VIDEOS)) {
    if (characterName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(characterName.toLowerCase())) {
      return CURATED_VIDEOS[key];
    }
  }

  return DEFAULT_VIDEO_ID;
}

async function seed() {
  try {
    await db.connect(MONGO_URI);

    // Fetch primary data from AniList
    const rawCharacters = await fetchFromAniList();
    console.log(`Fetched ${rawCharacters.length} characters from AniList.`);

    const totalCharacters = rawCharacters.length;
    for (let i = 0; i < totalCharacters; i++) {
      const char = rawCharacters[i];
      const name = char.name.full;
      const series = char.media?.nodes?.[0]?.title?.english || 
                     char.media?.nodes?.[0]?.title?.userPreferred || 
                     char.media?.nodes?.[0]?.title?.romaji || 
                     "Unknown Series";
      
      let gender = "other";
      if (char.gender) {
        const lowerGender = char.gender.toLowerCase();
        if (lowerGender === "male" || lowerGender === "female") {
          gender = lowerGender;
        }
      }

      console.log(`\n[${i + 1}/${totalCharacters}] Processing Character: ${name} (${series})`);

      // Initialize character object with AniList data
      const characterData = {
        name,
        series,
        gender,
        images: char.image?.large ? [char.image.large] : [],
        bio: char.description || "",
        popularity: char.favourites || 0,
        // Mark first 25 as Top Characters, next 25 as Fan Favorites
        isTopCharacter: i < 25,
        isFanFavorite: i >= 25,
        sources: {
          anilistId: String(char.id),
          malId: ""
        }
      };

      // Query Jikan for enrichment
      console.log(`- Fetching Jikan info for ${name}...`);
      const jikanData = await fetchJikanData(name);
      
      if (jikanData) {
        console.log(`  Found MAL match! MAL ID: ${jikanData.mal_id}`);
        characterData.sources.malId = String(jikanData.mal_id);
        
        // Enrich bio if AniList was empty/short
        if ((!characterData.bio || characterData.bio.length < 50) && jikanData.about) {
          characterData.bio = jikanData.about;
        }

        // Fetch additional pictures
        console.log(`  Fetching additional images for MAL ID ${jikanData.mal_id}...`);
        await sleep(1000); // rate limiting
        const extraPics = await fetchJikanPictures(jikanData.mal_id);
        if (extraPics && extraPics.length > 0) {
          // Merge images and filter out duplicates
          const allImages = [...characterData.images, ...extraPics];
          characterData.images = [...new Set(allImages)];
          console.log(`  Added ${extraPics.length} extra images.`);
        }
      } else {
        console.log("  No MAL match found.");
      }

      // Resolve YouTube Video ID (prefer character showcase compilation, fallback to AniList trailer)
      let videoId = await fetchYoutubeVideo(name, series);

      if (!videoId || videoId === DEFAULT_VIDEO_ID) {
        console.log(`- Character moments failed/defaulted, looking up AniList trailer for ${name}...`);
        if (char.media && char.media.nodes) {
          for (const node of char.media.nodes) {
            if (node.trailer && node.trailer.site === "youtube" && node.trailer.id) {
              videoId = node.trailer.id;
              break;
            }
          }
        }
      }

      if (!videoId) {
        videoId = DEFAULT_VIDEO_ID;
      }
      characterData.videoId = videoId;
      console.log(`  Associated Video ID: ${videoId}`);

      // Upsert to DB
      await db.findOneAndUpdate(
        { "sources.anilistId": characterData.sources.anilistId },
        characterData,
        { upsert: true, new: true }
      );
      console.log(`Saved character: ${name}`);

      // Wait 1.5 seconds between characters to avoid Jikan 429 rate limit
      await sleep(1500);
    }

    console.log("\nDatabase seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed with error:", error);
  } finally {
    await db.disconnect();
  }
}

seed();
