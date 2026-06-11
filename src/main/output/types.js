/**
 * Pipeline stage identifiers for the output assembly system.
 *
 * Each stage produces a structured block that the Assemble stage
 * consumes to build the final systemPrompt and userPrompt.
 */
export const PIPELINE_STAGES = Object.freeze({
    PRESERVE: "PRESERVE",
    IMPROVE: "IMPROVE",
    CONSTRAIN: "CONSTRAIN",
    ASSEMBLE: "ASSEMBLE",
});

/**
 * @typedef {Object} StageOutput
 * @property {string} stage   - One of PIPELINE_STAGES values
 * @property {string} block   - The textual output produced by this stage
 * @property {Record<string,unknown>} meta - Arbitrary metadata (e.g. word count, flags)
 */

/**
 * @typedef {Object} CompilerResult
 * @property {string} systemPrompt - Final assembled system prompt
 * @property {string} userPrompt   - Final assembled user prompt
 * @property {StageOutput[]} stages - Ordered list of stage outputs used
 */

/**
 * @typedef {Object} CompilerInput
 * @property {string} rawText          - The original user text to refine
 * @property {string} [systemHint]     - Optional caller-provided system hint
 * @property {Record<string,unknown>} [options] - Optional stage options
 */