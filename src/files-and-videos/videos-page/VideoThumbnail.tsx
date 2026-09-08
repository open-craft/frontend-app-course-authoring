import React, { CSSProperties, useState } from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { VideoFile } from '@openedx/paragon/icons';
import {
  Badge,
  Button,
  Icon,
  Image,
} from '@openedx/paragon';
import { FileInput, useFileInput } from '../generic';
import messages from './messages';
import { VIDEO_SUCCESS_STATUSES, VIDEO_FAILURE_STATUSES } from './data/constants';
import { RequestStatus } from '../../data/constants';

interface VideoImageSettings {
  videoImageUploadEnabled: boolean;
  supportedFileFormats?: Record<string, string>;
}

interface VideoThumbnailProps {
  thumbnail?: string | null;
  displayName: string;
  id: string;
  imageSize: CSSProperties;
  handleAddThumbnail: (file: File, videoId: string) => void;
  videoImageSettings: VideoImageSettings;
  status: string;
  pageLoadStatus: string;
}

const VideoThumbnail = ({
  thumbnail = null,
  displayName,
  id,
  imageSize,
  handleAddThumbnail,
  videoImageSettings,
  status,
  pageLoadStatus,
}: VideoThumbnailProps) => {
  const intl = useIntl();
  const fileInputControl = useFileInput({
    onAddFile: (files) => {
      const [file] = files;
      handleAddThumbnail(file, id);
    },
    setSelectedRows: () => {},
    setAddOpen: () => false,
  });
  const [thumbnailError, setThumbnailError] = useState(false);
  const allowThumbnailUpload = videoImageSettings?.videoImageUploadEnabled;

  let addThumbnailMessage = 'Add thumbnail';
  if (allowThumbnailUpload) {
    if (thumbnail) {
      addThumbnailMessage = 'Replace thumbnail';
    }
  }
  const supportedFiles = videoImageSettings?.supportedFileFormats
    ? Object.values(videoImageSettings.supportedFileFormats)
    : undefined;
  const isUploaded = VIDEO_SUCCESS_STATUSES.includes(status);
  const isFailed = VIDEO_FAILURE_STATUSES.includes(status);
  const failedMessage = intl.formatMessage(messages.failedCheckboxLabel);

  const showThumbnail = allowThumbnailUpload && isUploaded;

  return (
    <div className="video-thumbnail row justify-content-center align-itmes-center">
      {allowThumbnailUpload && isUploaded && <div className="thumbnail-overlay" />}
      {showThumbnail && !thumbnailError && pageLoadStatus === RequestStatus.SUCCESSFUL ?
        (
          <>
            <div className="border rounded">
              {thumbnail ?
                (
                  <Image
                    style={imageSize}
                    className="m-1 bg-light-300"
                    src={thumbnail}
                    alt={intl.formatMessage(messages.thumbnailAltMessage, { displayName })}
                    onError={() => setThumbnailError(true)}
                  />
                ) :
                (
                  <div
                    className="row justify-content-center align-items-center m-0"
                    style={imageSize}
                  >
                    <Icon src={VideoFile} style={{ height: '48px', width: '48px' }} />
                  </div>
                )}
            </div>
            <div className="add-thumbnail" data-testid={`video-thumbnail-${id}`}>
              <Button
                variant="primary"
                size="sm"
                onClick={fileInputControl.click}
                tabIndex={0}
              >
                {addThumbnailMessage}
              </Button>
            </div>
          </>
        ) :
        (
          <>
            <div
              className="row justify-content-center align-items-center m-0 border rounded"
              style={imageSize}
            >
              <Icon src={VideoFile} style={{ height: '48px', width: '48px' }} />
            </div>
            <div className="status-badge">
              {!isUploaded && (
                <Badge variant="light">
                  {!isFailed ? status : failedMessage}
                </Badge>
              )}
            </div>
          </>
        )}
      {allowThumbnailUpload && (
        <FileInput
          key="video-thumbnail-upload"
          fileInput={fileInputControl}
          supportedFileFormats={supportedFiles}
          allowMultiple={false}
        />
      )}
    </div>
  );
};
export default VideoThumbnail;
