import React, { useState } from 'react';
import type { TranscriptCredentials, TranscriptPreferences, TranscriptionPlans } from '../data/api';
import type { VideosState } from '../data/slice';
import { isEmpty } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  clearAutomatedTranscript,
  resetErrors,
  updateTranscriptCredentials,
  updateTranscriptPreference,
} from '../data/thunks';

type TranscriptFormData = TranscriptPreferences & TranscriptCredentials;
type TranscriptSettingsPageSettings = {
  activeTranscriptPreferences?: TranscriptPreferences | null;
  transcriptCredentials: Record<string, boolean>;
  videoTranscriptSettings: { transcriptionPlans: TranscriptionPlans; };
  isAiTranslationsEnabled: boolean;
};
type TranscriptSettingsState = Omit<VideosState, 'pageSettings'> & { pageSettings: TranscriptSettingsPageSettings; };
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
  const dispatch = useDispatch();
  const { errors: errorMessages, pageSettings, transcriptStatus } = useSelector(
    (state: { videos: TranscriptSettingsState; }) => state.videos,
  );
  const {
    activeTranscriptPreferences,
    transcriptCredentials,
    videoTranscriptSettings,
    isAiTranslationsEnabled,
  } = pageSettings;
  const { transcriptionPlans } = videoTranscriptSettings || {};
  const [transcriptType, setTranscriptType] = useState<string | null>(null);
  const [isAiTranslations, setIsAiTranslations] = useState(false);

  const handleOrderTranscripts = (data: TranscriptFormData, provider: string) => {
    const noCredentials = isEmpty(transcriptCredentials) || data.apiKey;
    dispatch(resetErrors({ errorType: 'transcript' }));
    if (provider === 'order') {
      dispatch(clearAutomatedTranscript({ courseId }));
    } else if (noCredentials) {
      dispatch(updateTranscriptCredentials({ courseId, data: { ...data, provider, global: false } }));
    } else {
      dispatch(updateTranscriptPreference({ courseId, data: { ...data, provider, global: false } }));
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
