"use client";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";

const apiKey = "sec_jPCBzEye7iQA38mza2upVdBGnz2xOBVH";

interface IMessage {
  role: string;
  content: string;
}

interface IUploadResponse {
  sourceId: string;
}

async function uploadFile(
  file: File,
  setUploadResponse: Dispatch<SetStateAction<IUploadResponse>>
) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      "https://api.chatpdf.com/v1/sources/add-file",
      {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": apiKey,
        },
      }
    );

    const data = await response.json();

    setUploadResponse(data); // Update state with the response
    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // State to store the response from the upload
  const [uploadResponse, setUploadResponse] = useState<IUploadResponse>({
    sourceId: "",
  });
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [newQuestionAdded, setNewQuestionAdded] = useState<boolean>(false);

  useEffect(() => {
    if (uploadResponse.sourceId && newQuestionAdded) {
      fetchAnswers(uploadResponse.sourceId, messages);
      setNewQuestionAdded(false);
    }
  }, [uploadResponse.sourceId, newQuestionAdded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const addQuestion = (question: string) => {
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setNewQuestionAdded(true);
  };

  async function fetchAnswers(sourceId: string, messages: IMessage[]) {
    let sendingMessages = messages.map((msg) => ({ ...msg }));
    const len = messages.length;
    sendingMessages[len - 1].content =
      messages[len - 1].content +
      " Please write the relevant html web page link instead of page numbers if it exists. Don't write the page numbers!"; // prompt engineering

    try {
      const response = await fetch("https://api.chatpdf.com/v1/chats/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          sourceId,
          messages: sendingMessages,
          referenceSources: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setMessages([...messages, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:p-24 p-10">
      <h1 className="text-3xl font-bold">ChatPDF</h1>
      <div className="flex flex-col items-center w-full">
        {!uploadResponse.sourceId && (
          <div className="flex flex-col items-center">
            <label
              htmlFor="file"
              className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Upload File
            </label>
            <input
              type="file"
              id="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadFile(file, setUploadResponse);
                }
              }}
            />
          </div>
        )}
        {uploadResponse.sourceId && (
          <div className="w-full space-y-2">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {messages?.map((message, key) => {
                return message.role === "user" ? (
                  <div className="flex justify-end my-2" key={key}>
                    <div className="bg-blue-600 text-white py-2 px-4 rounded-2xl max-w-xl">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start" key={key}>
                    <div className="bg-gray-300 text-black py-2 px-4 rounded-2xl max-w-2xl">
                      {message.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="space-x-2 flex">
              <input
                type="text"
                className="bg-gray border border-gray-700 py-2 px-4 rounded w-full"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue !== "") {
                    addQuestion(inputValue);
                    setInputValue(""); // Reset the input field
                  }
                }}
              />
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  addQuestion(inputValue);
                  setInputValue(""); // Reset the input field
                }}
              >
                Send
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => setMessages([])}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
