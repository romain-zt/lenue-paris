export {
  extractDocumentChunks,
  type DocumentChunk,
} from "./chunkDocument";
export {
  createEmbedding,
  createEmbeddings,
  isEmbeddingConfigured,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embeddings";
export {
  indexDocument,
  indexGlobal,
  deleteDocumentIndex,
  reindexAllContent,
  type IndexDocumentResult,
  type ReindexAllResult,
} from "./indexContent";
export { semanticSearch } from "./semanticSearch";
export {
  createCollectionIndexHook,
  createCollectionDeleteHook,
  createGlobalIndexHook,
} from "./contentIndexHooks";
