import type { RequestStatusType } from '../../../data/constants';

export type VideoStatus =
  | 'Uploading'
  | 'In Progress'
  | 'Ready'
  | 'Uploaded'
  | 'Failed'
  | 'Cancelled'
  | 'Failed Duplicate'
  | 'YouTube Duplicate'
  | 'Invalid Token'
  | 'Imported'
  | 'Unknown'
  | 'Transcription in Progress'
  | 'Transcript Ready'
  | 'Partial Failure'
  | 'Transcript Failed';
export type VideoWrapperType = 'MOV' | 'MP4' | 'Unknown';
export type VideoTranscriptStatus = 'transcribed' | 'notTranscribed';
export type VideoActiveStatus = 'active' | 'inactive';

export interface RawVideo {
  edxVideoId: string;
  clientVideoId: string;
  created: string;
  courseVideoImageUrl: string | null;
  transcripts: string[];
  status: string;
  duration: number | null;
  downloadLink: string;
  fileSize: number;
  transcriptUrls: Record<string, string>;
  transcriptionStatus: string;
  errorDescription: string;
  statusNontranslated?: VideoStatus;
}

interface RawVideoResponse {
  edx_video_id: string;
  client_video_id: string;
  created: string;
  course_video_image_url: string | null;
  transcripts: string[];
  status: string;
  duration: number | null;
  download_link: string;
  file_size: number;
  transcript_urls: Record<string, string>;
  transcription_status: string;
  error_description: string;
  status_nontranslated?: VideoStatus;
}

export interface UsageLocation {
  displayLocation: string;
  url: string;
}
export interface Video extends Partial<RawVideo> {
  id: string;
  displayName: string;
  wrapperType?: VideoWrapperType;
  dateAdded?: string;
  usageLocations?: UsageLocation[] | null;
  thumbnail?: string | null;
  transcriptStatus?: VideoTranscriptStatus;
  activeStatus?: VideoActiveStatus;
}
export interface VideoImageSettings {
  videoImageUploadEnabled: boolean;
  maxSize: number;
  minSize: number;
  maxWidth: number;
  maxHeight: number;
  supportedFileFormats: Record<string, string>;
}
export interface VideoTranscriptSettings {
  transcriptDownloadHandlerUrl: string;
  transcriptUploadHandlerUrl: string;
  transcriptDeleteHandlerUrl: string;
  trancriptDownloadFileFormat: string;
  transcriptPreferencesHandlerUrl?: string | null;
  transcriptCredentialsHandlerUrl?: string | null;
  transcriptionPlans?: TranscriptionPlans | null;
}
export interface TranscriptAvailableLanguage {
  languageCode: string;
  languageText: string;
}
export interface VideoPageSettings {
  imageUploadUrl?: string;
  videoHandlerUrl?: string;
  encodingsDownloadUrl?: string;
  defaultVideoImageUrl?: string;
  previousUploads?: RawVideo[];
  concurrentUploadLimit?: number;
  videoSupportedFileFormats?: string[];
  videoUploadMaxFileSize?: string;
  videoImageSettings?: VideoImageSettings;
  isVideoTranscriptEnabled?: boolean;
  isAiTranslationsEnabled?: boolean;
  activeTranscriptPreferences?: TranscriptPreferencesState | null;
  transcriptCredentials?: Record<string, boolean> | null;
  transcriptAvailableLanguages?: TranscriptAvailableLanguage[];
  videoTranscriptSettings?: VideoTranscriptSettings;
  paginationContext?: Record<string, unknown> | null;
}
export interface VideoPageResponse {
  image_upload_url: string;
  video_handler_url: string;
  encodings_download_url: string;
  default_video_image_url: string;
  previous_uploads?: RawVideoResponse[];
  concurrent_upload_limit: number;
  video_supported_file_formats: string[];
  video_upload_max_file_size: string;
  video_image_settings: {
    video_image_upload_enabled: boolean;
    max_size: number;
    min_size: number;
    max_width: number;
    max_height: number;
    supported_file_formats: Record<string, string>;
  };
  is_video_transcript_enabled: boolean;
  is_ai_translations_enabled: boolean;
  active_transcript_preferences?: TranscriptPreferencesResponse | null;
  transcript_credentials: Record<string, boolean> | null;
  transcript_available_languages: Array<{ language_code: string; language_text: string; }>;
  video_transcript_settings: VideoTranscriptSettingsResponse;
  pagination_context?: Record<string, unknown> | null;
}
interface VideoTranscriptSettingsResponse {
  transcript_download_handler_url: string;
  transcript_upload_handler_url: string;
  transcript_delete_handler_url: string;
  trancript_download_file_format: string;
  transcript_preferences_handler_url?: string | null;
  transcript_credentials_handler_url?: string | null;
  transcription_plans?: TranscriptionPlans | null;
}
export interface TranscriptionPlan {
  display_name?: string;
  turnaround?: Record<string, string>;
  fidelity?: Record<string, { display_name: string; languages?: Record<string, string>; }>;
  languages?: Record<string, string>;
  translations?: Record<string, string[]>;
}
export type TranscriptionPlans = Record<string, TranscriptionPlan>;
export interface TranscriptPreferences {
  courseId?: string;
  cielo24Fidelity?: string;
  cielo24Turnaround?: string;
  global?: boolean;
  preferredLanguages?: string[];
  provider?: string;
  threePlayTurnaround?: string;
  videoSourceLanguage?: string;
  modified?: string;
}
export type TranscriptPreferencesForm = Omit<TranscriptPreferences, 'modified'> & { modified?: string | Date; };
export type TranscriptPreferencesState = Omit<TranscriptPreferences, 'modified'> & { modified?: string | Date; };
interface TranscriptPreferencesResponse {
  course_id: string;
  cielo24_fidelity: string;
  cielo24_turnaround: string;
  provider: string;
  preferred_languages: string[];
  three_play_turnaround: string;
  video_source_language: string;
  modified: string;
}
export interface TranscriptCredentials {
  apiKey?: string;
  apiSecretKey?: string;
  global?: boolean;
  provider?: string;
  username?: string;
}
export interface UploadData {
  name: string;
  status: RequestStatusType;
  progress: string | number;
}
export interface UploadingIdsRef {
  current: { uploadData: Record<string, UploadData>; uploadCount: number; };
}
export interface DownloadRow {
  original?: { id?: string; displayName?: string; downloadLink?: string; };
}
export interface VideoListResponse {
  videos: RawVideo[];
}
export interface VideoListApiResponse {
  videos: RawVideoResponse[];
}
export interface VideoUsageResponse {
  usage_locations: Array<{ display_location: string; url: string; }>;
}
export interface VideoUploadResponse {
  files: Array<{ file_name: string; upload_url: string; edx_video_id: string; }>;
}

export interface GetAllUsagePathsParams {
  courseId: string;
  videoIds: string[];
}
export interface DeleteTranscriptParams {
  videoId: string;
  language: string;
  apiUrl: string;
}
export interface DownloadTranscriptParams extends DeleteTranscriptParams {
  filename: string;
}
export interface UploadTranscriptParams extends DeleteTranscriptParams {
  newLanguage: string;
  file: File;
}
export interface GetVideoUsagePathsParams {
  courseId: string;
  videoId: string;
}
export interface AddThumbnailParams {
  courseId: string;
  videoId: string;
  file: File;
}
