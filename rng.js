/**
 * RNG Module - Seeded deterministic random number generator
 * Uses mulberry32 PRNG algorithm for consistent, repeatable sequences
 * No DOM usage, no side effects - pure functional module
 */

/**
 * Creates a seeded random number generator
 * Uses Mulberry32 algorithm for deterministic output
 * Same seed always produces identical sequences
 * @param {number} seed - Initial seed value
 * @returns {Object} RNG object with next(), nextInt(), nextFloat() methods
 */
function createSeededRNG(seed) {
    // Initialize seed state as unsigned 32-bit integer
    let state = seed >>> 0;

    /**
     * Mulberry32 PRNG - generates the next random value
     * @returns {number} Float between 0 and 1 (exclusive of 1)
     */
    function generate() {
        state |= 0;
        state = state + 0x6d2b79f5 | 0;
        let t = Math.imul(state ^ state >>> 15, 1 | state);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    return {
        /**
         * Returns next random float between 0 (inclusive) and 1 (exclusive)
         * @returns {number} Random float [0, 1)
         */
        next() {
            return generate();
        },

        /**
         * Returns random integer between min (inclusive) and max (inclusive)
         * @param {number} min - Minimum value (inclusive)
         * @param {number} max - Maximum value (inclusive)
         * @returns {number} Random integer in range [min, max]
         */
        nextInt(min, max) {
            if (min > max) {
                [min, max] = [max, min];
            }
            return Math.floor(generate() * (max - min + 1)) + min;
        },

        /**
         * Returns random float between min (inclusive) and max (exclusive)
         * @param {number} min - Minimum value (inclusive)
         * @param {number} max - Maximum value (exclusive)
         * @returns {number} Random float in range [min, max)
         */
        nextFloat(min, max) {
            if (min > max) {
                [min, max] = [max, min];
            }
            return generate() * (max - min) + min;
        }
    };
}

// Export for use in Node.js or as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createSeededRNG };
}
