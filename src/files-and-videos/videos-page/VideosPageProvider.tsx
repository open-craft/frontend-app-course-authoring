import React, { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useVideosPage, useUploadVideo } from './data/apiHooks';
import { sendVideoUploadStatus, type VideoPageSettings, type UploadingIdsRef } from './data/api';
import { RequestStatus, type RequestStatusType } from '../../data/constants';
import type { VideoErrors } from './data/slice';

interface VideosPageContextValue {
  courseId: string;
  path: string;
  pageSettings: VideoPageSettings;
  pageQuery: ReturnType<typeof useVideosPage>;
  loadingStatus: RequestStatusType | '';
  errors: VideoErrors;
  addingStatus: RequestStatusType | '';
  deletingStatus: RequestStatusType | '';
  updatingStatus: RequestStatusType | '';
  resetErrors: (error: { errorType: keyof VideoErrors; }) => void;
  reportError: (error: keyof VideoErrors, message: string) => void;
  setStatus: (type: 'add' | 'delete' | 'thumbnail' | 'download', status: RequestStatusType | '') => void;
  uploadingIdsRef: React.MutableRefObject<UploadingIdsRef['current']>;
  uploadFiles: (files: File[]) => void;
  cancelUploads: () => void;
  uploadTrackerOpen: boolean;
}

const initialErrors: VideoErrors = {
  add: [],
  delete: [],
  thumbnail: [],
  download: [],
  usageMetrics: [],
  transcript: [],
  loading: '',
};

export const VideosPageContext = React.createContext<VideosPageContextValue | null>(null);

export const useVideosPageContext = () => {
  const context = useContext(VideosPageContext);
  if (!context) {
    throw new Error('useVideosPageContext must be used within VideosPageProvider');
  }
  return context;
};

const getErrorResponse = (error: unknown) =>
  (error as { response?: { data?: { error?: string; }; status?: number; }; }).response;

interface VideosPageProviderProps {
  courseId: string;
  children: ReactNode;
}

const VideosPageProvider = ({ courseId, children }: VideosPageProviderProps) => {
  const pageQuery = useVideosPage(courseId);
  const uploadMutation = useUploadVideo(courseId);
  const [errors, setErrors] = useState(initialErrors);
  const [addingStatus, setAddingStatus] = useState<RequestStatusType | ''>('');
  const [deletingStatus, setDeletingStatus] = useState<RequestStatusType | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState<RequestStatusType | ''>('');
  const [uploadTrackerOpen, setUploadTrackerOpen] = useState(false);
  const uploadingIdsRef = useRef<UploadingIdsRef['current']>({ uploadData: {}, uploadCount: 0 });
  const controllersRef = useRef<AbortController[]>([]);
  const cancelledRef = useRef(false);

  const reportError = (error: keyof VideoErrors, message: string) => {
    if (error === 'loading') {
      setErrors(current => ({ ...current, loading: message }));
    } else {
      setErrors(current => ({ ...current, [error]: [...current[error], message] }));
    }
  };
  const resetErrors = ({ errorType }: { errorType: keyof VideoErrors; }) => {
    setErrors(current => ({ ...current, [errorType]: errorType === 'loading' ? '' : [] }));
    if (errorType === 'loading') {
      void pageQuery.refetch();
    }
  };
  const setStatus = (
    type: 'add' | 'delete' | 'thumbnail' | 'download',
    status: RequestStatusType | '',
  ) => {
    const setters = {
      add: setAddingStatus,
      delete: setDeletingStatus,
      thumbnail: setUpdatingStatus,
      download: setUpdatingStatus,
    };
    setters[type](status);
  };

  const uploadFiles = (files: File[]) => {
    const validFiles = files.filter(file => file && typeof file.name === 'string');
    cancelledRef.current = false;
    uploadingIdsRef.current = {
      uploadData: Object.fromEntries(validFiles.map((file, index) => [
        `video_${index}`,
        { name: file.name || `Video ${index + 1}`, progress: 0, status: RequestStatus.PENDING },
      ])),
      uploadCount: validFiles.length,
    };
    setErrors(current => ({ ...current, add: [] }));
    setAddingStatus(RequestStatus.IN_PROGRESS);
    setUploadTrackerOpen(true);

    const uploads = validFiles.map((file, index) => {
      const controller = new AbortController();
      const uploadController = new AbortController();
      controllersRef.current.push(controller, uploadController);
      return uploadMutation.mutateAsync({
        file,
        uploadKey: `video_${index}`,
        uploadingIdsRef,
        controller,
        uploadController,
      }).catch(error => {
        if (!cancelledRef.current) {
          const message = getErrorResponse(error)?.data?.error || `Failed to upload ${file.name}.`;
          reportError('add', message);
        }
        throw error;
      }).finally(() => {
        controllersRef.current = controllersRef.current.filter(item =>
          item !== controller && item !== uploadController
        );
      });
    });

    void Promise.allSettled(uploads).then(results => {
      const hasFailure = results.some(result => result.status === 'rejected');
      setAddingStatus(hasFailure ? RequestStatus.FAILED : RequestStatus.SUCCESSFUL);
      uploadingIdsRef.current = { uploadData: {}, uploadCount: 0 };
    });
  };

  const cancelUploads = () => {
    cancelledRef.current = true;
    controllersRef.current.forEach(controller => controller.abort());
    Object.values(uploadingIdsRef.current.uploadData).forEach(upload => {
      if (upload.status === RequestStatus.IN_PROGRESS) {
        reportError('add', `Cancelled upload for ${upload.name}.`);
      }
    });
    setAddingStatus(RequestStatus.FAILED);
    controllersRef.current = [];
  };

  useEffect(() => {
    window.onbeforeunload = () => {
      Object.entries(uploadingIdsRef.current.uploadData)
        .filter(([, upload]) => upload.status === RequestStatus.IN_PROGRESS)
        .forEach(([videoId]) => {
          void sendVideoUploadStatus(courseId, videoId, 'Upload failed', 'upload_failed');
        });
      return addingStatus === RequestStatus.IN_PROGRESS ? '' : undefined;
    };
    return () => {
      window.onbeforeunload = null;
    };
  }, [courseId, addingStatus]);

  useEffect(() => {
    if (addingStatus === RequestStatus.IN_PROGRESS) {
      setUploadTrackerOpen(true);
    } else if (addingStatus === RequestStatus.SUCCESSFUL || addingStatus === RequestStatus.FAILED) {
      const timeout = window.setTimeout(() => setUploadTrackerOpen(false), 500);
      return () => window.clearTimeout(timeout);
    } else {
      setUploadTrackerOpen(false);
    }
    return undefined;
  }, [addingStatus]);

  const contextValue = useMemo<VideosPageContextValue>(() => ({
    courseId,
    path: `/course/${courseId}/videos`,
    pageSettings: pageQuery.data || {},
    pageQuery,
    loadingStatus: pageQuery.isPending
      ? RequestStatus.IN_PROGRESS
      : pageQuery.isError
      ? RequestStatus.FAILED
      : RequestStatus.SUCCESSFUL,
    errors: {
      ...errors,
      loading: pageQuery.isError ? 'Failed to load videos' : errors.loading,
    },
    addingStatus,
    deletingStatus,
    updatingStatus,
    resetErrors,
    reportError,
    setStatus,
    uploadingIdsRef,
    uploadFiles,
    cancelUploads,
    uploadTrackerOpen,
  }), [courseId, pageQuery, errors, addingStatus, deletingStatus, updatingStatus, uploadTrackerOpen]);

  return <VideosPageContext.Provider value={contextValue}>{children}</VideosPageContext.Provider>;
};
export default VideosPageProvider;
