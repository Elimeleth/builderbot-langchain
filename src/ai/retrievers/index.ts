import {
    BaseRetriever,
    type BaseRetrieverInput,
  } from "@langchain/core/retrievers";
  import type { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
  import { Document } from "@langchain/core/documents";
  
  
  export class CustomRetriever extends BaseRetriever {
    lc_namespace = ["langchain", "retrievers"];
  
    constructor(private searchFn: (query: string) => Promise<any[]>, fields?: BaseRetrieverInput) {
      super(fields);
    }
  
    async _getRelevantDocuments(
      query: string,
      runManager?: CallbackManagerForRetrieverRun
    ): Promise<Document[]> {
      const results = await this.searchFn(query);
      
      return results.map((result) => new Document({ 
        pageContent: Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n'),
        metadata: result
    }))
    }
  }