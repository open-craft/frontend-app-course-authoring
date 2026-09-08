import React from 'react';
import { Stack } from '@openedx/paragon';
import { FormattedDate, FormattedMessage } from '@edx/frontend-platform/i18n';
import { getFileSizeToClosestByte } from '../../../utils';
import { getFormattedDuration } from '../data/utils';
import messages from './messages';

type InfoVideo = {
  duration?: number;
  dateAdded?: string;
  fileSize?: number;
};

type InfoTabProps = { video?: InfoVideo; };

const InfoTab = ({ video = {} }: InfoTabProps) => {
  const fileSize = getFileSizeToClosestByte(video?.fileSize);
  const duration = getFormattedDuration(video?.duration);

  return (
    <Stack className="mt-3">
      <div className="font-weight-bold">
        <FormattedMessage {...messages.dateAddedTitle} />
      </div>
      <FormattedDate
        value={video?.dateAdded}
        year="numeric"
        month="short"
        day="2-digit"
        hour="numeric"
        minute="numeric"
      />
      <div className="font-weight-bold mt-3">
        <FormattedMessage {...messages.fileSizeTitle} />
      </div>
      {fileSize}
      <div className="font-weight-bold mt-3">
        <FormattedMessage {...messages.videoLengthTitle} />
      </div>
      {duration}
    </Stack>
  );
};

export default InfoTab;
