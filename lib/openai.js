import { Configuration, OpenAIApi , } from 'openai';

if (!process.env.OPENAI_API_KEY) {
	throw new Error('Please add your OPENAI_API_KEY to .env');
}

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);