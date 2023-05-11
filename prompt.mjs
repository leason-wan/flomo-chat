// import { ChatOpenAI } from "langchain/chat_models/openai";
// import { ConversationSummaryMemory } from "langchain/memory";
// import { LLMChain } from "langchain/chains";
// import { PromptTemplate } from "langchain/prompts";

// export const run = async () => {
//   const model = new ChatOpenAI({
//         modelName: "gpt-3.5-turbo",
//         temperature: 0,
//   });
//   const memory = new ConversationSummaryMemory({
//     memoryKey: "chat_history",
//     llm: new ChatOpenAI({
//         modelName: "gpt-3.5-turbo",
//         temperature: 0,
//   }),
//   });
//   const prompt =
//     PromptTemplate.fromTemplate(`The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

//   Current conversation:
//   {chat_history}
//   Human: {input}
//   AI:`);
//   const chain = new LLMChain({ llm: model, prompt, memory, verbose: true });

//   const res1 = await chain.call({ input: "Hi! I'm Jim." });
//   console.log({ res1, memory: await memory.loadMemoryVariables({}) });
//   /*
//   {
//     res1: {
//       text: "Hello Jim! It's nice to meet you. My name is AI. How may I assist you today?"
//     },
//     memory: {
//       chat_history: 'Jim introduces himself to the AI and the AI greets him and offers assistance.'
//     }
//   }
//   */

//   const res2 = await chain.call({ input: "What's my name?" });
//   console.log({ res2, memory: await memory.loadMemoryVariables({}) });
//   /*
//   {
//     res2: {
//       text: "Your name is Jim. It's nice to meet you, Jim. How can I assist you today?"
//     },
//     memory: {
//       chat_history: 'Jim introduces himself to the AI and the AI greets him and offers assistance. The AI addresses Jim by name and asks how it can assist him.'
//     }
//   }
//   */
// };

// run()

import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory, BufferWindowMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate, } from "langchain/prompts";

async function run () {
    const model = new ChatOpenAI({
        temperature: 0,
    });
    // const memory = new BufferWindowMemory({ inputKey: 'question', memoryKey: 'history' });
    const memory = new BufferMemory({  returnMessages: true, inputKey: 'question', memoryKey: 'history' });
    const prompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate('你是AI助理，你的名字叫FlomoAI。根据用户的memo提取相关信息，以温柔俏皮的语气回复用户。如果没有相关信息，直接回复不好意思，我不了解。今天是2023年5月10日。'),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate('我的Memo: ```{memos}``` \n 我的输入: {question}'),
      ]);
    const chain = new ConversationChain({ llm: model, prompt, memory: memory, verbose: true });
    const res1 = await chain.call({ question: "你好我叫礼行。", memos: '2023年5月9日 我讨厌吃香菜。' });
    console.log(res1.response);

    const res2 = await chain.call({ question: "我今年18岁了。", memos: '' });
    console.log(res2.response);
    const res3 = await chain.call({ question: "我叫什么名字?", memos: '' });
    console.log(res2.response);
}

run()