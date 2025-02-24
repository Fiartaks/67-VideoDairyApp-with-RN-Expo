import FFmpegKit, { FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

interface ProcessVideoResult {
  uri: string;
  duration: number;
}

export const processVideo = async (
  videoUri: string,
  startTime: number,
  duration: number = 5
): Promise<ProcessVideoResult> => {
  try {
    console.log('Starting video processing with params:', {
      videoUri,
      startTime,
      duration
    });

    // FFmpegKit'i başlat
    await FFmpegKitConfig.init();
    console.log('FFmpegKit initialized');

    // Çıktı dosyası için yeni bir path oluştur
    const timestamp = new Date().getTime();
    const outputUri = `${FileSystem.documentDirectory}processed_${timestamp}.mp4`;
    
    console.log('Output URI:', outputUri);

    // Video URI'yi düzelt
    const inputUri = videoUri.replace('file://', '');
    console.log('Input URI:', inputUri);

    // FFMPEG komutu oluştur
    const command = `-ss ${startTime} -t ${duration} -i "${inputUri}" -c:v copy -c:a copy "${outputUri}"`;
    console.log('FFmpeg command:', command);

    // FFMPEG işlemini başlat
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log('Video processing completed successfully');
      return {
        uri: outputUri,
        duration: duration
      };
    } else {
      throw new Error(`FFmpeg process failed with return code: ${returnCode}`);
    }
  } catch (error) {
    console.error('Error in processVideo:', error);
    throw error;
  }
}; 