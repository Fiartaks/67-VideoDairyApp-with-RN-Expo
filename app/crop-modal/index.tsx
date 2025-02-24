import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useVideoStore } from '../../store/videoStore';
import Slider from '@react-native-community/slider';
import { cropVideo, convertContentUriToFileUri } from '@/utils/ffmpeg'; // ffmpeg.ts'den import

// CropStep Enumeration
enum CropStep {
  SELECT,
  CROP,
  METADATA,
}

// VideoCropper Component
interface VideoCropperProps {
  videoUri: string;
  onCropComplete: (uri: string, duration: number) => void;
}

const VideoCropper = ({ videoUri, onCropComplete }: VideoCropperProps) => {
  const videoRef = React.useRef<Video>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && !duration) {
      setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
    }
  };

  const handleSliderChange = (value: number) => {
    setStartTime(value);
    if (videoRef.current) {
      videoRef.current.setPositionAsync(value * 1000);
    }
  };

  const handleProcess = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting video processing with URI:', videoUri);
      // URI'yi file URI'ye çevir
      const fileUri = await convertContentUriToFileUri(videoUri);
      // 5 saniyelik bir bölüm kırp
      const outputUri = await cropVideo(fileUri, startTime, startTime + 5);
      console.log('Processing completed successfully:', outputUri);
      onCropComplete(outputUri, 5); // Kırpılan süre sabit 5 saniye
    } catch (error) {
      console.error('Detailed error in handleProcess:', error);
      let errorMessage = 'Failed to process video. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="w-full p-4">
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={{ width: '100%', height: 250 }}
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls
        shouldPlay={false}
      />
      <View className="mt-4">
        <Text className="text-center mb-2">
          Select start point (5 seconds will be processed)
        </Text>
        <Slider
          value={startTime}
          onValueChange={handleSliderChange}
          minimumValue={0}
          maximumValue={Math.max(0, duration - 5)}
          step={0.1}
          disabled={isProcessing}
        />
        <Text className="text-center">Start Time: {startTime.toFixed(1)}s</Text>
      </View>
      <Pressable
        className={`${isProcessing ? 'bg-gray-500' : 'bg-green-500'} p-4 rounded-lg mt-4`}
        onPress={handleProcess}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <View className="flex-row justify-center items-center">
            <ActivityIndicator color="white" />
            <Text className="text-white text-center ml-2">Processing...</Text>
          </View>
        ) : (
          <Text className="text-white text-center">Process Video</Text>
        )}
      </Pressable>
    </View>
  );
};

// CropModal Component
export default function CropModal() {
  const [step, setStep] = useState<CropStep>(CropStep.SELECT);
  const [videoUri, setVideoUri] = useState<string>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        setVideoUri(result.assets[0].uri);
        setStep(CropStep.CROP);
      }
    } catch (error) {
      console.error('Video picker error:', error);
      alert('Error selecting video');
    }
  };

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
        <VideoCropper
          videoUri={videoUri}
          onCropComplete={(uri, duration) => {
            useVideoStore.getState().addVideo({
              uri,
              name,
              description,
              start: 0,
              end: 5,
            });
            queryClient.invalidateQueries(['videos']);
            setStep(CropStep.METADATA); 
          }}
        />
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
                onPress={() => {
                  setStep(CropStep.SELECT); 
                  alert('Video successfully saved!');
                }}
                className="bg-blue-500 px-6 py-2 rounded-lg active:bg-blue-600"
              >
                <Text className="text-white font-medium">Save Clip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}