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

export interface Product {
    id: string
    handle: string
    availableForSale: boolean
    title: string
    description: string
    descriptionHtml: string
    options: Option[]
    priceRange: PriceRange
    featuredImage: FeaturedImage
    tags: string[]
    images: Image[]
    variants: Variant[]
  }
  
  export interface Option {
    id: string
    name: string
    values: string[]
  }
  
  export interface PriceRange {
    min: number
    max: number
  }
  
  export interface FeaturedImage {
    url: string
  }
  
  export interface Image {
    url: string
    altText: string
  }
  
  export interface Variant {
    id: string
    title: string
    availableForSale: boolean
    selectedOptions: SelectedOption[]
    price: Price[]
  }
  
  export interface SelectedOption {
    name: string
    value: string
  }
  
  export interface Price {
    amount: string
    currencyCode: string
  }
  