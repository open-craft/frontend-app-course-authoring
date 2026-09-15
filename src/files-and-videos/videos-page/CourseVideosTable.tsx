import React, { useEffect, useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { ActionRow, Button, CheckboxFilter, useToggle } from '@openedx/paragon';
import { useMutation } from '@tanstack/react-query';
import { AgreementGated } from '@src/constants';
import { RequestStatus } from '@src/data/constants';
import {
  ActiveColumn,
  FileTable,
  StatusColumn,
  ThumbnailColumn,
  TranscriptColumn,
} from '@src/files-and-videos/generic';
import FILES_AND_UPLOAD_TYPE_FILTERS from '@src/files-and-videos/generic/constants';
import {
  useAddVideoThumbnail,
  useDeleteVideo,
  useVideosUsage,
} from './data/apiHooks';
import { getDownload, type DownloadRow, type Video } from './data/api';
import { getFormattedDuration, resampleFile, updateFileValues } from './data/utils';
import VideoInfoModalSidebar from './info-sidebar';
import InfoTab from './info-sidebar/InfoTab';
import messages from './messages';
import TranscriptSettings from './transcript-settings';
import UploadModal from './upload-modal';
import VideoThumbnail from './VideoThumbnail';
import { GatedComponentWrapper } from '@src/generic/agreement-gated-feature';
import { useVideosPageContext } from './VideosPageProvider';

const getErrorResponse = (error: unknown) => (error as { response?: { data?: { error?: string; }; }; }).response;

export const CourseVideosTable = () => {
  const intl = useIntl();
  const {
    courseId,
    pageSettings,
    loadingStatus,
    addingStatus,
    resetErrors,
    reportError,
    setStatus,
    uploadFiles,
    cancelUploads,
    uploadingIdsRef,
    uploadTrackerOpen,
    pageQuery,
  } = useVideosPageContext();
  const [isTranscriptSettingsOpen, openTranscriptSettings, closeTranscriptSettings] = useToggle(false);
  const [selectedUsageId, setSelectedUsageId] = React.useState<string | null>(null);
  const {
    isVideoTranscriptEnabled,
    encodingsDownloadUrl,
    videoUploadMaxFileSize,
    videoSupportedFileFormats,
    videoImageSettings,
  } = pageSettings;
  const serverVideos = pageSettings.previousUploads || [];
  const serverVideoIds = serverVideos.map(video => video.edxVideoId);
  const [localVideoOrder, setLocalVideoOrder] = useState<string[] | null>(null);
  useEffect(() => {
    setLocalVideoOrder(current =>
      current
        ? [...serverVideoIds.filter(id => !current.includes(id)), ...current.filter(id => serverVideoIds.includes(id))]
        : serverVideoIds
    );
  }, [serverVideoIds.join('|')]);
  const videoIds = localVideoOrder || serverVideoIds;
  const rawVideoById = new Map(serverVideos.map(video => [video.edxVideoId, video]));
  const rawVideos = videoIds
    .map(id => rawVideoById.get(id))
    .filter((video): video is NonNullable<typeof video> => Boolean(video));
  const usageQueries = useVideosUsage(courseId, videoIds);
  const videos = updateFileValues(rawVideos).map((video) => {
    const usageQuery = usageQueries[videoIds.indexOf(video.id)];
    const usageLocations = usageQuery?.data?.usageLocations;
    return usageLocations
      ? { ...video, usageLocations, activeStatus: usageLocations.length ? 'active' : 'inactive' }
      : video;
  });

  const deleteMutation = useDeleteVideo(courseId);
  const deleteBatchRef = React.useRef({ pending: 0, failed: false });
  const thumbnailMutation = useAddVideoThumbnail(courseId);
  const downloadMutation = useMutation({ mutationFn: (rows: DownloadRow[]) => getDownload(rows, courseId) });

  const handleAddFile = (files: File[]) => {
    resetErrors({ errorType: 'add' });
    uploadFiles(files);
  };
  const handleDeleteFile = (id: string) => {
    const batch = deleteBatchRef.current;
    if (batch.pending === 0) {
      batch.failed = false;
      resetErrors({ errorType: 'delete' });
    }
    batch.pending += 1;
    setStatus('delete', RequestStatus.IN_PROGRESS);
    void deleteMutation.mutateAsync(id).catch(() => {
      batch.failed = true;
      reportError('delete', `Failed to delete file id ${id}.`);
    }).finally(() => {
      batch.pending -= 1;
      if (batch.pending === 0) {
        setStatus('delete', batch.failed ? RequestStatus.FAILED : RequestStatus.SUCCESSFUL);
      }
    });
  };
  const handleDownloadFile = (selectedRows: DownloadRow[]) => {
    resetErrors({ errorType: 'download' });
    setStatus('download', RequestStatus.IN_PROGRESS);
    downloadMutation.mutate(selectedRows, {
      onSuccess: (downloadErrors) => {
        downloadErrors.forEach(error => reportError('download', error));
        setStatus('download', downloadErrors.length ? RequestStatus.FAILED : RequestStatus.SUCCESSFUL);
      },
      onError: () => {
        reportError('download', 'Failed to download zip file of videos.');
        setStatus('download', RequestStatus.FAILED);
      },
    });
  };
  const handleUsagePaths = (video: Video) => {
    setSelectedUsageId(video.id);
    const usageQuery = usageQueries[videoIds.indexOf(video.id)];
    void usageQuery?.refetch();
  };
  const handleFileOrder = ({ newFileIdOrder }: { newFileIdOrder: string[]; }) => setLocalVideoOrder(newFileIdOrder);
  const handleAddThumbnail = (file: File, videoId: string) => {
    resetErrors({ errorType: 'thumbnail' });
    setStatus('thumbnail', RequestStatus.IN_PROGRESS);
    resampleFile({
      file,
      videoId,
      courseId,
      // resampleFile is shared with the legacy thunk; this callback keeps its image processing local.
      dispatch: (params) => {
        thumbnailMutation.mutate(params as { file: File; videoId: string; courseId: string; }, {
          onSuccess: () => setStatus('thumbnail', RequestStatus.SUCCESSFUL),
          onError: (error) => {
            reportError(
              'thumbnail',
              getErrorResponse(error)?.data?.error || `Failed to add thumbnail for video id ${videoId}.`,
            );
            setStatus('thumbnail', RequestStatus.FAILED);
          },
        });
        return params;
      },
      addVideoThumbnail: params => params,
    });
  };
  const selectedUsageIndex = selectedUsageId ? videoIds.indexOf(selectedUsageId) : -1;
  const selectedUsageQuery = selectedUsageIndex >= 0 ? usageQueries[selectedUsageIndex] : undefined;
  const usageStatus = selectedUsageQuery?.isPending
    ? RequestStatus.IN_PROGRESS
    : selectedUsageQuery?.isError
    ? RequestStatus.FAILED
    : RequestStatus.SUCCESSFUL;
  const usageErrors = selectedUsageQuery?.isError && selectedUsageId
    ? [`Failed to get usage metrics for ${videos[selectedUsageIndex]?.displayName}.`]
    : [];

  const supportedFileFormats = {
    'video/*': videoSupportedFileFormats || FILES_AND_UPLOAD_TYPE_FILTERS.video,
  };
  const thumbnailPreview = (props: Parameters<typeof VideoThumbnail>[0]) =>
    VideoThumbnail({
      ...props,
      pageLoadStatus: loadingStatus,
      handleAddThumbnail,
      videoImageSettings,
    });
  const infoModalSidebar = (video: Video) => (
    <VideoInfoModalSidebar video={video as unknown as Parameters<typeof VideoInfoModalSidebar>[0]['video']} />
  );
  const infoModalContentUnderPreview = (video: Video) => (
    <InfoTab video={video as unknown as Parameters<typeof InfoTab>[0]['video']} />
  );
  const maxFileSize = Number(videoUploadMaxFileSize || 0) * 1073741824;
  const transcriptColumn = {
    id: 'transcriptStatus',
    Header: 'Transcript',
    accessor: 'transcriptStatus',
    Cell: ({ row }) => TranscriptColumn({ row }),
    Filter: CheckboxFilter,
    filter: 'exactTextCase',
    filterChoices: [
      { name: intl.formatMessage(messages.transcribedCheckboxLabel), value: 'transcribed' },
      { name: intl.formatMessage(messages.notTranscribedCheckboxLabel), value: 'notTranscribed' },
    ],
  };
  const activeColumn = {
    id: 'activeStatus',
    Header: 'Active',
    accessor: 'activeStatus',
    Cell: ({ row }) => ActiveColumn({ row, pageLoadStatus: loadingStatus }),
    Filter: CheckboxFilter,
    filter: 'exactTextCase',
    filterChoices: [
      { name: intl.formatMessage(messages.activeCheckboxLabel), value: 'active' },
      { name: intl.formatMessage(messages.inactiveCheckboxLabel), value: 'inactive' },
    ],
  };
  const tableColumns = [
    { id: 'courseVideoImageUrl', Header: '', Cell: ({ row }) => ThumbnailColumn({ row, thumbnailPreview }) },
    { Header: 'File name', accessor: 'clientVideoId' },
    { Header: 'Video length', accessor: 'duration', Cell: ({ row }) => getFormattedDuration(row.original.duration) },
    transcriptColumn,
    activeColumn,
    {
      id: 'status',
      Header: 'Status',
      accessor: 'status',
      Cell: ({ row }) => StatusColumn({ row }),
      Filter: CheckboxFilter,
      filterChoices: [
        { name: intl.formatMessage(messages.processingCheckboxLabel), value: 'Processing' },
        { name: intl.formatMessage(messages.failedCheckboxLabel), value: 'Failed' },
      ],
    },
  ];

  return (
    <GatedComponentWrapper gatingTypes={[AgreementGated.UPLOAD, AgreementGated.UPLOAD_VIDEOS]}>
      <>
        <ActionRow>
          <ActionRow.Spacer />
          {isVideoTranscriptEnabled && (
            <Button
              variant="link"
              size="sm"
              onClick={openTranscriptSettings}
            >
              {intl.formatMessage(messages.transcriptSettingsButtonLabel)}
            </Button>
          )}
        </ActionRow>
        {!pageQuery.isError && (
          <>
            {isVideoTranscriptEnabled && (
              <TranscriptSettings
                isTranscriptSettingsOpen={isTranscriptSettingsOpen}
                closeTranscriptSettings={closeTranscriptSettings}
                courseId={courseId}
              />
            )}
            <FileTable
              courseId={courseId}
              data={{
                supportedFileFormats,
                encodingsDownloadUrl,
                fileIds: videoIds,
                loadingStatus,
                usagePathStatus: usageStatus,
                usageErrorMessages: usageErrors,
                fileType: 'video',
              }}
              handleAddFile={handleAddFile}
              handleDeleteFile={handleDeleteFile}
              handleDownloadFile={handleDownloadFile}
              handleUsagePaths={handleUsagePaths}
              handleErrorReset={resetErrors}
              handleFileOrder={handleFileOrder}
              tableColumns={tableColumns}
              maxFileSize={maxFileSize}
              thumbnailPreview={thumbnailPreview}
              infoModalSidebar={infoModalSidebar}
              infoModalContentUnderPreview={infoModalContentUnderPreview}
              files={videos}
            />
          </>
        )}
        <UploadModal
          isUploadTrackerOpen={uploadTrackerOpen}
          currentUploadingIdsRef={uploadingIdsRef.current}
          handleUploadCancel={cancelUploads}
          addVideoStatus={addingStatus}
        />
      </>
    </GatedComponentWrapper>
  );
};

export default CourseVideosTable;
