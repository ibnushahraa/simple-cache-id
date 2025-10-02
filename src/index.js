// simple-cache-id
// Lightweight in-memory cache with default TTL + wrap()

const fs = require('fs');
const path = require('path');

/**
 * @class SimpleCache
 * @classdesc A lightweight in-memory cache with default TTL and helper `wrap()`.
 */
class SimpleCache {
    /**
     * @param {number} [defaultTtl=0] - Default TTL in seconds (0 = no expiration)
     * @param {object} [options={}] - Configuration options
     * @param {number} [options.checkInterval=5] - Interval to check for expired keys (in seconds)
     * @param {boolean} [options.persistent=false] - Enable persistent storage to binary file
     * @param {string} [options.persistPath='./.cache/simple-cache.sdb'] - Path to binary file
     */
    constructor(defaultTtl = 0, options = {}) {
        // Support backward compatibility: if options is a number, treat it as checkInterval
        if (typeof options === 'number') {
            options = { checkInterval: options };
        }

        /** @type {Map<string, any>} */
        this.store = new Map();

        /** @type {Map<string, number>} - Stores expiry timestamp (ms) */
        this.expiries = new Map();

        /** @type {number} */
        this.defaultTtl = defaultTtl;

        /** @type {number} */
        this.checkInterval = options.checkInterval || 5;

        /** @type {boolean} */
        this.persistent = options.persistent || false;

        /** @type {string} */
        this.persistPath = options.persistPath || './.cache/simple-cache.sdb';

        /** @type {NodeJS.Timeout|null} */
        this.cleanupInterval = null;

        // Load from binary if persistent=true
        if (this.persistent) {
            this._loadFromBinary();
        }

        // Start cleanup interval if defaultTtl is set
        if (this.defaultTtl > 0 || this.checkInterval > 0) {
            this._startCleanup();
        }
    }

    /**
     * Start interval for cleaning up expired keys
     * @private
     */
    _startCleanup() {
        if (this.cleanupInterval) return;

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, expiryTime] of this.expiries.entries()) {
                if (now >= expiryTime) {
                    this.store.delete(key);
                    this.expiries.delete(key);
                }
            }
        }, this.checkInterval * 1000);

        // Prevent Node.js from hanging due to interval
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Stop cleanup interval
     * @private
     */
    _stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Store a value in the cache with optional TTL.
     * @param {string} key - Unique cache key
     * @param {any} value - Value to store
     * @param {number} [ttl] - TTL in seconds, defaults to constructor TTL
     * @returns {"OK"}
     */
    set(key, value, ttl) {
        // use per-key TTL or default
        const effectiveTtl = typeof ttl === "number" ? ttl : this.defaultTtl;

        this.store.set(key, value);

        if (effectiveTtl > 0) {
            // Store expiry time (now + TTL)
            const expiryTime = Date.now() + (effectiveTtl * 1000);
            this.expiries.set(key, expiryTime);

            // Ensure cleanup interval is running
            if (!this.cleanupInterval) {
                this._startCleanup();
            }
        } else {
            // Remove expiry if TTL = 0 (permanent)
            this.expiries.delete(key);
        }

        return "OK";
    }

    /**
     * Retrieve a value from the cache.
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        if (!this.store.has(key)) return null;

        // Lazy deletion: check if expired
        if (this.expiries.has(key)) {
            const expiryTime = this.expiries.get(key);
            if (Date.now() >= expiryTime) {
                this.store.delete(key);
                this.expiries.delete(key);
                return null;
            }
        }

        return this.store.get(key);
    }

    /**
     * Delete a key.
     * @param {string} key
     * @returns {number} - 1 if deleted, 0 if not found
     */
    del(key) {
        this.expiries.delete(key);
        return this.store.delete(key) ? 1 : 0;
    }

    /**
     * Clear all cache.
     */
    flush() {
        this._stopCleanup();
        this.expiries.clear();
        this.store.clear();
    }

    /**
     * Destroy cache instance and stop all intervals
     */
    destroy() {
        // Save to binary before destroy if persistent=true
        if (this.persistent) {
            this._saveToBinary();
        }

        this._stopCleanup();
        this.flush();
    }

    /**
     * Load cache from binary file
     * @private
     */
    _loadFromBinary() {
        try {
            // Check if file exists
            if (!fs.existsSync(this.persistPath)) {
                return; // file doesn't exist, skip
            }

            const buffer = fs.readFileSync(this.persistPath);
            const entries = this._deserializeBinary(buffer);
            const now = Date.now();

            // Load only non-expired entries
            for (const { key, value, expiryTime } of entries) {
                // Skip if already expired
                if (expiryTime > 0 && now >= expiryTime) {
                    continue;
                }

                this.store.set(key, value);
                if (expiryTime > 0) {
                    this.expiries.set(key, expiryTime);
                }
            }
        } catch (err) {
            // Silent fail, start fresh on error
            console.error('Failed to load from binary:', err.message);
        }
    }

    /**
     * Save cache to binary file
     * Only saves entries with valid TTL (not expired)
     * @private
     */
    _saveToBinary() {
        try {
            const now = Date.now();
            const entries = [];

            // Filter: only save non-expired entries
            for (const [key, value] of this.store.entries()) {
                const expiryTime = this.expiries.get(key) || 0;

                // Skip if already expired
                if (expiryTime > 0 && now >= expiryTime) {
                    continue;
                }

                entries.push({ key, value, expiryTime });
            }

            // Serialize to binary
            const buffer = this._serializeBinary(entries);

            // Ensure directory exists
            const dir = path.dirname(this.persistPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Atomic write: write to temp → rename
            const tempPath = this.persistPath + '.tmp';
            fs.writeFileSync(tempPath, buffer);
            fs.renameSync(tempPath, this.persistPath);
        } catch (err) {
            console.error('Failed to save to binary:', err.message);
        }
    }

    /**
     * Serialize entries to binary format
     * @private
     * @param {Array<{key: string, value: any, expiryTime: number}>} entries
     * @returns {Buffer}
     */
    _serializeBinary(entries) {
        const buffers = [];

        // Header (12 bytes)
        // - Magic: "SDB" (3 bytes)
        // - Version: 0x01 (1 byte)
        // - Entry Count: uint32 LE (4 bytes)
        // - Reserved: (4 bytes)
        const header = Buffer.alloc(12);
        header.write('SDB', 0, 'ascii');
        header.writeUInt8(1, 3); // version
        header.writeUInt32LE(entries.length, 4);
        buffers.push(header);

        // Entries
        for (const { key, value, expiryTime } of entries) {
            const keyBuf = Buffer.from(key, 'utf8');
            const valueBuf = Buffer.from(JSON.stringify(value), 'utf8');

            // Entry structure:
            // - Key Length: uint16 LE (2 bytes)
            // - Key: UTF-8 string (variable)
            // - Expiry Time: BigInt64 LE (8 bytes, 0 = permanent)
            // - Value JSON Length: uint32 LE (4 bytes)
            // - Value: JSON string (variable)
            const entryBuf = Buffer.alloc(2 + keyBuf.length + 8 + 4 + valueBuf.length);
            let offset = 0;

            // Key
            entryBuf.writeUInt16LE(keyBuf.length, offset);
            offset += 2;
            keyBuf.copy(entryBuf, offset);
            offset += keyBuf.length;

            // Expiry
            entryBuf.writeBigInt64LE(BigInt(expiryTime), offset);
            offset += 8;

            // Value
            entryBuf.writeUInt32LE(valueBuf.length, offset);
            offset += 4;
            valueBuf.copy(entryBuf, offset);

            buffers.push(entryBuf);
        }

        return Buffer.concat(buffers);
    }

    /**
     * Deserialize binary format to entries
     * @private
     * @param {Buffer} buffer
     * @returns {Array<{key: string, value: any, expiryTime: number}>}
     */
    _deserializeBinary(buffer) {
        const entries = [];

        // Parse header
        const magic = buffer.toString('ascii', 0, 3);
        if (magic !== 'SDB') {
            throw new Error('Invalid SDB file format');
        }

        const version = buffer.readUInt8(3);
        if (version !== 1) {
            throw new Error(`Unsupported SDB version: ${version}`);
        }

        const entryCount = buffer.readUInt32LE(4);
        let offset = 12;

        // Parse entries
        for (let i = 0; i < entryCount; i++) {
            // Key
            const keyLength = buffer.readUInt16LE(offset);
            offset += 2;
            const key = buffer.toString('utf8', offset, offset + keyLength);
            offset += keyLength;

            // Expiry
            const expiryTime = Number(buffer.readBigInt64LE(offset));
            offset += 8;

            // Value
            const valueLength = buffer.readUInt32LE(offset);
            offset += 4;
            const valueJson = buffer.toString('utf8', offset, offset + valueLength);
            const value = JSON.parse(valueJson);
            offset += valueLength;

            entries.push({ key, value, expiryTime });
        }

        return entries;
    }

    /**
     * Stats
     * @returns {{keys: number}}
     */
    stats() {
        return { keys: this.store.size };
    }

    /**
     * Wrap: return cached value or compute & cache.
     * @template T
     * @param {string} key
     * @param {() => (Promise<T>|T)} fn
     * @param {number} [ttl] - Override TTL
     * @returns {Promise<T>}
     */
    async wrap(key, fn, ttl) {
        const cached = this.get(key);
        if (cached !== null) return cached;

        const result = await fn();
        this.set(key, result, ttl);
        return result;
    }
}

module.exports = SimpleCache;
