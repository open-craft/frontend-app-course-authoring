import type { AxiosResponse } from 'axios';
import { addVideoFile } from './thunks';
import * as api from './api';

const mockResponse = <T>(data: T, status = 200): AxiosResponse<T> => ({
  data,
  status,
  statusText: '',
  headers: {},
  config: {} as AxiosResponse<T>['config'],
});

describe('addVideoFile', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();
  const courseId = 'course-123';
  const videoIds = undefined as unknown as string[];
  const mockFile = {
    name: 'mockName',
  } as unknown as File;
  const uploadingIdsRef = { current: { uploadData: {}, uploadCount: 0 } };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('Should dispatch failed if url cannot be created.', async () => {
    jest.spyOn(api, 'addVideo').mockResolvedValue(mockResponse({ files: [] }, 404));

    await addVideoFile(courseId, [mockFile], videoIds, uploadingIdsRef)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        fileName: mockFile.name,
      },
      type: 'videos/failAddVideo',
    });
  });
  it('Failed video upload dispatches updateEditStatus with failed, and sends the failure to the api', async () => {
    const videoStatusMock = jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue(mockResponse(undefined));
    const mockEdxVideoId = 'iD';
    jest.spyOn(api, 'addVideo').mockResolvedValue(mockResponse({
      files: [
        { edx_video_id: mockEdxVideoId, upload_url: 'a Url', file_name: mockFile.name },
      ],
    }));
    jest.spyOn(api, 'uploadVideo').mockResolvedValue(mockResponse(undefined, 404));
    await addVideoFile(courseId, [mockFile], videoIds, uploadingIdsRef)(dispatch, getState);
    expect(videoStatusMock).toHaveBeenCalledWith(courseId, mockEdxVideoId, 'Upload failed', 'upload_failed');
    expect(dispatch).toHaveBeenCalledWith({
      payload: {
        error: 'add',
        message: `Failed to upload ${mockFile.name}.`,
      },

      type: 'videos/updateErrors',
    });
  });
  it('Successful video upload sends the success to the api', async () => {
    const videoStatusMock = jest.spyOn(api, 'sendVideoUploadStatus').mockResolvedValue(mockResponse(undefined));
    const mockEdxVideoId = 'iD';
    jest.spyOn(api, 'addVideo').mockResolvedValue(mockResponse({
      files: [
        { edx_video_id: mockEdxVideoId, upload_url: 'a Url', file_name: mockFile.name },
      ],
    }));
    jest.spyOn(api, 'uploadVideo').mockResolvedValue(mockResponse(undefined));
    await addVideoFile(courseId, [mockFile], videoIds, uploadingIdsRef)(dispatch, getState);
    expect(videoStatusMock).toHaveBeenCalledWith(courseId, mockEdxVideoId, 'Upload completed', 'upload_completed');
  });
});
