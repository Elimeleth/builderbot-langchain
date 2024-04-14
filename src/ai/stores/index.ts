import httpRequest from "../../utils/http.request";
import { Document } from "@langchain/core/documents";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
import { BaseRetriever, BaseRetrieverInput } from "@langchain/core/retrievers";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

import { FastEmbedding } from "@builderbot-plugins/fast-embedding"
import { Embeddings } from "@langchain/core/embeddings";

export default class StoreRetriever extends BaseRetriever {
    lc_namespace = ["langchain", "retrievers"];
    constructor(
        private urlOrPath: string,
        private schema: string[],
        private store?: any,
        private embbedgins?: Embeddings,
        fields?: BaseRetrieverInput
        ) {
            super(fields)
            this.ingest().then(() => console.log('Ingested')).catch(err => {
                throw err
            })


        }

    private async ingest() {
        const embeddings = this?.embbedgins || new FastEmbedding('AllMiniLML6V2')

        if (!this.store) {
            this.store = HNSWLib
        } 

        if (!this.store?.fromDocuments) {
            throw new Error('Store must have a fromDocuments method')
        }

        const url_re = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (url_re.test(this.urlOrPath)) {
            if (!this.schema) {
                throw new Error('You must set the schema array first')
            }
            const data = await httpRequest(this.urlOrPath, {})

            if (!Array.isArray(data) || !data.length) {
                throw new Error('The data must be an array with at least one element')
            }

            const obj = data.map((d: any) => Object.keys(d).map(key => {
                    if (this.schema.includes(key)) {
                        return data[key]
                    }
                })
            )

            const documents = obj.map((d: any) => new Document({
                pageContent: Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'),
                metadata: d
            }))

            this.store = await this.store?.fromDocuments(documents, embeddings)

        }
        const loader = new DirectoryLoader(
            this.urlOrPath,
            {
              ".json": (path) => new JSONLoader(path, "/text"),
              ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
              ".txt": (path) => new TextLoader(path),
              ".pdf": (path) => new PDFLoader(path),
              ".csv": (path) => new CSVLoader(path, "text"),
            }
        );

        const documents = await loader.load();
        this.store = await this.store?.fromDocuments(documents, embeddings)

    }

    async _getRelevantDocuments(
        query: string,
        runManager?: CallbackManagerForRetrieverRun
      ): Promise<Document[]> {
        return await this.store.asRetriever()._getRelevantDocuments(query)
    }
}