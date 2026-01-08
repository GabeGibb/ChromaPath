module.exports = {
	content: [
		/* your content paths */
	],
	theme: {
		extend: {
			fontFamily: {
				"sour-gummy": ["Sour Gummy", "serif"],
			},
		},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: ["light", "dark"],
	},
};
