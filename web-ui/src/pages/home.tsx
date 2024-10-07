import { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { socket } from "../lib";
import style from "./home.module.css";
import * as monaco from "monaco-editor";
import { loader, Editor } from "@monaco-editor/react";
import { Alert, Button, Card, Space } from "antd";
loader.config({
  monaco
});
type ErrorEventType = {
  log: string;
  message: string;
  link?: string;
};
export default memo(function Home() {
  const refEditor = useRef(null);
  const refSubtitleList = useRef<string[]>([]);
  const refErrors = useRef<ErrorEventType[]>([]);
  const refIsConnectError = useRef<boolean>(false);
  const refLogHistory = useRef<string[]>([]);
  const updateKey = useRef(Date.now());
  useEffect(() => {
    const editor = (refEditor.current as any);
    if (refErrors.current.length === 0) {
      editor?.revealLine(editor.getModel().getLineCount() + 10);
    }
  }, [updateKey.current]);
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connect");
      refIsConnectError.current = false;
      updateKey.current = Date.now();
    });
    socket.on("connect_error", error => {
      console.error("connect error", {
        error
      });
      refIsConnectError.current = true;
      refErrors.current = [];
      updateKey.current = Date.now();
    });
    const update = (text: string) => {
      if (refSubtitleList.current[refSubtitleList.current.length - 1] !== text) {
        const newSubtitleList = [...refSubtitleList.current, text];
        refSubtitleList.current = newSubtitleList;
        updateKey.current = Date.now();
      }
    };
    socket.on("subtitle", (value: {
      zh: string;
      en: string;
    }) => {
      update(`${value?.en}\n${value?.zh}`);
    });
    socket.on("language-shadow-error", (value: ErrorEventType) => {
      console.error("lanaguage shadow error", {
        value
      });
      refErrors.current = [...refErrors.current, value];
      updateKey.current = Date.now();
    });
    socket.on("log-history", (value: {
      logHistory: string[];
    }) => {
      console.error("log history", {
        value
      });
      refLogHistory.current = [...value.logHistory];
      updateKey.current = Date.now();
    });
  }, []);
  function handleEditorDidMount(editor: any) {
    refEditor.current = editor;
  }
  const editorValue = refErrors.current.length === 0 ? refSubtitleList.current.join("\n\n") : refLogHistory.current.join("\n\n");
  return <div className={style.container}>
      <div className={style.header}>
        <a href="https://rerender2021.github.io/products/language-shadow/" target="_blank">
          <img src="/logo.png" alt="logo" className={style.logo}></img>
        </a>
      </div>
      <div className={style.errors}>
        <Space direction="vertical" size="middle" style={{
        display: "flex",
        alignItems: "flex-start"
      }}>
          {refIsConnectError.current && <Alert message="Language Shadow 尚未启动, 或无法连接到它。" type="error" showIcon />}
          {refErrors.current.map(each => {
          return <Alert key={each.log} message={<>
                    {each.message}
                    {each?.link && <Button type="link" href={each?.link} target="_blank">
                        查看参考文档
                      </Button>}
                  </>} type="error" showIcon />;
        })}
        </Space>
      </div>
      <Card className={style.subtitleList}>
        <Editor height="550px" defaultLanguage="plaintext" value={editorValue} onMount={handleEditorDidMount} options={{
        wordWrap: "on"
      }} />
      </Card>
    </div>;
});