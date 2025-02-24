import { View, Text } from 'react-native'
import { Video } from 'expo-av'
import { useLocalSearchParams } from 'expo-router'
import { useVideoStore } from '../../store/videoStore'

export default function VideoDetailScreen() {
  const { videoId } = useLocalSearchParams()
  const { videos } = useVideoStore()
  const video = videos.find(v => v.id === videoId)

  if (!video) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500 text-lg">Video not found!</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Video
        source={{ uri: video.uri }}
        className="w-full h-64 bg-black rounded-xl"
        useNativeControls
        resizeMode="contain"
        isLooping
      />
      
      <View className="mt-6 bg-white p-4 rounded-xl shadow-sm">
        <Text className="text-2xl font-bold text-gray-800 mb-2">{video.name}</Text>
        <Text className="text-gray-600 text-base leading-5">{video.description}</Text>
        
        <View className="mt-4 border-t pt-4 border-gray-200">
          <Text className="text-gray-400 text-sm">
            Clip Duration: {video.end - video.start}s
          </Text>
        </View>
      </View>
    </View>
  )
}