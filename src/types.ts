import { EVENTS } from "@builderbot/bot"
import { TFlow } from "@builderbot/bot/dist/types"
import { Embeddings } from "@langchain/core/embeddings"
import { BaseRetrieverInput } from "@langchain/core/retrievers"
import { VectorStore, VectorStoreRetriever } from "@langchain/core/vectorstores"
import { ZodType, ZodTypeDef } from "zod"

export type Eventskrd = keyof typeof EVENTS

export type Callbacks = {
    beforeStart?: <P, B>(flow: TFlow<P,B>) => TFlow<P,B>,
    afterEnd?: <P, B>(flow: TFlow<P,B>) => TFlow<P,B>,
    onFailure?: (error: Error) => void
}

export type ModelArgs = {
    modelName: string,
    maxOutputTokens?: number,
    apikey?: string,
    temperature?: number,
    topK?: number 
    topP?: number
}

export type Store = {
    urlOrPath?: string,
    schema?: string[],
    store?: VectorStore|unknown,
    embbedgins?: Embeddings
}

export type Retriever = {
    searchFn?: (query: string) => Promise<any[]>,
    fields?: BaseRetrieverInput
}

export type ModelName ='gemini' | 'openai'

export type InvokeParams = {
    question: string,
    language: string,
    history: any,
    format_instructions?: string
} | {
    [key: string]: string
}

export type ContextOpts = {
    similarityThreshold: number
    k: number,
    path: string
}

export type RunnableConf = {
    prompt?: string,
    answerSchema: ZodType<any, ZodTypeDef, any>,
}