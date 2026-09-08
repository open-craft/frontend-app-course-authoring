/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { RequestStatus, type RequestStatusType } from '../../../data/constants';
import type { VideoPageSettings } from './api';

export interface VideoErrors {
  add: string[];
  delete: string[];
  thumbnail: string[];
  download: string[];
  usageMetrics: string[];
  transcript: string[];
  loading: string;
}

export interface VideosState {
  videoIds: string[];
  pageSettings: VideoPageSettings;
  loadingStatus: RequestStatusType | '';
  updatingStatus: RequestStatusType | '';
  addingStatus: RequestStatusType | '';
  deletingStatus: RequestStatusType | '';
  usageStatus: RequestStatusType | '';
  transcriptStatus: RequestStatusType | '';
  errors: VideoErrors;
  defaultView: string;
}

const initialState: VideosState = {
  videoIds: [],
  pageSettings: {},
  loadingStatus: RequestStatus.IN_PROGRESS,
  updatingStatus: '',
  addingStatus: '',
  deletingStatus: '',
  usageStatus: '',
  transcriptStatus: '',
  errors: {
    add: [],
    delete: [],
    thumbnail: [],
    download: [],
    usageMetrics: [],
    transcript: [],
    loading: '',
  },
  defaultView: 'list',
};

const slice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setVideoIds: (state, { payload }: PayloadAction<{ videoIds: string[]; }>) => {
      state.videoIds = payload.videoIds;
    },
    setPageSettings: (state, { payload }: PayloadAction<VideoPageSettings>) => {
      state.pageSettings = payload;
    },
    updateLoadingStatus: (
      state,
      { payload }: PayloadAction<{ courseId?: string; status: RequestStatusType | ''; }>,
    ) => {
      state.loadingStatus = payload.status;
    },
    updateEditStatus: (state, { payload }: PayloadAction<{
      editType: 'delete' | 'add' | 'thumbnail' | 'download' | 'usageMetrics' | 'transcript';
      status: RequestStatusType | '';
    }>) => {
      const { editType, status } = payload;
      switch (editType) {
        case 'delete':
          state.deletingStatus = status;
          break;
        case 'add':
          state.addingStatus = status;
          break;
        case 'thumbnail':
          state.updatingStatus = status;
          break;
        case 'download':
          state.updatingStatus = status;
          break;
        case 'usageMetrics':
          state.usageStatus = status;
          break;
        case 'transcript':
          state.transcriptStatus = status;
          break;
        default:
          break;
      }
    },
    deleteVideoSuccess: (state, { payload }: PayloadAction<{ videoId: string; }>) => {
      state.videoIds = state.videoIds.filter(id => id !== payload.videoId);
    },
    addVideoById: (state, { payload }: PayloadAction<{ videoId: string; }>) => {
      state.videoIds = [payload.videoId, ...state.videoIds];
    },
    updateTranscriptCredentialsSuccess: (state, { payload }: PayloadAction<{ provider: string; }>) => {
      const { provider } = payload;
      state.pageSettings.transcriptCredentials = {
        ...state.pageSettings.transcriptCredentials,
        [provider]: true,
      };
    },
    updateTranscriptPreferenceSuccess: (
      state,
      { payload }: PayloadAction<VideoPageSettings['activeTranscriptPreferences']>,
    ) => {
      state.pageSettings.activeTranscriptPreferences = payload;
    },
    updateErrors: (state, { payload }: PayloadAction<{ error: keyof VideoErrors; message: string; }>) => {
      const { error, message } = payload;
      if (error === 'loading') {
        state.errors.loading = message;
      } else {
        const currentErrorState = state.errors[error];
        state.errors[error] = [...currentErrorState, message];
      }
    },
    clearErrors: (state, { payload }: PayloadAction<{ error: keyof VideoErrors; }>) => {
      const { error } = payload;
      state.errors[error] = [] as never; // clearErrors historically also accepts the string-valued loading key.
    },
    failAddVideo: (state, { payload }: PayloadAction<{ fileName: string; }>) => {
      const { fileName } = payload;
      const currentErrorState = state.errors.add;
      state.errors.add = [...currentErrorState, `Failed to add ${fileName}.`];
    },
  },
});

export const {
  setVideoIds,
  setPageSettings,
  updateLoadingStatus,
  deleteVideoSuccess,
  updateErrors,
  clearErrors,
  updateEditStatus,
  updateTranscriptCredentialsSuccess,
  updateTranscriptPreferenceSuccess,
  failAddVideo,
} = slice.actions;

// These names existed in the JavaScript module even though no reducers created them.
export const addVideoSuccess: undefined = undefined;
export const updateVideoUploadProgress: undefined = undefined;

export const {
  reducer,
} = slice;
