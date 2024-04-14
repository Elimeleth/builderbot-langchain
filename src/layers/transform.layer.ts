import { ModelArgs, ModelName } from "../types";
import { FactoryModel } from "../ai";
import { ZodSchema, ZodType, ZodTypeDef } from "zod";
import {  BotContext, BotMethods } from "@builderbot/bot/dist/types";
import { schemasFn } from "../ai/functions";
import z from "zod"

export default class TransformLayer {
    private static schema: ZodSchema
    private static model: FactoryModel

    static setZodSchema = <T>(schema: ZodType<T, ZodTypeDef, T>) => {
        this.schema = schema
        return this
    }

    static setAIModel = (ai?: { modelName: ModelName, args?: ModelArgs }) => {
        this.model = new FactoryModel(ai)
        return this
    }

    static create = (cb: (ctx: BotContext, methods: BotMethods) => Promise<any>) => {
        if (!this.schema) {
            throw new Error('You must set the zod schema method first')
        }

        if (!this.model) {
            this.model = new FactoryModel()
        }

        return async (ctx: BotContext, methods: BotMethods) => {
            try {
                const schema = await schemasFn(ctx.body, this.schema, this.model, methods.state) as z.infer<typeof this.schema>
                ctx.context = schema          
            } catch (error) {
                ctx.context = null
            }

            return await cb(ctx, methods)
            
        }

        
    }
}

