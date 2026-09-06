require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const db = require("./db");

// Curated YouTube Video IDs for top anime characters to ensure 100% accurate match
const CURATED_VIDEOS = {
  "Megumin": "O69V33xgo1o",
  "Kyoujurou Rengoku": "EF90I874qns",
  "Rengoku": "EF90I874qns",
  "Satoru Gojo": "M25zXPxF8HY",
  "Gojou": "M25zXPxF8HY",
  "Levi": "SP7T5bU5hUY",
  "Eren": "SP7T5bU5hUY",
  "Mikasa": "SP7T5bU5hUY",
  "Lelouch": "v-AGjx0N3y4",
  "Luffy": "e46Js3PoHaI",
  "Zoro": "4TO0ccO4sh0",
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
  "Mai Sakurajima": "8Ovxv614b8U",
  "Frieren": "lJ2Ao1suBSw",
  "Maomao": "uXv5TlA1hf4",
  "Nezuko": "ZjR-GKLZsS4",
  "Nadeko": "msEvh5R43e0",
  "Hinata Hyuuga": "ckl__ZiyHJk",
  "Fubuki": "zLq0i4U6V94",
  "Nanami": "o4WjO0y6Q_s",
  "Asuka": "7r4kF9u6G8M",
  "Rei Ayanami": "1R8z_jTqk-E",
  "Marin Kitagawa": "R90ZYSgUSdI",
  "Rem": "UzGULFTBrKg",
  "Chika Fujiwara": "R2vKdZCsJwY",
  "Rias Gremory": "W3XJs1lTjtw",
  "Rias": "W3XJs1lTjtw",
  "Akeno": "g0tHsJxYkOc",
  "Akeno Himejima": "g0tHsJxYkOc"
};

function cleanSeriesTitle(series) {
  if (!series) return "";
  return series
    .replace(/[:\-()[\]!]/g, " ")
    .replace(/\b(Season|Part|TV|Movie|The Final|2nd|3rd|4th|1st)\b.*$/i, "")
    .trim();
}

async function checkYoutubeEmbeddable(videoId) {
  if (!videoId) return false;
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function searchYoutubeWithoutKey(characterName, seriesName) {
  try {
    const cleanSeries = cleanSeriesTitle(seriesName);
    const cleanChar = characterName.replace(/[:\-()[\]!]/g, " ").trim();
    const query = `${cleanChar} ${cleanSeries} moments`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[1]);
    const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const charParts = cleanChar.toLowerCase().split(/\s+/).filter(p => p.length > 2);
    const seriesKeywords = cleanSeries.toLowerCase().split(/\s+/).filter(p => p.length > 2);

    for (const section of sections) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (!v || !v.videoId) continue;

        // Skip YouTube Shorts (reel, #shorts, or shorts url)
        const navUrl = v.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || "";
        if (navUrl.includes("/shorts/")) continue;
        const isShortsOverlay = v.thumbnailOverlays?.some(o => 
          o.thumbnailOverlayTimeStatusRenderer?.style === "SHORTS" ||
          o.thumbnailOverlayTimeStatusRenderer?.text?.simpleText?.toLowerCase()?.includes("shorts")
        );
        if (isShortsOverlay) continue;

        const title = (v.title?.runs?.map(r => r.text).join("") || v.title?.simpleText || "").toLowerCase();
        if (title.includes("#shorts") || title.includes("#short")) continue;

        // Strict verification: Whole-word match on character name (e.g. \brias\b, not 'historias')
        const matchesChar = charParts.some(part => {
          const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`\\b${escaped}\\b`, "i").test(title);
        });

        // Also ensure either series matches OR character's full name is in title
        const matchesSeries = seriesKeywords.length === 0 || seriesKeywords.some(k => {
          const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`\\b${escaped}\\b`, "i").test(title);
        });
        const matchesFullName = cleanChar.length > 3 && title.includes(cleanChar.toLowerCase());

        if (matchesChar && (matchesSeries || matchesFullName)) {
          const isEmbeddable = await checkYoutubeEmbeddable(v.videoId);
          if (isEmbeddable) {
            console.log(`  [VERIFIED MOMENTS] "${title}" (${v.videoId})`);
            return v.videoId;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error scraping YouTube moments search:", error.message);
  }
  return null;
}

async function searchYoutubeSeriesTrailer(seriesName) {
  try {
    const cleanSeries = cleanSeriesTitle(seriesName);
    if (!cleanSeries) return null;
    const query = `${cleanSeries} anime official trailer`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[1]);
    const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const seriesKeywords = cleanSeries.toLowerCase().split(/\s+/).filter(p => p.length > 2);

    for (const section of sections) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const v = item.videoRenderer;
        if (!v || !v.videoId) continue;

        const navUrl = v.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || "";
        if (navUrl.includes("/shorts/")) continue;

        const title = (v.title?.runs?.map(r => r.text).join("") || v.title?.simpleText || "").toLowerCase();
        if (title.includes("#shorts")) continue;
        
        const matchesSeries = seriesKeywords.some(k => {
          const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`\\b${escaped}\\b`, "i").test(title);
        });
        if (matchesSeries) {
          const isEmbeddable = await checkYoutubeEmbeddable(v.videoId);
          if (isEmbeddable) {
            console.log(`  [VERIFIED SERIES TRAILER] "${title}" (${v.videoId})`);
            return v.videoId;
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

async function fetchYoutubeVideo(characterName, seriesName, anilistMediaNodes = null) {
  const lowerName = characterName.toLowerCase();
  
  // 1. Check curated list with safe word-matching
  for (const [key, id] of Object.entries(CURATED_VIDEOS)) {
    const lowerKey = key.toLowerCase();
    if (lowerName === lowerKey || lowerName.includes(lowerKey)) {
      return id;
    }
  }

  // 2. Try verified character-specific moments on YouTube
  try {
    const videoId = await searchYoutubeWithoutKey(characterName, seriesName);
    if (videoId) {
      return videoId;
    }
  } catch (err) {
    console.error(`Verified YouTube search failed for ${characterName}:`, err.message);
  }

  // 3. Check official AniList anime trailer from media nodes (guaranteed embeddable and matches the anime)
  if (anilistMediaNodes && Array.isArray(anilistMediaNodes)) {
    for (const node of anilistMediaNodes) {
      if (node.trailer && node.trailer.site === "youtube" && node.trailer.id) {
        const isEmbeddable = await checkYoutubeEmbeddable(node.trailer.id);
        if (isEmbeddable) {
          console.log(`  [ANILIST MEDIA TRAILER] Using official trailer ${node.trailer.id} for ${characterName} (${seriesName})`);
          return node.trailer.id;
        }
      }
    }
  }

  // 4. Fallback to searching the official trailer for THIS specific anime series (NOT One Piece!)
  try {
    const seriesTrailerId = await searchYoutubeSeriesTrailer(seriesName);
    if (seriesTrailerId) {
      return seriesTrailerId;
    }
  } catch (err) {}

  // 5. Only if the character is genuinely from One Piece do we use the One Piece trailer
  if (seriesName && seriesName.toLowerCase().includes("one piece")) {
    return "S8_YwFLCh4U";
  }

  // If no verified video found, return null so we NEVER display an unrelated anime trailer!
  return null;
}

async function fetchAndCacheFromAniList(searchQuery) {
  try {
    const query = `
      query ($search: String) {
        Page (page: 1, perPage: 6) {
          characters (search: $search) {
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
          media (search: $search, type: ANIME, sort: POPULARITY_DESC) {
            characters (sort: [ROLE, RELEVANCE, POPULARITY_DESC], perPage: 6) {
              nodes {
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
        }
      }
    `;

    const variables = { search: searchQuery };

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) return;

    const result = await response.json();
    const pageData = result.data?.Page;
    const directCharacters = pageData?.characters || [];
    const mediaCharacters = [];
    if (pageData?.media) {
      for (const m of pageData.media) {
        if (m.characters?.nodes) {
          mediaCharacters.push(...m.characters.nodes);
        }
      }
    }

    // Combine and deduplicate
    const allChars = [...directCharacters];
    const seenIds = new Set(directCharacters.map(c => String(c.id)));
    for (const mc of mediaCharacters) {
      if (!seenIds.has(String(mc.id))) {
        seenIds.add(String(mc.id));
        allChars.push(mc);
      }
    }

    if (allChars.length === 0) return;

    for (const char of allChars) {
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

      // Resolve YouTube Video ID (prefer character moments, fallback to AniList trailer or series trailer)
      const videoId = await fetchYoutubeVideo(name, series, char.media?.nodes);

      const characterData = {
        name,
        series,
        gender,
        images: char.image?.large ? [char.image.large] : [],
        videoId: videoId || null,
        bio: char.description || "",
        popularity: char.favourites || 0,
        isTopCharacter: false,
        isFanFavorite: false,
        sources: {
          anilistId: String(char.id),
          malId: ""
        }
      };

      await db.findOneAndUpdate(
        { "sources.anilistId": characterData.sources.anilistId },
        characterData,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error("Error in hybrid search & cache:", error.message);
  }
}

async function fetchAniListTrailer(anilistId) {
  try {
    const query = `
      query ($id: Int) {
        Character (id: $id) {
          media (type: ANIME, sort: POPULARITY_DESC) {
            nodes {
              trailer {
                id
                site
              }
            }
          }
        }
      }
    `;

    const variables = { id: parseInt(anilistId) };

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.ok) {
      const result = await response.json();
      const nodes = result.data?.Character?.media?.nodes;
      if (nodes) {
        for (const node of nodes) {
          if (node.trailer && node.trailer.site === "youtube" && node.trailer.id) {
            const isEmbeddable = await checkYoutubeEmbeddable(node.trailer.id);
            if (isEmbeddable) {
              return node.trailer.id;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch AniList trailer by ID:", error.message);
  }
  return null;
}

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
function getCleanMongoUri() {
  let uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/animeCharacters";
  if (uri) {
    uri = uri.trim();
    if (uri.startsWith("MONGO_URI=")) {
      uri = uri.replace(/^MONGO_URI=\s*/, "").trim();
    }
    uri = uri.replace(/^["']|["']$/g, "");
  }
  return uri;
}
const MONGO_URI = getCleanMongoUri();

// Ensure DB is connected before processing requests on serverless
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await db.connect(getCleanMongoUri());
    } catch (e) {}
  }
  next();
});

// Health check route
app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", message: "Anime Character API is running." });
});

// GET /api/characters - supports query params: gender, category, search, page, limit
app.get(["/api/characters", "/characters"], async (req, res) => {
  try {
    const { gender, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (gender) {
      filter.gender = gender.toLowerCase();
    }

    if (category) {
      if (category === "top") {
        filter.isTopCharacter = true;
      } else if (category === "favorite" || category === "fan-favorite") {
        filter.isFanFavorite = true;
      }
    }

    if (search) {
      const cleanSearch = search.trim();
      const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [
        { name: searchRegex },
        { series: searchRegex }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let characters = await db.find(filter, {
      sort: { popularity: -1 },
      skip,
      limit: limitNum
    });

    // HYBRID SEARCH: If local search yields no results, fetch live from AniList and cache it on-the-fly!
    if (search && characters.length === 0) {
      console.log(`No local results for search "${search}". Fetching live from AniList...`);
      await fetchAndCacheFromAniList(search);
      // Re-run local query to retrieve the newly cached characters
      characters = await db.find(filter, {
        sort: { popularity: -1 },
        skip,
        limit: limitNum
      });

      // If still 0 and gender/category filter was restricting it, search globally
      if (characters.length === 0 && (filter.gender || filter.isTopCharacter || filter.isFanFavorite)) {
        const relaxedFilter = { $or: filter.$or };
        characters = await db.find(relaxedFilter, {
          sort: { popularity: -1 },
          skip,
          limit: limitNum
        });
      }
    }

    const total = await db.countDocuments(filter);

    res.json({
      characters,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/series - get all unique series names
app.get(["/api/series", "/series"], async (req, res) => {
  try {
    const series = await db.distinct("series");
    res.json(series.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/characters/:id - get character by ID (Mongoose ObjectID, AniList ID, or MAL ID)
app.get(["/api/characters/:id", "/characters/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    let character;

    // Check if it is a valid Mongoose ID first
    if (mongoose.Types.ObjectId.isValid(id)) {
      character = await db.findById(id);
    }

    // Fallback to checking source IDs (AniList or MAL)
    if (!character) {
      character = await db.findOne({
        $or: [
          { "sources.anilistId": id },
          { "sources.malId": id }
        ]
      });
    }

    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Auto-repair missing or incorrect legacy default videoId for cached records
    const isOnePiece = character.series && character.series.toLowerCase().includes("one piece");
    if (!character.videoId || (character.videoId === "S8_YwFLCh4U" && !isOnePiece)) {
      console.log(`Auto-repairing missing/default videoId for: ${character.name}`);
      
      let videoId = await fetchYoutubeVideo(character.name, character.series);
      
      if (!videoId) {
        console.log(`- Character moments search failed, checking AniList trailer for ${character.name}`);
        const aniListTrailer = await fetchAniListTrailer(character.sources?.anilistId);
        if (aniListTrailer) {
          videoId = aniListTrailer;
        }
      }

      if (!videoId) {
        videoId = await searchYoutubeSeriesTrailer(character.series);
      }

      if (!videoId && isOnePiece) {
        videoId = "S8_YwFLCh4U";
      }

      const updated = await db.findOneAndUpdate(
        { _id: character._id },
        { videoId: videoId || null },
        { new: true }
      );
      if (updated) {
        character = updated;
      }
    }

    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend static build if available
const distPath = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Anime Character API is running.");
  });
}

if (!process.env.VERCEL) {
  db.connect(MONGO_URI).then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
