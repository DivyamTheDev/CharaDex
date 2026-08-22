require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const db = require("./db");

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

const DEFAULT_VIDEO_ID = "S8_YwFLCh4U";

async function fetchYoutubeVideo(characterName, seriesName) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    // 1. Check curated list first
    for (const key of Object.keys(CURATED_VIDEOS)) {
      if (characterName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(characterName.toLowerCase())) {
        return CURATED_VIDEOS[key];
      }
    }
    // 2. Fetch anime trailer from Jikan search by anime name
    try {
      console.log(`Searching Jikan for trailer of series: ${seriesName}`);
      const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(seriesName)}&limit=1`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0 && result.data[0].trailer && result.data[0].trailer.youtube_id) {
          console.log(`  Found Jikan trailer ID: ${result.data[0].trailer.youtube_id}`);
          return result.data[0].trailer.youtube_id;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch Jikan trailer for ${seriesName}:`, e.message);
    }
    return DEFAULT_VIDEO_ID;
  }

  try {
    const query = `${characterName} ${seriesName} official trailer`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=1`;
    const response = await fetch(url);
    if (!response.ok) return DEFAULT_VIDEO_ID;
    const result = await response.json();
    if (result.items && result.items.length > 0) {
      return result.items[0].id.videoId;
    }
    return DEFAULT_VIDEO_ID;
  } catch (error) {
    return DEFAULT_VIDEO_ID;
  }
}

async function fetchAndCacheFromAniList(searchQuery) {
  try {
    const query = `
      query ($search: String) {
        Page (page: 1, perPage: 5) {
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
    const characters = result.data?.Page?.characters;
    if (!characters || characters.length === 0) return;

    for (const char of characters) {
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

      // Resolve YouTube Video ID (prefer AniList trailer, fallback to curated/Jikan lookup)
      let videoId = null;
      if (char.media && char.media.nodes) {
        for (const node of char.media.nodes) {
          if (node.trailer && node.trailer.site === "youtube" && node.trailer.id) {
            videoId = node.trailer.id;
            break;
          }
        }
      }

      if (!videoId) {
        console.log(`- Fetching YouTube video fallback for ${name}...`);
        videoId = await fetchYoutubeVideo(name, series);
      }

      const characterData = {
        name,
        series,
        gender,
        images: char.image?.large ? [char.image.large] : [],
        videoId,
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
            return node.trailer.id;
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

// Simple test route to confirm server is running
app.get("/", (req, res) => {
  res.send("Anime Character API is running.");
});

// GET /api/characters - supports query params: gender, category, search, page, limit
app.get("/api/characters", async (req, res) => {
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
      const searchRegex = new RegExp(search, "i");
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
app.get("/api/series", async (req, res) => {
  try {
    const series = await db.distinct("series");
    res.json(series.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/characters/:id - get character by ID (Mongoose ObjectID, AniList ID, or MAL ID)
app.get("/api/characters/:id", async (req, res) => {
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
    if (!character.videoId || character.videoId === "S8_YwFLCh4U") {
      console.log(`Auto-repairing missing/default videoId for: ${character.name}`);
      
      let videoId = await fetchAniListTrailer(character.sources.anilistId);
      
      if (!videoId) {
        console.log(`- AniList trailer not found, falling back to YouTube/Jikan search for ${character.name}`);
        videoId = await fetchYoutubeVideo(character.name, character.series);
      }

      const updated = await db.findOneAndUpdate(
        { "sources.anilistId": character.sources.anilistId },
        { videoId },
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

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/animeCharacters";

db.connect(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
