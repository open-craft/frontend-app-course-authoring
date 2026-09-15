import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { RequestStatus } from '../../../data/constants';

import {
  addThumbnail,
  addVideo,
  deleteTranscript,
  deleteTranscriptPreferences,
  deleteVideo,
  fetchVideoList,
  getVideoUsagePaths,
  getVideos,
  sendVideoUploadStatus,
  setTranscriptCredentials,
  setTranscriptPreferences,
  uploadTranscript,
  uploadVideo,
  type VideoListResponse,
  type VideoPageSettings,
  type UploadingIdsRef,
  type TranscriptCredentials,
  type TranscriptPreferencesForm,
  type UploadTranscriptParams,
} from './api';
import { videosQueryKeys } from './queryKeys';

export { videosQueryKeys };

const getErrorStatus = (error: unknown) => (error as { response?: { status?: number; }; }).response?.status;

export const useVideosPage = (courseId: string) =>
  useQuery({
    queryKey: videosQueryKeys.page(courseId),
    queryFn: () => getVideos(courseId),
    retry: (failureCount, error) => {
      const status = getErrorStatus(error);
      return failureCount < 3 && (status === undefined || status >= 500) && status !== 403;
    },
  });

export const useVideoList = (courseId: string) =>
  useQuery({
    queryKey: videosQueryKeys.list(courseId),
    queryFn: () => fetchVideoList(courseId),
  });

export const useVideoSettings = (courseId: string) =>
  useQuery<VideoPageSettings>({
    queryKey: videosQueryKeys.settings(courseId),
    queryFn: () => getVideos(courseId),
  });

export const useVideoUsage = (courseId: string, videoId: string) =>
  useQuery({
    queryKey: videosQueryKeys.usage(courseId, videoId),
    queryFn: () => getVideoUsagePaths({ courseId, videoId }),
  });

/** Fetch usage eagerly while retaining independent query state for each video. */
export const useVideosUsage = (courseId: string, videoIds: string[]) =>
  useQueries({
    queries: videoIds.map(videoId => ({
      queryKey: videosQueryKeys.usage(courseId, videoId),
      queryFn: () => getVideoUsagePaths({ courseId, videoId }),
    })),
  });

const invalidateVideos = (queryClient: ReturnType<typeof useQueryClient>, courseId: string) => {
  void queryClient.invalidateQueries({ queryKey: videosQueryKeys.page(courseId) });
  void queryClient.invalidateQueries({ queryKey: videosQueryKeys.list(courseId) });
};

export interface UploadVideoVariables {
  file: File;
  uploadingIdsRef: UploadingIdsRef;
  controller?: AbortController;
  uploadController?: AbortController;
  uploadKey?: string;
}

/** Runs create → upload → status, then reconciles from the authoritative list. */
export const useUploadVideo = (
  courseId: string,
  options?: UseMutationOptions<VideoListResponse, Error, UploadVideoVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ file, uploadingIdsRef, controller, uploadController, uploadKey }) => {
      const { data } = await addVideo(courseId, file, controller);
      const [{ upload_url: uploadUrl, edx_video_id: edxVideoId }] = data.files;
      if (uploadKey && uploadingIdsRef.current.uploadData[uploadKey]) {
        uploadingIdsRef.current.uploadData[edxVideoId] = {
          ...uploadingIdsRef.current.uploadData[uploadKey],
          status: RequestStatus.IN_PROGRESS,
        };
        delete uploadingIdsRef.current.uploadData[uploadKey];
      }
      try {
        await uploadVideo(uploadUrl, file, uploadingIdsRef, edxVideoId, uploadController ?? controller);
        const uploadData = uploadingIdsRef.current.uploadData[edxVideoId];
        if (uploadData) {
          uploadingIdsRef.current.uploadData[edxVideoId] = { ...uploadData, status: RequestStatus.SUCCESSFUL };
        }
      } catch (error) {
        const uploadData = uploadingIdsRef.current.uploadData[edxVideoId];
        if (uploadData) {
          uploadingIdsRef.current.uploadData[edxVideoId] = { ...uploadData, status: RequestStatus.FAILED };
        }
        try {
          await sendVideoUploadStatus(courseId, edxVideoId, 'Upload failed', 'upload_failed');
        } catch {
          // Preserve the PUT/abort error if the best-effort status update fails.
        }
        throw error;
      }
      await sendVideoUploadStatus(courseId, edxVideoId, 'Upload completed', 'upload_completed');
      const videos = await fetchVideoList(courseId);
      await queryClient.invalidateQueries({ queryKey: videosQueryKeys.page(courseId) });
      queryClient.setQueryData<VideoPageSettings | undefined>(
        videosQueryKeys.page(courseId),
        current => current ? { ...current, previousUploads: videos.videos } : current,
      );
      return videos;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: videosQueryKeys.list(courseId) });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDeleteVideo = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => deleteVideo(courseId, videoId),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useAddVideoThumbnail = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, file }: { videoId: string; file: File; }) => addThumbnail({ courseId, videoId, file }),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useDeleteTranscript = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTranscript,
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useUploadTranscript = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UploadTranscriptParams) => uploadTranscript(params),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useDeleteTranscriptPreferences = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTranscriptPreferences(courseId),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useSetTranscriptPreferences = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: TranscriptPreferencesForm) => setTranscriptPreferences(courseId, preferences),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};

export const useSetTranscriptCredentials = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: TranscriptCredentials) => setTranscriptCredentials(courseId, credentials),
    onSuccess: () => invalidateVideos(queryClient, courseId),
  });
};
