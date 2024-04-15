import { EVENTS, addKeyword } from "@builderbot/bot";
import { Callbacks, Retriever, ModelArgs, ModelName, Store, RunnableConf } from "./types";
import { FactoryModel, Memory, Runnable } from "./ai";
import { ZodSchema, ZodType, ZodTypeDef } from "zod";
import { TFlow, BotContext, BotMethods } from "@builderbot/bot/dist/types";
import StoreRetriever from "./ai/stores";
import ContextualCompression from "./ai/contextuals";
import { Embeddings } from "@langchain/core/embeddings";
import { StructLayer, TransformLayer } from "./layers";
import { CustomRetriever } from "./ai/retrievers";
import { BaseRetriever } from "@langchain/core/retrievers";
import { StructuredOutputParser } from "langchain/output_parsers";

import z from "zod"

class createAIFlow {
    private static kwrd: TFlow<any, any> = addKeyword(EVENTS.ACTION)
    private static schema: ZodSchema
    private static model: FactoryModel = new FactoryModel()
    private static contextual: ContextualCompression
    private static store: BaseRetriever

    static setKeyword = (ev: any) => {
        this.kwrd = addKeyword(ev, { sensitive: false })
        return this
    }

    static setAIModel = (ai?: { modelName: ModelName, args?: ModelArgs }) => {
        this.model = new FactoryModel(ai)
        return this
    }

    static setZodSchema = <T>(schema: ZodType<T, ZodTypeDef, T>) => {
        this.schema = schema
        return this
    }

    static setStore = (store: Partial<Store & Retriever>) => {
        if (!store?.urlOrPath && !store?.searchFn) {
            throw new Error('Either urlOrPath or searchFn must be provided')
        }

        if (Object.keys(store).includes('urlOrPath')) {
            this.store = new StoreRetriever(store.urlOrPath, store?.schema, store?.store, store?.embbedgins)
        }else {
            this.store = new CustomRetriever(store.searchFn, store?.fields)
        }
        return this
    }

    static setCatchLayer = <T>(schema: ZodType<T, ZodTypeDef, T>, cb: (ctx: BotContext, methods: BotMethods) => Promise<void>, capture: boolean = false) => {
        this.kwrd = this.kwrd.addAction({ capture }, 
            new StructLayer(schema).createCallback(cb))
        return this
    }

    static setTransformLayer = <T>(schema: ZodType<T, ZodTypeDef, T>, cb: (ctx: BotContext, methods: BotMethods) => Promise<void>, capture: boolean = false) => {
        this.kwrd = this.kwrd.addAction({ capture }, 
            new TransformLayer(schema).createCallback(cb))
        return this
    }

    static pipe = (fn: (flow: TFlow<any, any>) => TFlow<any, any>) => {
        this.kwrd = fn(this.kwrd)
        return this
    }

    static setContextual (k: number, similarityThreshold: number, model?: Embeddings) {
        if (!this.store) {
            throw new Error('You must set the store first')
        }
        this.contextual = new ContextualCompression(this.store, {
            k, model, similarityThreshold
        })

        return this
    }

    static createRunnable = (opts?: RunnableConf, callbacks?: Callbacks) => {
        if (!this.schema) {
            this.schema = opts?.answerSchema 
            || z.object({ answer: z.string().describe('Answer as best possible') })
        }

        if (opts?.answerSchema) {
            this.schema = opts?.answerSchema
        }

        if (!this.contextual) {
            this.contextual = new ContextualCompression(this.store)
        }

        const format_instructions = new StructuredOutputParser(this.schema).getFormatInstructions()

        this.kwrd = this.kwrd.addAction(async (ctx, { state }) => {
            try {
                if (ctx?.context && typeof ctx.context === 'object') {
                    ctx.context = Object.values(ctx.context).join(' ')
                }else if (Array.isArray(ctx.context)) {
                    ctx.context = ctx.context.join(' ')
                }

                const context = await this.contextual.invoke(ctx?.context || ctx.body)
                const mapContext = context.map(doc => doc.pageContent).join('\n')
                
                const answer = await new Runnable(this.model.model, opts?.prompt).retriever(
                    mapContext,
                    {
                        question: ctx.body,
                        language: 'spanish',
                        history: await Memory.getMemory(state) || [],
                        format_instructions
                    },
                    this.schema
                )

                Memory.memory({ user: ctx.body, assistant: JSON.stringify(answer) }, state)

                await state.update({ answer })
            } catch (error) {
                callbacks?.onFailure && callbacks?.onFailure(error)
                await state.update({ answer: null })
            }

        })
        
        return this
    }

    static createFlow = () => {
        return this.kwrd
    }

}


export { createAIFlow }
export * from "./layers"
export * from "./flows"