import { Chat } from "@/components/Chat";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { db } from "@/firebase";
import {
  collection,
  query,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";

const messageCollection = collection(db, "chat_history");

let didInit = false;
let index = 0;

export default function Home() {
  /*
    메시지 목록을 저장하는 상태로, 메시지의 형태는 다음과 같음
    { role: "system" | "user" | "assistant", content: string }

    role 에 대한 상세한 내용은 다음 문서를 참고
    https://platform.openai.com/docs/guides/chat/introduction

    ex)
    [
      { role: "system", content: "너의 이름을 엘리엇이고, 나의 AI 친구야. 친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘. 반말로 대답해줘." },
      { role: "assistant", content: "안녕? 나는 엘리엇이야. 오늘은 무슨 일이 있었니?" }
      { role: "user", content: "오늘 재미난 일이 있었어! 한 번 들어볼래?" },
      ...
    ]
  */
  const [messages, setMessages] = useState([]);
  // 메시지를 전송 중인지 여부를 저장하는 상태
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 메시지 목록을 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 채팅 내역을 불러오는 함수
  const getMessages = async () => {
    // Firestore 쿼리를 만듭니다.
    const q = query(
      messageCollection,
      orderBy("index")
    );

    // Firestore 에서 채팅 내역을 조회합니다.
    const results = await getDocs(q);
    const prevMessages = [];
    
    // 가져온 채팅 내역을 prevMessages 배열에 담습니다.
    index = 0;
    results.docs.forEach((doc) => {
      index++;
      prevMessages.push(doc.data());
    });

    if (index === 0) {
      initialize();
    } else {
      setMessages(prevMessages);
    }
  };

  // 메시지를 전송하는 함수
  const handleSend = async (message) => {
    // message 를 받아 메시지 목록에 추가
    // message 형태 = { role: "user", content: string }
    // ChatInput.js 26번째 줄 참고
    await addDoc(messageCollection, {
      index: ++index,
      role: message.role,
      content: message.content
    });
    const updatedMessages = [...messages, { index: index, role: message.role, content: message.content }];
    // console.log(updatedMessages);
    // console.log(updatedMessages.slice(-6));

    setMessages(updatedMessages);
    // 메시지 전송 중임을 표시
    setLoading(true);

    // /api/chat 에 메시지 목록을 전송하고 응답을 받음
    // 메시지 목록의 마지막 6개만 전송
    // API에 전송하기 전 index key를 제거
    const messagesList = [];
    updatedMessages.slice(-6).forEach((msg) => {
      messagesList.push({ role: msg.role, content: msg.content });
    });

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messagesList,
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    // 응답을 JSON 형태로 변환
    // 비동기 API 를 사용하여 응답을 받기 때문에 await 사용
    const result = await response.json();

    if (!result) {
      return;
    }

    // console.log(result);

    // 로딩 상태를 해제하고, 메시지 목록에 응답을 추가
    setLoading(false);
    await addDoc(messageCollection, {
      index: ++index,
      role: result.role,
      content: result.content
    });
    setMessages((messages) => [...messages, { index: index, role: result.role, content: result.content }]);
  };

  // 메시지 목록을 초기화하는 함수
  // 처음 시작할 메시지를 설정
  const initialize = async () => {
    if (didInit) {
      index = 1;
      return;
    }

    didInit = true;

    await addDoc(messageCollection, {
      index: ++index,
      role: "assistant",
      content: "안녕하세요? 저는 당신의 인공지능 비서 민준이라고 합니다. 무엇을 도와드릴까요?"
    });

    setMessages([
      {
        index: index,
        role: "assistant",
        content: "안녕하세요? 저는 당신의 인공지능 비서 민준이라고 합니다. 무엇을 도와드릴까요?"
      },
    ]);
  };

  const reset = async () => {
    if (confirm("Are you sure want to delete chat history?")) {
      index = 0;

      const q = query(messageCollection);
      const results = await getDocs(q);
      results.docs.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      didInit = false;
      initialize();
    }
  }

  // 메시지 목록이 업데이트 될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트가 처음 렌더링 될 때 채팅 내역을 불러옴
  useEffect(() => {
    getMessages();
  }, []);

  return (
    <>
      <Head>
        <title>A Personal Assistant</title>
        <meta name="description" content="A Personal Assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col h-screen">
        <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
          <div className="font-bold text-3xl flex text-center">
            <a
              className="ml-2 hover:opacity-50"
              href="/"
            >
              A Personal Assistant
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
            {/*
              메인 채팅 컴포넌트
              messages: 메시지 목록
              loading: 메시지 전송 중인지 여부
              onSendMessage: 메시지 전송 함수
            */}
            <Chat
              messages={messages}
              loading={loading}
              onSendMessage={handleSend}
              onClear={reset}
            />
            {/* 메시지 목록의 끝으로 스크롤하기 위해 참조하는 엘리먼트 */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 py-2 px-8 items-center sm:justify-between justify-center"></div>
      </div>
    </>
  );
}
