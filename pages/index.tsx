import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import React, { useState, useEffect } from "react";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openAIApiKey = process.env.OPENAI_API_KEY;
const client = createClient(
  "https://kdtfdxskd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCIZSIsInJlZiI6ImtkdGZkeHd5c2NuaW5rbWRhc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjE3OTUsImV4cCI6MjA0OTU5Nzc5NX0.LiuMfQFDx5pX2HuJSD28rNroEFeZ_l1xwa-iPVXsrI8"
);

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState("");
  const handleClick = async () => {
    const resp = await callAi(input);
    setData(resp);
  };
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div>{data}</div>
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask me anything on current F1 news"
        ></input>
        <button onClick={handleClick}>Send</button>
      </main>
    </div>
  );
}

async function callAi(req: string) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey,
    });
    const model = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      openAIApiKey: openAIApiKey,
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
