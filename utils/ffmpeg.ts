import { FFmpegKit } from 'ffmpeg-kit-react-native'
import * as FileSystem from 'expo-file-system'

/**
 * Video dosyasını kırpar.
 * @param inputUri - Giriş video dosyasının URI'si.
 * @param start - Kırpma işleminin başlangıç saniyesi.
 * @param end - Kırpma işleminin bitiş saniyesi.
 * @returns Kırpılan video dosyasının URI'si.
 */
export const cropVideo = async (inputUri: string, start: number, end: number): Promise<string> => {
  try {
    // Çıktı dosyası yolu
    const outputPath = `${FileSystem.documentDirectory}${Date.now()}.mp4`
    console.log('Output Path:', outputPath)

    // FFmpeg komutu
    const command = `-y -i "${inputUri}" -ss ${start} -t ${end - start} -c:v libx264 -c:a aac "${outputPath}"`
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

/**
 * Content URI'yi file URI'ye dönüştürür.
 * @param contentUri - Content URI (örneğin, `content://media/external/video/media/1234`).
 * @returns File URI (örneğin, `file:///storage/emulated/...`).
 */
export const convertContentUriToFileUri = async (contentUri: string): Promise<string> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(contentUri)
    if (fileInfo.exists && fileInfo.uri) {
      console.log('Converted URI:', fileInfo.uri)
      return fileInfo.uri
    }
    throw new Error('Video file not found')
  } catch (error) {
    console.error('URI conversion error:', error)
    throw error
  }
}