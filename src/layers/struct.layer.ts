import { ModelArgs, ModelName } from "../types";
import { FactoryModel } from "../ai";
import { ZodSchema, ZodType, ZodTypeDef } from "zod";
import {  BotContext, BotMethods } from "@builderbot/bot/dist/types";
import { schemasFn } from "../ai/functions";
import z from "zod"

export default class StructLayer {

    static create = <T>(schema: ZodType<T, ZodTypeDef, T>, model: { modelName: ModelName, args?: ModelArgs }, cb: (ctx: BotContext, methods: BotMethods) => Promise<any>) => {
        
        return async (ctx: BotContext, methods: BotMethods) => {
            try {
                const format = await schemasFn(ctx.body, schema, new FactoryModel(model), methods.state) as z.infer<typeof schema>
                ctx.schema = format          
            } catch (error) {
                ctx.schema = null
            }

            return await cb(ctx, methods)
        }

        
    }
}

