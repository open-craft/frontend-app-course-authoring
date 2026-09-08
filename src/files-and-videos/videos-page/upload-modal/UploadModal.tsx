import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow,
  Alert,
  Button,
  Hyperlink,
  ModalDialog,
  Scrollable,
} from '@openedx/paragon';
import { WarningFilled } from '@openedx/paragon/icons';
import messages from '../messages';
import UploadProgressList from './UploadProgressList';
import { RequestStatus } from '../../../data/constants';

const LegacyModalDialog = ModalDialog as unknown as React.ComponentType<
  Omit<React.ComponentProps<typeof ModalDialog>, 'isOverflowVisible'>
>;
const LegacyHyperlink = Hyperlink as unknown as React.ComponentType<
  Omit<React.ComponentProps<typeof Hyperlink>, 'children'>
>;

type UploadVideo = { name: string; status: string; uploadPercentage: string | number; };
type UploadModalProps = {
  isUploadTrackerOpen: boolean;
  handleUploadCancel: () => void;
  currentUploadingIdsRef: { uploadData: Record<string, UploadVideo>; uploadCount: number; };
  addVideoStatus: string;
};

const UploadModal = ({
  isUploadTrackerOpen,
  handleUploadCancel,
  currentUploadingIdsRef,
  addVideoStatus,
}: UploadModalProps) => {
  const intl = useIntl();
  const videosPagePath = '';
  const { uploadData, uploadCount } = currentUploadingIdsRef;
  const cancelIsDisabled = addVideoStatus === RequestStatus.FAILED || addVideoStatus === RequestStatus.SUCCESSFUL;

  return (
    <LegacyModalDialog
      title={intl.formatMessage(messages.videoUploadTrackerModalTitle)}
      isOpen={isUploadTrackerOpen}
      onClose={handleUploadCancel}
      isBlocking
      hasCloseButton={false}
      size="lg"
    >
      <ModalDialog.Header>
        <ModalDialog.Title className="mb-3">
          {intl.formatMessage(messages.videoUploadTrackerModalTitle)}
        </ModalDialog.Title>
        <Alert
          variant="warning"
          icon={WarningFilled}
        >
          <Alert.Heading>
            {intl.formatMessage(messages.videoUploadTrackerAlertTitle)}
          </Alert.Heading>
          {intl.formatMessage(messages.videoUploadTrackerAlertBodyMessage)}
          <div className="mt-3">
            <span className="font-weight-bold">
              {intl.formatMessage(messages.videoUploadTrackerAlertEditMessage)}
            </span>
            <LegacyHyperlink
              className="ml-2"
              destination={videosPagePath}
              target="_blank"
              content={intl.formatMessage(messages.videoUploadTrackerAlertEditHyperlinkLabel)}
            />
          </div>
        </Alert>
        <div className="my-4 text-primary-500">
          {intl.formatMessage(
            messages.videoUploadTrackerModalBody,
            { uploadCount },
          )}
        </div>
      </ModalDialog.Header>
      <Scrollable>
        <ModalDialog.Body>
          <UploadProgressList videosList={Object.entries(uploadData)} />
        </ModalDialog.Body>
      </Scrollable>
      <ModalDialog.Footer>
        <ActionRow>
          <Button onClick={handleUploadCancel} disabled={cancelIsDisabled}>
            {intl.formatMessage(messages.videoUploadTrackerAlertCancelLabel)}
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </LegacyModalDialog>
  );
};

export default UploadModal;
