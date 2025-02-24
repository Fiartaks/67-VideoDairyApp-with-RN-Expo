import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { FFmpegKitConfig } from 'ffmpeg-kit-react-native'
import '../global.css'

const queryClient = new QueryClient()

export default function RootLayout() {
  useEffect(() => {
    // FFmpeg loglarını etkinleştir
    FFmpegKitConfig.enableLogCallback(log => {
      console.log('FFmpeg Log:', log.getMessage())
    })

    // FFmpeg istatistiklerini etkinleştir
    FFmpegKitConfig.enableStatisticsCallback(stats => {
      console.log('FFmpeg Stats:', stats)
    })

    console.log('FFmpegKit initialized successfully')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </QueryClientProvider>
  )
}