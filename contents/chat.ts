import { ref, reactive } from 'vue'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate, } from "langchain/prompts";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";  
import { describe } from './bot'

interface MEMO {
  time: string
  content: string
}

export const store = reactive<{
  openAIApiKey: string
  model: ChatOpenAI | null
  memoStore: MemoryVectorStore | null
  chain: ConversationChain | null
  memory: BufferMemory | null
}>({
  openAIApiKey: '',
  model: null,
  memoStore: null,
  chain: null,
  memory: null,
})

export function setOpenAIApiKey(key: string) {
  store.openAIApiKey = key
}

function getMemos(): MEMO[] {
  const memoEl = document.querySelectorAll('.memo')
  if (memoEl.length < 1) {
    describe.value = '没有找到memo'
    return []
  };
  const memos = Array.from(memoEl).map(el => {
    const time = el.querySelector('.header .time span')!.innerHTML
    const content = el.querySelector('.content .richText')!.innerHTML
    return {
      time,
      content
    }
  })
  return memos
}

export const memoLoading = ref<boolean>(false)
export async function handleInit() {
  memoLoading.value = true
  describe.value = '阅读...'
  const memos = getMemos()
  if (memos.length < 1) {
    memoLoading.value = false
    return
  }
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: store.openAIApiKey,
  });
  const docs = memos.map(memo => {
    return new Document({ pageContent: memo.time + '\n' + memo.content, metadata: { source: memo.time } })
  })
  store.memoStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  store.model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: store.openAIApiKey,
  });
  store.chain = createChain()
  describe.value = '聊点什么~'
  memoLoading.value = false
}

function createChain(): ConversationChain {
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate('你是AI文档助理，你的名字叫FlomoAI。你的任务是根据用户的memo提取关键信息，以合理的诠释回答问题。如果没有相关信息，直接回复我不了解。'),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate('我的Memo: ```{memos}``` \n 我的输入: {question} \n FlomoAI的诠释: '),
  ]);
  const chain = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history", inputKey: 'question' }),
    prompt,
    llm: store.model as ChatOpenAI,
  });
  return chain
}

export async function qaChat(question: string): Promise<string> {
  if(!store.memoStore || !store.chain) {
    describe.value = 'memo加载错误'
    return ''
  }
  const storeDocs = await store.memoStore.similaritySearch(question, 2)
  const memos = storeDocs.map(doc => doc.pageContent).join(',')
  
  const response = await store.chain!.call({
    question,
    memos,
  });
  return response.response
}
