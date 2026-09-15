import React, { useState } from 'react';
import type {
  TranscriptCredentials,
  TranscriptPreferencesForm,
  TranscriptionPlans,
} from '../data/api';
import { isEmpty } from 'lodash';
import {
  useDeleteTranscriptPreferences,
  useSetTranscriptCredentials,
  useSetTranscriptPreferences,
} from '../data/apiHooks';
import { useVideosPageContext } from '../VideosPageProvider';
import { RequestStatus, type RequestStatusType } from '../../../data/constants';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  ActionRow,
  Collapsible,
  Icon,
  IconButton,
  Sheet,
  TransitionReplace,
} from '@openedx/paragon';
import { ChevronLeft, ChevronRight, Close } from '@openedx/paragon/icons';
import { AdditionalTranslationsComponentSlot } from '../../../plugin-slots/AdditionalTranslationsComponentSlot';
import OrderTranscriptForm from './OrderTranscriptForm';
import messages from './messages';

type TranscriptFormData = TranscriptPreferencesForm & TranscriptCredentials;
type TranscriptSettingsProps = {
  isTranscriptSettingsOpen: boolean;
  closeTranscriptSettings: () => void;
  courseId: string;
};

const TranscriptSettings = ({
  isTranscriptSettingsOpen,
  closeTranscriptSettings,
  courseId,
}: TranscriptSettingsProps) => {
  const { pageSettings } = useVideosPageContext();
  const {
    activeTranscriptPreferences,
    videoTranscriptSettings = {} as { transcriptionPlans?: TranscriptionPlans | null; },
    isAiTranslationsEnabled = false,
  } = pageSettings;
  const transcriptCredentials = pageSettings.transcriptCredentials || {};
  const transcriptionPlans = videoTranscriptSettings.transcriptionPlans || {};
  const deletePreferencesMutation = useDeleteTranscriptPreferences(courseId);
  const credentialsMutation = useSetTranscriptCredentials(courseId);
  const preferencesMutation = useSetTranscriptPreferences(courseId);
  const [transcriptType, setTranscriptType] = useState<string | null>(null);
  const [isAiTranslations, setIsAiTranslations] = useState(false);
  const [transcriptStatus, setTranscriptStatus] = useState<RequestStatusType | ''>('');
  const [errorMessages, setErrorMessages] = useState<{ transcript: string[]; }>({ transcript: [] });

  const handleOrderTranscripts = (data: TranscriptFormData, provider: string) => {
    const noCredentials = isEmpty(transcriptCredentials) || data.apiKey;
    setErrorMessages({ transcript: [] });
    setTranscriptStatus(RequestStatus.IN_PROGRESS);
    const onError = (error: unknown, fallback: string) => {
      const response = (error as { response?: { data?: { error?: string; }; }; }).response;
      setErrorMessages({ transcript: [response?.data?.error || fallback] });
      setTranscriptStatus(RequestStatus.FAILED);
    };
    if (provider === 'order') {
      deletePreferencesMutation.mutate(undefined, {
        onSuccess: () => setTranscriptStatus(RequestStatus.SUCCESSFUL),
        onError: error => onError(error, 'Failed to update order transcripts settings.'),
      });
    } else if (noCredentials) {
      credentialsMutation.mutate({ ...data, provider, global: false }, {
        onSuccess: () => setTranscriptStatus(RequestStatus.SUCCESSFUL),
        onError: error => onError(error, `Failed to update ${provider} credentials.`),
      });
    } else {
      preferencesMutation.mutate({ ...data, provider, global: false }, {
        onSuccess: () => setTranscriptStatus(RequestStatus.SUCCESSFUL),
        onError: error => onError(error, `Failed to update ${provider} transcripts settings.`),
      });
    }
  };

  return (
    <Sheet
      position="right"
      blocking
      show={isTranscriptSettingsOpen}
      onClose={closeTranscriptSettings}
    >
      <div>
        {!isAiTranslations && (
          <>
            <ActionRow>
              <TransitionReplace>
                {transcriptType ?
                  (
                    <IconButton
                      key="back-button"
                      size="sm"
                      iconAs={Icon}
                      src={ChevronLeft}
                      onClick={() => setTranscriptType(null)}
                      alt="back button to main transcript settings view"
                    />
                  ) :
                  (
                    <div key="title" className="h3">
                      <FormattedMessage {...messages.transcriptSettingsTitle} />
                    </div>
                  )}
              </TransitionReplace>
              <ActionRow.Spacer />
              <IconButton size="sm" iconAs={Icon} src={Close} onClick={closeTranscriptSettings} alt="close settings" />
            </ActionRow>
            <TransitionReplace>
              {transcriptType ?
                (
                  <div key="transcript-settings">
                    <OrderTranscriptForm
                      {...{
                        setTranscriptType,
                        transcriptType,
                        activeTranscriptPreferences,
                        transcriptCredentials,
                        closeTranscriptSettings,
                        handleOrderTranscripts,
                        transcriptionPlans,
                        errorMessages,
                        transcriptStatus,
                      }}
                    />
                  </div>
                ) :
                (
                  <div key="transcript-type-selection" className="mt-3">
                    <Collapsible.Advanced
                      onOpen={() => setTranscriptType('order')}
                    >
                      <Collapsible.Trigger className="row m-0 justify-content-between align-items-center">
                        <FormattedMessage {...messages.orderTranscriptsTitle} />
                        <Icon src={ChevronRight} />
                      </Collapsible.Trigger>
                    </Collapsible.Advanced>
                  </div>
                )}
            </TransitionReplace>
          </>
        )}
        <TransitionReplace>
          <div data-testid="translations-component">
            <AdditionalTranslationsComponentSlot
              setIsAiTranslations={setIsAiTranslations}
              closeTranscriptSettings={closeTranscriptSettings}
              courseId={courseId}
              transcriptType={transcriptType as string}
              isAiTranslationsEnabled={isAiTranslationsEnabled}
            />
          </div>
        </TransitionReplace>
      </div>
    </Sheet>
  );
};

export default TranscriptSettings;
