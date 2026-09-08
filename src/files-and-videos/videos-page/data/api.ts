/* eslint-disable no-param-reassign */
import saveAs from 'file-saver';
import { camelCaseObject, ensureConfig, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient, getHttpClient } from '@edx/frontend-platform/auth';
import { isEmpty } from 'lodash';
import type { AxiosProgressEvent, AxiosResponse } from 'axios';
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

/** The camel-cased video fields returned by the videos page APIs. */
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
  /** Only emitted by the legacy video-list endpoint. */
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

interface VideoPageResponse {
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
  current: {
    uploadData: Record<string, UploadData>;
    uploadCount: number;
  };
}

export interface DownloadRow {
  original?: {
    id?: string;
    displayName?: string;
    downloadLink?: string;
  };
}

export interface VideoListResponse {
  videos: RawVideo[];
}

interface VideoListApiResponse {
  videos: RawVideoResponse[];
}

interface VideoUsageResponse {
  usage_locations: Array<{ display_location: string; url: string; }>;
}

export interface VideoUploadResponse {
  files: Array<{ file_name: string; upload_url: string; edx_video_id: string; }>;
}

ensureConfig([
  'STUDIO_BASE_URL',
], 'Course Apps API service');

export const getApiBaseUrl = (): string => getConfig().STUDIO_BASE_URL;
export const getVideosUrl = (courseId: string): string => `${getApiBaseUrl()}/api/contentstore/v1/videos/${courseId}`;
export const getCourseVideosApiUrl = (courseId: string): string => `${getApiBaseUrl()}/videos/${courseId}`;

/**
 * Fetches the course custom pages for provided course
 * @param {string} courseId
 * @returns {Promise<Record<string, any>>}
 */
export async function getVideos(courseId: string): Promise<VideoPageSettings> {
  const { data } = await getAuthenticatedHttpClient()
    .get<VideoPageResponse>(getVideosUrl(courseId));
  const { video_transcript_settings: videoTranscriptSettings } = data;
  const { transcription_plans: transcriptionPlans } = videoTranscriptSettings;
  return {
    ...camelCaseObject(data),
    videoTranscriptSettings: {
      ...camelCaseObject(videoTranscriptSettings),
      transcriptionPlans,
    },
  };
}

export async function getAllUsagePaths(
  { courseId, videoIds }: { courseId: string; videoIds: string[]; },
): Promise<Array<{ id: string; usageLocations: UsageLocation[]; activeStatus: VideoActiveStatus; }>> {
  // Hack: pass 'videoId' into the 'config' object; it will be ignored by axios
  // but allows us to read it out later to easily get the videoId per result.
  const apiPromises = videoIds.map(id =>
    getAuthenticatedHttpClient()
      .get<VideoUsageResponse>(`${getVideosUrl(courseId)}/${id}/usage`, { videoId: id })
  );
  const updatedUsageLocations: Array<
    { id: string; usageLocations: UsageLocation[]; activeStatus: VideoActiveStatus; }
  > = [];
  const results = await Promise.allSettled(apiPromises);

  results.forEach(result => {
    if (result.status !== 'fulfilled') {
      return;
    }
    const value = camelCaseObject(result.value);
    if (value) {
      const { usageLocations } = value.data;
      const activeStatus = usageLocations?.length > 0 ? 'active' : 'inactive';
      const { videoId } = value.config;
      updatedUsageLocations.push({ id: videoId, usageLocations, activeStatus });
    }
  });
  return updatedUsageLocations;
}

/**
 * Fetches the course custom pages for provided course
 * @param {string} courseId
 * @returns {Promise<[{}]>}
 */
export async function fetchVideoList(courseId: string): Promise<VideoListResponse> {
  const { data } = await getAuthenticatedHttpClient()
    .get<VideoListApiResponse>(getCourseVideosApiUrl(courseId));
  return camelCaseObject(data);
}

export async function deleteTranscript(
  { videoId, language, apiUrl }: { videoId: string; language: string; apiUrl: string; },
): Promise<void> {
  await getAuthenticatedHttpClient()
    .delete(`${getApiBaseUrl()}${apiUrl}/${videoId}/${language}`);
}

export async function downloadTranscript({
  videoId,
  language,
  apiUrl,
  filename,
}: { videoId: string; language: string; apiUrl: string; filename: string; }): Promise<void> {
  const { data } = await getAuthenticatedHttpClient()
    .get(`${getApiBaseUrl()}${apiUrl}?edx_video_id=${videoId}&language_code=${language}`);
  const file = new Blob([data], { type: 'text/plain;charset=utf-8' });
  saveAs(file, filename);
}

export async function uploadTranscript({
  videoId,
  newLanguage,
  apiUrl,
  file,
  language,
}: { videoId: string; newLanguage: string; apiUrl: string; file: File; language: string; }): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('edx_video_id', videoId);
  formData.append('language_code', language);
  formData.append('new_language_code', newLanguage);
  await getAuthenticatedHttpClient().post(`${getApiBaseUrl()}${apiUrl}`, formData);
}

export async function getDownload(selectedRows: DownloadRow[] | null | undefined, courseId: string): Promise<string[]> {
  const downloadErrors: string[] = [];
  let file;
  let filename;
  if (selectedRows && selectedRows.length > 1) {
    const downloadLinks = selectedRows.map(row => {
      const video = row.original as NonNullable<DownloadRow['original']>;
      try {
        const url = video.downloadLink;
        const name = video.displayName;
        return { url, name };
      } catch {
        downloadErrors.push(`Cannot find download file for ${video?.displayName || 'video'}.`);
        return null;
      }
    });
    if (!isEmpty(downloadLinks)) {
      const json = { files: downloadLinks };
      const { data } = await getAuthenticatedHttpClient()
        .put(`${getVideosUrl(courseId)}/download`, json, { responseType: 'arraybuffer' });

      const date = new Date().toString();
      filename = `${courseId}-videos-${date}`;
      file = new Blob([data], { type: 'application/zip' });
      saveAs(file, filename);
    }
  } else if (selectedRows && selectedRows.length === 1) {
    try {
      const video = selectedRows[0].original as NonNullable<DownloadRow['original']>;
      const { downloadLink } = video;
      if (!isEmpty(downloadLink)) {
        saveAs(downloadLink, video.displayName);
      } else {
        downloadErrors.push(`Cannot find download file for ${video?.displayName}.`);
      }
    } catch {
      downloadErrors.push('Failed to download video.');
    }
  } else {
    downloadErrors.push('No files were selected to download.');
  }

  return downloadErrors;
}

/**
 * Fetch where a video is used in a course.
 * @param {blockId} courseId Course ID for the course to operate on
 */
export async function getVideoUsagePaths(
  { courseId, videoId }: { courseId: string; videoId: string; },
): Promise<{ usageLocations: UsageLocation[]; }> {
  const { data } = await getAuthenticatedHttpClient()
    .get<VideoUsageResponse>(`${getVideosUrl(courseId)}/${videoId}/usage`);
  return camelCaseObject(data);
}

/**
 * Delete video from course.
 * @param {blockId} courseId Course ID for the course to operate on
 */
export async function deleteVideo(courseId: string, videoId: string): Promise<void> {
  await getAuthenticatedHttpClient()
    .delete(`${getCourseVideosApiUrl(courseId)}/${videoId}`);
}

/**
 * Add thumbnail to video.
 * @param {blockId} courseId Course ID for the course to operate on
 */
export async function addThumbnail(
  { courseId, videoId, file }: { courseId: string; videoId: string; file: File; },
): Promise<{ imageUrl: string; }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await getAuthenticatedHttpClient()
    .post(`${getApiBaseUrl()}/video_images/${courseId}/${videoId}`, formData);
  return camelCaseObject(data);
}

/**
 * Add video to course.
 * @param {blockId} courseId Course ID for the course to operate on
 */
export async function addVideo(
  courseId: string,
  file: File,
  controller?: AbortController,
): Promise<AxiosResponse<VideoUploadResponse>> {
  const postJson = {
    files: [{ file_name: file.name, content_type: file.type }],
  };
  return getAuthenticatedHttpClient().post(
    getCourseVideosApiUrl(courseId),
    postJson,
    { signal: controller?.signal },
  );
}

export async function sendVideoUploadStatus(
  courseId: string,
  edxVideoId: string,
  message: string,
  status: string,
): Promise<AxiosResponse<void>> {
  return getAuthenticatedHttpClient()
    .post(getCourseVideosApiUrl(courseId), [{
      edxVideoId,
      message,
      status,
    }]);
}

export async function uploadVideo(
  uploadUrl: string,
  uploadFile: File,
  uploadingIdsRef: UploadingIdsRef,
  videoId: string,
  controller?: AbortController,
): Promise<AxiosResponse<void>> {
  const currentUpload = uploadingIdsRef.current.uploadData[videoId];
  return getHttpClient().put(uploadUrl, uploadFile, {
    headers: {
      'Content-Disposition': `attachment; filename="${uploadFile.name}"`,
      'Content-Type': uploadFile.type,
    },
    multipart: false,
    signal: controller?.signal,
    onUploadProgress: ({ loaded, total }: AxiosProgressEvent) => {
      const progress = ((loaded / (total ?? uploadFile.size)) * 100).toFixed(2);
      uploadingIdsRef.current.uploadData[videoId] = {
        ...currentUpload,
        progress,
      };
    },
  });
}

export async function deleteTranscriptPreferences(courseId: string): Promise<void> {
  await getAuthenticatedHttpClient().delete(`${getApiBaseUrl()}/transcript_preferences/${courseId}`);
}

export async function setTranscriptPreferences(
  courseId: string,
  preferences: TranscriptPreferencesForm,
): Promise<TranscriptPreferences> {
  const {
    cielo24Fidelity,
    cielo24Turnaround,
    global,
    preferredLanguages,
    provider,
    threePlayTurnaround,
    videoSourceLanguage,
  } = preferences;
  const postJson = {
    cielo24_fidelity: cielo24Fidelity?.toUpperCase(),
    cielo24_turnaround: cielo24Turnaround,
    global,
    preferred_languages: preferredLanguages,
    provider,
    video_source_language: videoSourceLanguage,
    three_play_turnaround: threePlayTurnaround,
  };

  const { data } = await getAuthenticatedHttpClient()
    .post(`${getApiBaseUrl()}/transcript_preferences/${courseId}`, postJson);
  return camelCaseObject(data);
}

export async function setTranscriptCredentials(courseId: string, formFields: TranscriptCredentials): Promise<void> {
  const {
    apiKey,
    global,
    provider,
    ...otherFields
  } = formFields;
  const postJson: Record<string, unknown> = {
    api_key: apiKey,
    global,
    provider,
  };

  if (provider === '3PlayMedia') {
    const { apiSecretKey } = otherFields;
    postJson.api_secret_key = apiSecretKey;
  } else {
    const { username } = otherFields;
    postJson.username = username;
  }
  await getAuthenticatedHttpClient()
    .post(`${getApiBaseUrl()}/transcript_credentials/${courseId}`, postJson);
}
