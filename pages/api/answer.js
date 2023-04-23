import {sendBadRequest, sendMethodNotAllowed, sendOk,} from '@/js/utils/apiMethods.js';
import {openai,} from '@/lib/openai.js';

const SYSTEM_PROMPTS = {
	YES_NO: {
		MESSAGE: {
			'role': 'system',
			'content': 'You only respond with YES or NO.',
		},
		TEMPERATURE: 0.1,
		MAX_TOKENS: 5,
		TYPE: 'yes_no',
	},
	SIMPLE_ASSISTANT: {
		MESSAGE: {
			'role': 'system',
			'content': 'You are a simple assistant. You respond with simple sentences.',
		},
		TEMPERATURE: 1,
		MAX_TOKENS: 50,
		TYPE: 'simple_assistant',
	},
	SIMPLE_ASSISTANT_GENERATE_SENTENCE: {
		MESSAGE: {
			'role': 'system',
			'content': 'You are a simple assistant. You respond with simple sentences.',
		},
		TEMPERATURE: 1,
		MAX_TOKENS: 100,
		TYPE: 'simple_assistant_generate_sentence',
	},
	MICHAEL_SCOTT: {
		MESSAGE: {
			'role': 'system',
			'content': 'You are pretending to be Michael Scott from The Office. You try to be funny, occasionally making "That\'s what she said" jokes.',
		},
		TEMPERATURE: 1,
		MAX_TOKENS: 100,
		TYPE: 'michael_scott',
	},
};

const ERRORS = {
	DATABASE_ERROR: {
		type: 'database_error',
		message: 'Error while processing the request.',
	},
	WRONG_LANGUAGE: {
		type: 'wrong_language',
		message: 'The language of the input is not the desired one.',
	},
	WRONG_CONVERSATION_TYPE: {
		type: 'wrong_conversation_type',
		message: 'The conversation type is not known.',
	},
	OPEN_AI_ERROR: {
		type: 'open_ai_error',
		message: 'Error while processing the request.',
	},
};

const chatCompletion = async (messagesArray, max_tokens, temperature = 1) => {
	const rawResponse = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages: messagesArray,
		max_tokens: max_tokens,
		temperature: temperature,
	});

	return rawResponse?.data?.choices[0];
};

const converseChat = async (res, inputChat, useCase) => {
	try {
		const MAX_MEMORY = 3;
		let userMessagesArray = [];

		if(inputChat.length > MAX_MEMORY) {
			userMessagesArray = inputChat.slice( -1 * MAX_MEMORY);
		}
		else {
			userMessagesArray = inputChat;
		}

		const messagesArray = [
			useCase.MESSAGE,
			...userMessagesArray
		];

		const response = await chatCompletion(messagesArray, useCase.MAX_TOKENS, useCase.TEMPERATURE);
		return sendOk(res, response);
	}
	catch(error) {
		return sendBadRequest(res, ERRORS.OPEN_AI_ERROR.type, ERRORS.OPEN_AI_ERROR.message);
	}

};
const converse = (res, input, type) => {
	switch (type) {
		case SYSTEM_PROMPTS.SIMPLE_ASSISTANT.TYPE:
			return converseChat(res, input, SYSTEM_PROMPTS.SIMPLE_ASSISTANT);
		case SYSTEM_PROMPTS.MICHAEL_SCOTT.TYPE:
			return converseChat(res, input, SYSTEM_PROMPTS.MICHAEL_SCOTT);
		default:
			return sendBadRequest(res, ERRORS.WRONG_CONVERSATION_TYPE.message);
	}
};

export default function handler(req, res) {
	const isAllowedMethod = req.method === 'POST';
	console.log('Incoming request: ', req.method, req.body);
	const {
		messages,
		type
	} = req.body;

	if (!messages) {
		return sendBadRequest(res, 'Missing input');
	}
	else if (!type) {
		return sendBadRequest(res, 'wrong_conversation_type');
	}
	else if(!isAllowedMethod) {
		return sendMethodNotAllowed(res);
	}

	try{
		if(req.method === 'POST') {
			return converse(res, messages, type);
		}
		else {
			return sendMethodNotAllowed(res);
		}
	}
	catch(error) {
		console.error(error);
		return sendBadRequest(res, ERRORS.OPEN_AI_ERROR.type, ERRORS.OPEN_AI_ERROR.message);
	}
}