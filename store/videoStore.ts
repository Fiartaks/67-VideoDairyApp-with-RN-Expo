import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Video {
  id: string
  uri: string
  name: string
  description: string
  start: number
  end: number
}

interface VideoState {
  videos: Video[]
  addVideo: (video: Omit<Video, 'id'>) => void
  removeVideo: (id: string) => void
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      videos: [],
      addVideo: (video) => 
        set((state) => ({ 
          videos: [...state.videos, { ...video, id: Date.now().toString() }] 
        })),
      removeVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id)
        }))
    }),
    {
      name: 'video-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)