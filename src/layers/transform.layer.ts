import { ModelArgs, ModelName } from "../types";
import { FactoryModel } from "../ai";
import { ZodSchema, ZodType, ZodTypeDef } from "zod";
import {  BotContext, BotMethods } from "@builderbot/bot/dist/types";
import { schemasFn } from "../ai/functions";
import z from "zod"

export default class TransformLayer {

    static create = <T>(schema: ZodType<T, ZodTypeDef, T>, model: { modelName: ModelName, args?: ModelArgs }, cb: (ctx: BotContext, methods: BotMethods) => Promise<any>) => {
        
        return  async (ctx: BotContext, methods: BotMethods) => {
            try {
                const format =  await schemasFn(ctx.body, schema, new FactoryModel(model), methods.state) as z.infer<typeof schema>
                ctx.context = format          
            } catch (error) {
                ctx.context = null
            }

            return await cb(ctx, methods)
            
        }

        
    }
}

