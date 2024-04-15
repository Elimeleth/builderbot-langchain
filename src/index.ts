import { EVENTS, addKeyword } from "@builderbot/bot";
import { Callbacks, Retriever, ModelArgs, ModelName, Store, RunnableConf, AiModel } from "./types";
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
    private static store: BaseRetriever

    static setKeyword = (ev: any) => {
        this.kwrd = addKeyword(ev, { sensitive: false })
        return this
    }

    private static setAIModel = (ai?: { modelName: ModelName, args?: ModelArgs }) => {
        return new FactoryModel(ai)
    }

    private static setContextual (k: number, similarityThreshold: number, model?: Embeddings) {
        if (!this.store) {
            throw new Error('You must set the store first')
        }
        return new ContextualCompression(this.store, {
            k, model, similarityThreshold
        })
    }

    static setStore = (args: Partial<Store & Retriever>) => {
        if (!args?.conf?.urlOrPath && !args?.searchFn) {
            throw new Error('Either urlOrPath or searchFn must be provided')
        }

        if (Object.keys(args.conf).includes('urlOrPath')) {
            const store = args.conf
            this.store = new StoreRetriever({
                urlOrPath: store?.urlOrPath,
                schema: store?.schema,
                store: store?.store,
                embbedgins: store?.embbedgins,
                httpConf: store?.httpConf
            })
        }else {
            this.store = new CustomRetriever(args.searchFn, args?.fields)
        }
        return this
    }

    static setStructuredLayer = <T>(schema: ZodType<T, ZodTypeDef, T>, cb: (ctx: BotContext, methods: BotMethods) => Promise<void>, opts?: { capture: boolean, aiModel?: AiModel }) => {
        const { capture, aiModel } = opts
        this.kwrd = this.kwrd.addAction({ capture }, 
            new StructLayer(schema, aiModel).createCallback(cb))
        return this
    }

    static setContextLayer = <T>(schema: ZodType<T, ZodTypeDef, T>, cb: (ctx: BotContext, methods: BotMethods) => Promise<void>, opts?: { capture: boolean, aiModel?: AiModel }) => {
        const { capture, aiModel } = opts
        this.kwrd = this.kwrd.addAction({ capture }, 
            new TransformLayer(schema, aiModel).createCallback(cb))
        return this
    }

    static pipe = (fn: (flow: TFlow<any, any>) => TFlow<any, any>) => {
        this.kwrd = fn(this.kwrd)
        return this
    }

    static createRunnable = (opts?: RunnableConf, callbacks?: Callbacks) => {
        let contextual = new ContextualCompression(opts?.contextual?.retriever || this.store, opts?.contextual?.contextOpts);
        let model: FactoryModel = new FactoryModel(opts?.aiModel);

        this.schema = opts?.answerSchema 
            || this.schema || z.object({ answer: z.string().describe('Answer as best possible') })

        const format_instructions = new StructuredOutputParser(this.schema).getFormatInstructions()

        this.kwrd = this.kwrd.addAction(async (ctx, { state }) => {
            try {
                if (ctx?.context && typeof ctx.context === 'object') {
                    ctx.context = Object.values(ctx.context).join(' ')
                }else if (Array.isArray(ctx.context)) {
                    ctx.context = ctx.context.join(' ')
                }

                const context = await contextual.invoke(ctx?.context || ctx.body)
                const mapContext = context.map(doc => doc.pageContent).join('\n')
                
                const answer = await new Runnable(model.model, opts?.prompt).retriever(
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