import React, { useState, useEffect, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 填入你的 API Key
const GEMINI_API_KEY = "AIzaSyAkSgKOG3OcAqLzf7ulbABfybMMI38Y0Dc"; 

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  // 組件載入時，從本地儲存讀取歷史訊息
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("@chat_history");
      if (savedHistory !== null) {
        setMessages(JSON.parse(savedHistory));
      } else {
        setMessages([
          { id: "welcome", text: "你好！我是 Gemini，今天想聊點什麼或分析什麼呢？", isUser: false }
        ]);
      }
    } catch (e) {
      console.error("讀取歷史紀錄失敗:", e);
    }
  };

  // 儲存訊息到本地紀錄
  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem("@chat_history", JSON.stringify(newMessages));
    } catch (e) {
      console.error("儲存歷史紀錄失敗:", e);
    }
  };

  // 清除歷史紀錄
  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("@chat_history");
      setMessages([{ id: "welcome", text: "歷史紀錄已清除。有什麼我可以幫忙的？", isUser: false }]);
    } catch (e) {
      console.error("清除歷史紀錄失敗:", e);
    }
  };

  // 發送訊息給 Gemini (改用原生 fetch API)
  const handleSend = async () => {
    if (inputText.trim() === "" || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    saveChatHistory(updatedMessages);

    // 格式化歷史紀錄給 Gemini API
    const apiContents = updatedMessages
      .filter(msg => msg.id !== "welcome")
      .map(msg => ({
        role: msg.isUser ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    try {
      // 改用標準的 HTTP Fetch 請求，對接 gemini-2.5-flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: apiContents,
          }),
        }
      );

      const data = await response.json();
      
      // 解析 Gemini 回傳的 JSON 結構
      const responseText = data.candidates[0].content.parts[0].text;

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      console.error("Gemini API 錯誤:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "抱歉，連線出了點問題，請稍後再試。",
        isUser: false,
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }) => (
    <View style={[styles.messageRow, item.isUser ? styles.userRow : styles.aiRow]}>
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={item.isUser ? styles.userText : styles.aiText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* 頁首標題與作者資訊 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wk1 雲端聊天室</Text>
          <Text style={styles.subtitle}>數位三甲/111219007/趙翊如</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.clearButtonText}>清除紀錄</Text>
        </TouchableOpacity>
      </View>

      {/* 對話訊息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 輸入欄位區域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="輸入訊息..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.disabledButton]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>發送</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F8",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "600",
  },
  messageList: {
    padding: 16,
    paddingBottom: 30,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    width: "100%",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  aiRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  userText: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: "#2C2C2C",
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  disabledButton: {
    backgroundColor: "#B4D5FF",
  },
  sendButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
});