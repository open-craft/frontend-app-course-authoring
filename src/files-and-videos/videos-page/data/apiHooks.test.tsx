import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { initializeMocks, makeQueryClientWrapper } from '@src/testUtils';
import { getCourseVideosApiUrl, getVideosUrl } from './api';
import * as api from './api';
import { useUploadVideo, useVideoList, useVideosPage } from './apiHooks';
import { RequestStatus } from '../../../data/constants';

describe('video query hooks', () => {
  afterEach(() => jest.restoreAllMocks());

  it('normalizes list DTOs through the list query', async () => {
    initializeMocks();
    const axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    const courseId = 'course-a';
    axiosMock.onGet(getCourseVideosApiUrl(courseId)).reply(200, {
      videos: [{
        edx_video_id: 'video-a',
        client_video_id: 'video.mp4',
        transcripts: null,
        course_video_image_url: null,
      }],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useVideoList(courseId), {
      wrapper: makeQueryClientWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.videos[0]).toMatchObject({
      edxVideoId: 'video-a',
      clientVideoId: 'video.mp4',
      transcripts: [],
      courseVideoImageUrl: null,
    });
  });

  it('stops retrying a denied page request', async () => {
    initializeMocks();
    const axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    const courseId = 'course-denied';
    axiosMock.onGet(getVideosUrl(courseId)).reply(403);
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useVideosPage(courseId), {
      wrapper: makeQueryClientWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(axiosMock.history.get).toHaveLength(1);
  });

  it('marks the server id active and reports PUT failures without replacing the original error', async () => {
    initializeMocks();
    const axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    const courseId = 'course-upload';
    const uploadError = new Error('PUT failed');
    let rejectUpload: (error: Error) => void;
    const uploadPromise = new Promise<never>((_, reject) => {
      rejectUpload = reject;
    });
    const uploadingIdsRef = {
      current: {
        uploadData: {
          upload_0: { name: 'video.mp4', progress: 0, status: RequestStatus.PENDING },
        },
        uploadCount: 1,
      },
    };
    axiosMock.onPost(getCourseVideosApiUrl(courseId)).reply(204, {
      files: [{ edx_video_id: 'video-server', upload_url: 'https://upload.example/video' }],
    });
    const uploadVideo = jest.spyOn(api, 'uploadVideo').mockReturnValue(uploadPromise as never);
    const sendStatus = jest.spyOn(api, 'sendVideoUploadStatus').mockRejectedValue(new Error('status failed'));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUploadVideo(courseId), {
      wrapper: makeQueryClientWrapper(queryClient),
    });

    const upload = result.current.mutateAsync({
      file: new File(['video'], 'video.mp4', { type: 'video/mp4' }),
      uploadingIdsRef,
      uploadKey: 'upload_0',
    });
    await waitFor(() => expect(uploadVideo).toHaveBeenCalled());
    expect(uploadingIdsRef.current.uploadData).toEqual({
      'video-server': { name: 'video.mp4', progress: 0, status: RequestStatus.IN_PROGRESS },
    });
    rejectUpload!(uploadError);
    await expect(upload).rejects.toBe(uploadError);
    expect(sendStatus).toHaveBeenCalledWith(courseId, 'video-server', 'Upload failed', 'upload_failed');
  });

  it('reconciles the rendered page cache from the authoritative video list', async () => {
    initializeMocks();
    const axiosMock = new MockAdapter(getAuthenticatedHttpClient());
    const courseId = 'course-cache';
    const page = { videoUploadMaxFileSize: '5', previousUploads: [] };
    const video = {
      edx_video_id: 'video-server',
      client_video_id: 'video.mp4',
      created: '',
      course_video_image_url: '/video',
    };
    const uploadingIdsRef = { current: { uploadData: {}, uploadCount: 0 } };
    axiosMock.onPost(getCourseVideosApiUrl(courseId)).reply(200, {
      files: [{ edx_video_id: 'video-server', upload_url: 'https://upload.example/video' }],
    });
    axiosMock.onGet(getCourseVideosApiUrl(courseId)).reply(200, { videos: [video] });
    jest.spyOn(api, 'uploadVideo').mockResolvedValue({ status: 200 } as never);
    jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue({} as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['videos', courseId, 'page'], page);
    const { result } = renderHook(() => useUploadVideo(courseId), {
      wrapper: makeQueryClientWrapper(queryClient),
    });

    await result.current.mutateAsync({
      file: new File(['video'], 'video.mp4', { type: 'video/mp4' }),
      uploadingIdsRef,
    });

    expect(queryClient.getQueryData(['videos', courseId, 'page'])).toMatchObject({
      ...page,
      previousUploads: [{ edxVideoId: 'video-server', clientVideoId: 'video.mp4' }],
    });
  });
});
