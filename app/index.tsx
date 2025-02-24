import { FlatList, Pressable, Text, View } from 'react-native'
import { Link } from 'expo-router'
import { useVideoStore } from '../store/videoStore'

export default function HomeScreen() {
  const { videos } = useVideoStore()

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Link href={`/details/${item.id}`} asChild>
            <Pressable className="bg-white p-4 rounded-lg mb-4 shadow-md">
              <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
              <Text className="text-gray-500 mt-1 text-sm">{item.description}</Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-400 text-lg">No videos added yet</Text>
          </View>
        }
      />

      <Link href="/crop-modal" asChild>
        <Pressable className="absolute bottom-8 right-8 bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-xl">
          <Text className="text-white text-3xl">+</Text>
        </Pressable>
      </Link>
    </View>
  )
}