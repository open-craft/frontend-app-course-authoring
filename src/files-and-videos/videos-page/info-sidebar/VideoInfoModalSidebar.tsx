import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Stack } from '@openedx/paragon';
import TranscriptTab from './TranscriptTab';
import messages from './messages';

type Video = {
  displayName: string;
  wrapperType: string;
  id: string;
  dateAdded: string;
  fileSize: number;
  transcripts: string[];
  transcriptionStatus: string;
};

type VideoInfoModalSidebarProps = { video: Video; };

const VideoInfoModalSidebar = ({ video }: VideoInfoModalSidebarProps) => {
  const intl = useIntl();

  return (
    <Stack gap={2}>
      <div className="font-weight-bold pb-2 border-bottom border-light-400">
        {intl.formatMessage(messages.transcriptTabTitle, { transcriptCount: video.transcripts.length })}
      </div>
      <TranscriptTab {...{ video }} />
    </Stack>
  );
};

export default VideoInfoModalSidebar;
