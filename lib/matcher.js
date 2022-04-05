/*
* code bellow is a fork from:
*
*  https://github.com/sindresorhus/matcher v5.0.0
*  https://github.com/sindresorhus/escape-string-regexp v5.0.0
*
*  reason: both versions ARE NOT CommonJS based
*
*  tks Sindre ;-)
*/

// escape-string-regexp begins here

const escapeStringRegexp = function escapeStringRegexp(string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return string
		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
		.replace(/-/g, '\\x2d');
};

// matcher begins here

const regexpCache = new Map();

const sanitizeArray = (input, inputName) => {
	if (!Array.isArray(input)) {
		switch (typeof input) {
			case 'string':
				input = [input];
				break;
			case 'undefined':
				input = [];
				break;
			default:
				throw new TypeError(`Expected '${inputName}' to be a string or an array, but got a type of '${typeof input}'`);
		}
	}

	return input.filter(string => {
		if (typeof string !== 'string') {
			if (typeof string === 'undefined') {
				return false;
			}

			throw new TypeError(`Expected '${inputName}' to be an array of strings, but found a type of '${typeof string}' in the array`);
		}

		return true;
	});
};

const makeRegexp = (pattern, options) => {
	options = {
		caseSensitive: false,
		...options,
	};

	const cacheKey = pattern + JSON.stringify(options);

	if (regexpCache.has(cacheKey)) {
		return regexpCache.get(cacheKey);
	}

	const negated = pattern[0] === '!';

	if (negated) {
		pattern = pattern.slice(1);
	}

	pattern = escapeStringRegexp(pattern).replace(/\\\*/g, '[\\s\\S]*');

	const regexp = new RegExp(`^${pattern}$`, options.caseSensitive ? '' : 'i');
	regexp.negated = negated;
	regexpCache.set(cacheKey, regexp);

	return regexp;
};

const baseMatcher = (inputs, patterns, options, firstMatchOnly) => {
	inputs = sanitizeArray(inputs, 'inputs');
	patterns = sanitizeArray(patterns, 'patterns');

	if (patterns.length === 0) {
		return [];
	}

	patterns = patterns.map(pattern => makeRegexp(pattern, options));

	const { allPatterns } = options || {};
	const result = [];

	for (const input of inputs) {
		// String is included only if it matches at least one non-negated pattern supplied.
		// Note: the `allPatterns` option requires every non-negated pattern to be matched once.
		// Matching a negated pattern excludes the string.
		let matches;
		const didFit = [...patterns].fill(false);

		for (const [index, pattern] of patterns.entries()) {
			if (pattern.test(input)) {
				didFit[index] = true;
				matches = !pattern.negated;

				if (!matches) {
					break;
				}
			}
		}

		if (
			!(
				matches === false
				|| (matches === undefined && patterns.some(pattern => !pattern.negated))
				|| (allPatterns && didFit.some((yes, index) => !yes && !patterns[index].negated))
			)
		) {
			result.push(input);

			if (firstMatchOnly) {
				break;
			}
		}
	}

	return result;
};

module.exports = {
	matcher: (inputs, patterns, options) => {
		return baseMatcher(inputs, patterns, options, false);
	},
	isMatch: (inputs, patterns, options) => {
		return baseMatcher(inputs, patterns, options, true).length > 0;
	}
};
