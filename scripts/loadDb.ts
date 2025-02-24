import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAi from "openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings,ChatOpenAI} from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { StringOutputParser } from "@langchain/core/output_parsers";


const {
  OPENAI_API_KEY,
  SUPABASE_URL,
  SUPABASE_API_KEY
} = process.env;

//const openai = new OpenAi({apiKey:OPENAI_API_KEY})
const model = new ChatOpenAI({temperature: 0});
const openAIApiKey = process.env.OPENAI_API_KEY;
type SimilarityMetric = "dot_product" | "cosine" | "euclidean"
try{

  const func = async()=>{

 
  const f1Data =[
    "https://en.wikipedia.org/wiki/Formula_One",
    "https://www.formula1.com/en/latest/all",
    "https://www.formula1.com/en/racing/2024.html",
    "https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/"
  ]
  
  const docs = await Promise.all(
    f1Data.map((url:string) => new CheerioWebBaseLoader(url).load()),
    );
    const docsList = docs.flat();
    
    //console.log(docsList,'mkop')
    
    const splitter = new RecursiveCharacterTextSplitter();
    
    const splitDocs = await splitter.splitDocuments(docsList);
    
    const embeddings = new OpenAIEmbeddings();
    // const vectorstore = await MemoryVectorStore.fromDocuments(
      //   splitDocs,
      //   embeddings
      // );
      
      const client = createClient(SUPABASE_URL,SUPABASE_API_KEY);
      //console.log(client,'kop')
      const store = new SupabaseVectorStore(
        new OpenAIEmbeddings({openAIApiKey}),
           {
               client,
               tableName:"documents",
           }
          )
       const stored = await store.addDocuments(splitDocs);
   
}
func()


}catch(e){
  console.log(e,'err')
}