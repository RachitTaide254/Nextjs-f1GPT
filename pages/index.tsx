import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import React, { useState, useEffect } from "react";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatGroq } from "@langchain/groq";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
// console.log(openAIApiKey,'openAIApiKey')

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_API_KEY
);

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState("");
  const handleClick = async () => {
    const resp = await callAi(input);
    setData(resp);
    setInput('')
  };
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pl-8 pr-8 pb-20 gap-0 sm:p-10 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={680}
          height={18}
          priority
        />
        <div>{data}</div>
        <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // minHeight: '100vh',
        }}
      >

        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleClick(); 
            }
          }}
          placeholder="Ask me anything on current(2023-2025) F1 news"
          style={{
            border: '2px solid grey',  
            borderRadius: '6px',
            padding: '12px 16px',
            outline: 'none',
            width: '400px',              
            fontSize: '16px'
          }}
          ></input>
        <button style={{
            border: '2px solid grey',  
            borderRadius: '6px',
            padding: '12px 16px',
            outline: 'none',
            width: '100px',           
            fontSize: '16px'
          }}
           onClick={handleClick}>Send</button>
          </div>
      </main>
    </div>
  );
}

async function callAi(req: string) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey,
    });
    // const model = new ChatOpenAI({
    //   model: "gpt-4o",
    //   temperature: 0,
    //   openAIApiKey: openAIApiKey,
    // });
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      maxTokens: undefined,
      // maxRetries: 2,
      apiKey:process.env.NEXT_PUBLIC_GROQ_API_KEY
    });
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
    const prompt =
      ChatPromptTemplate.fromTemplate(`You are a helpful and enthusiastic support bot who can answer a given question about treatment sudies based on the context provided. Try to find the answer in the context.
      If you really don't know the answer, say "I'm sorry, I don't know the answer to that."And direct the questioner to email help@world.Don't try to make up an answer.
      Always speak as if you were chatting to a friend.
      context: {context}
      question: {input}
      answer:`);

    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt,
    });
    const retriever = vectorStore.asRetriever();
    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever,
    });

    const response = await retrievalChain.invoke({ input: req });
    return response.answer;
  } catch (e) {
    console.log(e, "err in api");
  }
} //who is rohit? highest paid driver?
