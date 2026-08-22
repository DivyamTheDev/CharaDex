const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dns = require("dns");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Bypasses local network DNS block of MongoDB SRV records by using public DNS servers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Could not set public DNS resolvers, using default:", err.message);
}

const CharacterModel = require("./Character");

const DB_FILE = path.join(__dirname, "db.json");

let isMongoConnected = false;

// Initialize db.json with an empty array if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

function readJSON() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    console.error("Error reading db.json, resetting to empty array.", e.message);
    return [];
  }
}

function writeJSON(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing to db.json", e.message);
  }
}

const db = {
  connect: async (uri) => {
    try {
      console.log(`Connecting to database at ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      isMongoConnected = true;
      console.log("Connected to MongoDB successfully!");
    } catch (err) {
      isMongoConnected = false;
      console.warn(`\n⚠️  MongoDB connection failed: ${err.message}`);
      console.warn("   Falling back to local JSON database (db.json).\n");
    }
  },

  disconnect: async () => {
    if (isMongoConnected) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    }
  },

  find: async (filter = {}, options = {}) => {
    if (isMongoConnected) {
      let query = CharacterModel.find(filter);
      if (options.sort) query = query.sort(options.sort);
      if (options.skip !== undefined) query = query.skip(options.skip);
      if (options.limit !== undefined) query = query.limit(options.limit);
      return await query;
    }

    // JSON fallback
    let data = readJSON();

    // Apply filters
    if (filter.gender) {
      data = data.filter(c => c.gender === filter.gender);
    }
    if (filter.isTopCharacter !== undefined) {
      data = data.filter(c => c.isTopCharacter === filter.isTopCharacter);
    }
    if (filter.isFanFavorite !== undefined) {
      data = data.filter(c => c.isFanFavorite === filter.isFanFavorite);
    }
    if (filter.$or) {
      // This matches the $or regex query used in search
      const nameRegex = filter.$or[0].name;
      const seriesRegex = filter.$or[1].series;
      data = data.filter(c => nameRegex.test(c.name) || seriesRegex.test(c.series));
    }

    // Sort
    if (options.sort) {
      if (options.sort.popularity !== undefined) {
        const dir = options.sort.popularity; // -1 = desc, 1 = asc
        data.sort((a, b) => dir === -1 ? b.popularity - a.popularity : a.popularity - b.popularity);
      }
    }

    // Pagination
    const skip = options.skip || 0;
    const limit = options.limit !== undefined ? options.limit : data.length;
    return data.slice(skip, skip + limit);
  },

  countDocuments: async (filter = {}) => {
    if (isMongoConnected) {
      return await CharacterModel.countDocuments(filter);
    }
    // Count matches without pagination
    const matches = await db.find(filter, {});
    return matches.length;
  },

  distinct: async (field) => {
    if (isMongoConnected) {
      return await CharacterModel.distinct(field);
    }

    const data = readJSON();
    const values = data.map(c => c[field]).filter(Boolean);
    return [...new Set(values)].sort();
  },

  findById: async (id) => {
    if (isMongoConnected) {
      return await CharacterModel.findById(id);
    }

    const data = readJSON();
    return data.find(c => c._id === id) || null;
  },

  findOne: async (filter = {}) => {
    if (isMongoConnected) {
      return await CharacterModel.findOne(filter);
    }

    const data = readJSON();

    if (filter.$or) {
      return data.find(c => {
        return filter.$or.some(f => {
          if (f["sources.anilistId"] && c.sources && c.sources.anilistId === f["sources.anilistId"]) return true;
          if (f["sources.malId"] && c.sources && c.sources.malId === f["sources.malId"]) return true;
          return false;
        });
      }) || null;
    }

    return data.find(c => {
      for (const key in filter) {
        if (c[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  findOneAndUpdate: async (query, updateData, options = {}) => {
    if (isMongoConnected) {
      return await CharacterModel.findOneAndUpdate(query, updateData, options);
    }

    const data = readJSON();
    const anilistId = query["sources.anilistId"];
    let index = data.findIndex(c => c.sources && c.sources.anilistId === anilistId);

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    } else if (options.upsert) {
      const newChar = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...updateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.push(newChar);
      index = data.length - 1;
    }

    writeJSON(data);
    return index !== -1 ? data[index] : null;
  }
};

module.exports = db;
