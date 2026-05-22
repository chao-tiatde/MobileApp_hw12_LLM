import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    // 使用內建的 KeyboardAvoidingView 來處理鍵盤擋住輸入框的問題
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* 狀態列設定（電量、時間那行），可依你的設計調整為 light 或 dark */}
      <StatusBar style="auto" />

      {/* 路由導航的核心：Stack */}
      <Stack>
        {/* index 代表首頁（app/index.js 或 index.tsx） */}
        <Stack.Screen 
          name="index" 
          options={{ 
            title: '首頁',
            headerShown: false, // 如果你自己有刻 Navigation Bar，可以把這行設為 false
          }} 
        />
        
        {/* 如果你有其他頁面，可以在這裡繼續設定，例如：
        <Stack.Screen name="login" options={{ title: '登入' }} /> 
        */}
      </Stack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});