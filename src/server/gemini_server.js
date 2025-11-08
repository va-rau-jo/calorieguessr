import { GoogleGenAI } from '@google/genai';

// The SDK automatically uses the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

/**
 * Generates content using the Gemini model.
 * @param {string} prompt - The text prompt to send to the model.
 */
async function generateContent(prompt) {
	console.log(`Sending prompt to Gemini: "${prompt}"`);

	try {
		// 1. Call the model
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash', // Use a fast and capable model
			contents: prompt,
		});

		// 2. Extract and display the response text
		const responseText = response.text;
		console.log('\n--- Gemini Response ---');
		console.log(responseText);
		console.log('-----------------------\n');

		return responseText;
	} catch (error) {
		console.error('ERROR making Gemini API call:', error.message);
	}
}

export { generateContent };
