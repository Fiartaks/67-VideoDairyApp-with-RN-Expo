import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native'
import Slider from '@react-native-community/slider'
import * as ImagePicker from 'expo-image-picker'
import { Video } from 'expo-av'
import { FFmpegKit } from 'ffmpeg-kit-react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { useVideoStore } from '../../store/videoStore'
import * as FileSystem from 'expo-file-system'

enum CropStep {
  SELECT,
  CROP,
  METADATA
}

const convertContentUriToFileUri = async (contentUri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(contentUri)
    if (fileInfo.exists && fileInfo.uri) {
      return fileInfo.uri
    }
    throw new Error('Video file not found')
  } catch (error) {
    console.error('URI conversion error:', error)
    throw error
  }
}

export default function CropModal() {
  const [step, setStep] = useState<CropStep>(CropStep.SELECT)
  const [videoUri, setVideoUri] = useState<string>()
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(5)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        alert('Permission to access media library is required!')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: false,
      })

      if (!result.canceled && result.assets[0].uri) {
        setVideoUri(result.assets[0].uri)
        setStep(CropStep.CROP)
      }
    } catch (error) {
      console.error('Video picker error:', error)
      alert('Error selecting video')
    }
  }

  const processVideo = async () => {
    try {
      if (!videoUri) throw new Error('No video selected')

      // URI dönüşümü
      const fileUri = await convertContentUriToFileUri(videoUri)
      console.log('Converted File URI:', fileUri)

      // Çıktı dosyası yolu
      const outputPath = `${FileSystem.documentDirectory}${Date.now()}.mp4`
      console.log('Output Path:', outputPath)

      // FFmpeg komutu
      const command = `-y -i "${fileUri}" -ss ${start} -t ${end - start} -c copy "${outputPath}"`
      console.log('FFmpeg Command:', command)

      // FFmpeg komutunu çalıştır
      const session = await FFmpegKit.execute(command)
      console.log('FFmpeg Session Started')

      // Return code'u al
      const returnCode = await session.getReturnCode()
      console.log('FFmpeg Return Code:', returnCode)

      // Logları görüntüle
      const logs = await session.getLogs()
      logs.forEach(log => console.log('FFmpeg Log:', log.getMessage()))

      // Hata durumunda
      if (!returnCode.isValueSuccess()) {
        const failLog = await session.getFailStackTrace()
        console.error('FFmpeg Failed:', failLog)
        throw new Error(`FFmpeg failed: ${failLog}`)
      }

      console.log('Video processing successful. Output:', outputPath)
      return outputPath

    } catch (error) {
      console.error('Video processing error:', error)
      throw new Error(`Processing failed: ${error.message}`)
    }
  }

  const { mutate: handleProcessVideo, isPending } = useMutation({
    mutationFn: processVideo,
    onSuccess: (outputUri) => {
      useVideoStore.getState().addVideo({
        uri: outputUri,
        name,
        description,
        start,
        end
      })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      setStep(CropStep.SELECT)
      alert('Video successfully saved!')
    },
    onError: (error) => {
      console.error('Mutation error:', error)
      alert(`Error: ${error.message}`)
    }
  })

  return (
    <View className="flex-1 bg-gray-100 p-4">
      {step === CropStep.SELECT && (
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-xl text-gray-700 mb-4">Select a video to clip</Text>
          <Pressable
            onPress={pickVideo}
            className="bg-blue-500 px-8 py-4 rounded-full active:bg-blue-600"
          >
            <Text className="text-white text-lg font-medium">Choose Video</Text>
          </Pressable>
          <Link href="../" asChild>
            <Pressable className="mt-8">
              <Text className="text-gray-500 text-sm">Cancel</Text>
            </Pressable>
          </Link>
        </View>
      )}

      {step === CropStep.CROP && videoUri && (
        <View className="flex-1">
          <Video
            source={{ uri: videoUri }}
            className="w-full h-64 bg-black rounded-xl"
            useNativeControls
            resizeMode="contain"
          />
          
          <View className="mt-8 bg-white p-4 rounded-xl shadow-sm">
            <Text className="text-lg font-semibold mb-4">
              Select 5-second clip ({end - start}s)
            </Text>
            
            <Slider
              minimumValue={0}
              maximumValue={30}
              step={0.5}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#e5e7eb"
              thumbTintColor="#3b82f6"
              value={start}
              onSlidingComplete={(value) => {
                if (value + 5 <= 30) {
                  setStart(value)
                  setEnd(value + 5)
                }
              }}
            />
            
            <View className="flex-row justify-between mt-4">
              <Pressable
                onPress={() => setStep(CropStep.SELECT)}
                className="bg-gray-200 px-6 py-2 rounded-lg active:bg-gray-300"
              >
                <Text className="text-gray-700 font-medium">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(CropStep.METADATA)}
                className="bg-blue-500 px-6 py-2 rounded-lg active:bg-blue-600"
              >
                <Text className="text-white font-medium">Next</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {step === CropStep.METADATA && (
        <View className="flex-1">
          <View className="bg-white p-4 rounded-xl shadow-sm">
            <Text className="text-lg font-semibold mb-4">Add Details</Text>
            
            <TextInput
              placeholder="Clip Name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              className="border border-gray-200 p-3 rounded-lg mb-4 text-gray-800"
              maxLength={50}
            />
            
            <TextInput
              placeholder="Description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="border border-gray-200 p-3 rounded-lg h-32 text-gray-800"
              maxLength={200}
            />
            
            <View className="flex-row justify-between mt-8">
              <Pressable
                onPress={() => setStep(CropStep.CROP)}
                className="bg-gray-200 px-6 py-2 rounded-lg active:bg-gray-300"
              >
                <Text className="text-gray-700 font-medium">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => handleProcessVideo()}
                disabled={isPending}
                className={`bg-blue-500 px-6 py-2 rounded-lg ${
                  isPending ? 'opacity-50' : 'active:bg-blue-600'
                }`}
              >
                {isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-medium">Save Clip</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}