import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  Button,
  Icon,
  IconButton,
  Spinner,
  Stack,
  Toast,
} from '@openedx/paragon';
import {
  Add,
  Delete,
  Error as ErrorIcon,
  FileUpload,
  Article,
} from '@openedx/paragon/icons';
import { useIntl } from '@edx/frontend-platform/i18n';

import ErrorAlert from '../../../editors/sharedComponents/ErrorAlerts/ErrorAlert';
import { getLanguages, getSortedTranscripts } from '../data/utils';
import Transcript from './transcript-item';
import LanguageSelect from './transcript-item/LanguageSelect';
import { FileInput, useFileInput } from '../../generic';
import { downloadTranscript } from '../data/api';
import { useDeleteTranscript, useUploadTranscript } from '../data/apiHooks';
import { useVideosPageContext } from '../VideosPageProvider';
import { RequestStatus, type RequestStatusType } from '../../../data/constants';
import messages from './messages';
import { isValidSrt } from '../transcript-editor/srtUtils';

type TranscriptVideo = { transcripts: string[]; id: string; displayName: string; };
type TranscriptData = { language: string; newLanguage?: string; file?: File; };
type TranscriptTabProps = { video: TranscriptVideo; };

const TranscriptTab = ({ video }: TranscriptTabProps) => {
  const intl = useIntl();
  const divRef = useRef<HTMLDivElement>(null);
  const { courseId, pageSettings } = useVideosPageContext();
  const {
    transcriptAvailableLanguages = [],
    videoTranscriptSettings = {} as NonNullable<typeof pageSettings.videoTranscriptSettings>,
  } = pageSettings;
  const {
    transcriptDeleteHandlerUrl,
    transcriptUploadHandlerUrl,
    transcriptDownloadHandlerUrl,
  } = videoTranscriptSettings;
  const { transcripts = [], id, displayName } = video;
  const deleteMutation = useDeleteTranscript(courseId);
  const uploadMutation = useUploadTranscript(courseId);
  const [transcriptStatus, setTranscriptStatus] = useState<RequestStatusType | ''>('');
  const [transcriptErrors, setTranscriptErrors] = useState<string[]>([]);
  const languages = useMemo<Record<string, string>>(
    () => getLanguages(transcriptAvailableLanguages),
    [transcriptAvailableLanguages],
  );
  const sortedTranscripts = getSortedTranscripts(languages, transcripts);
  const [previousSelection, setPreviousSelection] = useState<string[]>(sortedTranscripts);
  const [isAddingTranscript, setIsAddingTranscript] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [isSubmittingNewTranscript, setIsSubmittingNewTranscript] = useState(false);
  const [showAddTranscriptError, setShowAddTranscriptError] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [invalidSrtFile, setInvalidSrtFile] = useState(false);

  const addTranscriptFileInput = useFileInput({
    onAddFile: (files) => {
      const [file] = files;
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result !== 'string' || !isValidSrt(result)) {
          setInvalidSrtFile(true);
          setSelectedFile(null);
        } else {
          setInvalidSrtFile(false);
          setSelectedFile(file);
          setShowAddTranscriptError(false);
        }
      };
      reader.readAsText(file);
    },
    setSelectedRows: () => {},
    setAddOpen: () => {},
  });

  useEffect(() => {
    setTranscriptErrors([]);
    setPreviousSelection(getSortedTranscripts(languages, transcripts));
  }, [languages, transcripts.join('|')]);

  useEffect(() => {
    if (isAddingTranscript) {
      const firstAvailableLanguage = Object.keys(languages).find((lang) => !previousSelection.includes(lang));
      setNewLanguage(firstAvailableLanguage || '');
      setSelectedFile(null);
    }
  }, [isAddingTranscript]);

  const handleTranscript = (data: TranscriptData, actionType: 'delete' | 'download' | 'upload') => {
    const {
      language,
      newLanguage: transcriptNewLanguage,
      file,
    } = data;
    setTranscriptErrors([]);
    setTranscriptStatus(RequestStatus.IN_PROGRESS);
    switch (actionType) {
      case 'delete':
        /* istanbul ignore if -- legacy empty-row path; the add form no longer creates empty rows */
        if (!language) {
          setPreviousSelection(current => current.filter(Boolean));
          setTranscriptStatus(RequestStatus.SUCCESSFUL);
        } else {
          deleteMutation.mutate({ language, videoId: id, apiUrl: transcriptDeleteHandlerUrl }, {
            onSuccess: () => {
              setPreviousSelection(current => current.filter(transcript => transcript !== language));
              setTranscriptStatus(RequestStatus.SUCCESSFUL);
            },
            onError: () => {
              setTranscriptErrors([`Failed to delete ${language} transcript.`]);
              setTranscriptStatus(RequestStatus.FAILED);
            },
          });
        }
        break;
      case 'download': {
        const filename = `${displayName}-${language}.srt`;
        void downloadTranscript({
          filename,
          language,
          videoId: id,
          apiUrl: transcriptDownloadHandlerUrl,
        }).then(
          () => setTranscriptStatus(RequestStatus.SUCCESSFUL),
          () => {
            setTranscriptErrors([`Failed to download ${filename}.`]);
            setTranscriptStatus(RequestStatus.FAILED);
          },
        );
        break;
      }
      case 'upload': {
        const isReplacement = Boolean(language);
        uploadMutation.mutate({
          language,
          videoId: id,
          apiUrl: transcriptUploadHandlerUrl,
          newLanguage: transcriptNewLanguage || '',
          file: file!,
        }, {
          onSuccess: () => {
            setTranscriptStatus(RequestStatus.SUCCESSFUL);
            setPreviousSelection(current =>
              getSortedTranscripts(
                languages,
                isReplacement
                  ? [...current.filter(transcript => transcript !== language), transcriptNewLanguage!]
                  : [...current, transcriptNewLanguage!],
              )
            );
            if (isReplacement) {
              setShowAddedToast(true);
            } else {
              setIsSubmittingNewTranscript(false);
              setPendingFileName('');
              setIsAddingTranscript(false);
              setSelectedFile(null);
              setShowAddTranscriptError(false);
              setShowAddedToast(true);
            }
          },
          onError: (error) => {
            const response = (error as { response?: { data?: { error?: string; }; }; }).response;
            const message = response?.data?.error || (isReplacement
              ? `Failed to replace ${language} with ${transcriptNewLanguage}.`
              : `Failed to add ${transcriptNewLanguage}.`);
            setTranscriptErrors([message]);
            setTranscriptStatus(RequestStatus.FAILED);
            if (!isReplacement) {
              setIsSubmittingNewTranscript(false);
              setPendingFileName('');
              setSelectedFile(null);
              setShowAddTranscriptError(true);
            }
          },
        });
        break;
      }
      /* istanbul ignore next */
      default:
        break;
    }
  };

  const availableLanguages = Object.entries(languages)
    .filter(([lang]) => !previousSelection.includes(lang));

  const handleSubmitNewTranscript = () => {
    /* istanbul ignore if -- the submit button is disabled in this state */
    if (!newLanguage || !selectedFile) {
      return;
    }
    setShowAddTranscriptError(false);
    setIsSubmittingNewTranscript(true);
    setPendingFileName(selectedFile.name);
    handleTranscript({
      language: '',
      newLanguage,
      file: selectedFile,
    }, 'upload');
  };

  return (
    <Stack gap={3}>
      <div ref={divRef} style={{ overflowY: 'auto' }} className="px-1 py-2">
        <ErrorAlert
          hideHeading={false}
          isError={!isAddingTranscript && transcriptStatus === RequestStatus.FAILED && transcriptErrors.length > 0}
        >
          <ul className="p-0">
            {transcriptErrors.map(message => (
              <li key={`transcript-error-${message}`} style={{ listStyle: 'none' }}>
                {intl.formatMessage(messages.errorAlertMessage, { message })}
              </li>
            ))}
          </ul>
        </ErrorAlert>
        {isAddingTranscript ?
          (
            <Stack gap={3}>
              <div className="h4 mb-0">{intl.formatMessage(messages.newTranscriptTitle)}</div>

              <div>
                <LanguageSelect
                  options={languages}
                  value={newLanguage}
                  placeholderText={intl.formatMessage(messages.languageSelectPlaceholder)}
                  previousSelection={previousSelection}
                  className="col-12 p-0"
                  handleSelect={(lang) => {
                    setNewLanguage(lang);
                    setShowAddTranscriptError(false);
                  }}
                />
              </div>

              {!selectedFile && !isSubmittingNewTranscript && (
                <Button
                  variant="outline-primary"
                  iconBefore={FileUpload}
                  className="justify-content-center w-100 mb-0 transcript-upload-button"
                  onClick={addTranscriptFileInput.click}
                >
                  {intl.formatMessage(messages.uploadFileLabel)}
                </Button>
              )}

              {isSubmittingNewTranscript ?
                (
                  <Stack direction="horizontal" className="align-items-center text-gray-700 py-1">
                    <Spinner animation="border" size="sm" className="mr-2" />
                    <span className="small">{pendingFileName}</span>
                  </Stack>
                ) :
                null}

              {selectedFile && !isSubmittingNewTranscript ?
                (
                  <Stack
                    direction="horizontal"
                    className="align-items-center justify-content-between rounded py-1 transcript-tab__file-row"
                  >
                    <Stack
                      direction="horizontal"
                      gap={2}
                      className="align-items-center text-gray-700 overflow-hidden transcript-tab__file-name-wrap"
                    >
                      <Icon src={Article} size="sm" className="flex-shrink-0" />
                      <span className="text-truncate transcript-tab__file-name">{selectedFile.name}</span>
                    </Stack>
                    <IconButton
                      src={Delete}
                      iconAs={Icon}
                      alt={intl.formatMessage(messages.removeSelectedFileLabel)}
                      onClick={() => setSelectedFile(null)}
                      className="flex-shrink-0"
                    />
                  </Stack>
                ) :
                null}

              {showAddTranscriptError && (
                <Stack direction="horizontal" gap={2} className="align-items-center text-danger-500">
                  <Icon src={ErrorIcon} size="xs" />
                  <span>{intl.formatMessage(messages.addTranscriptFailedLabel)}</span>
                </Stack>
              )}

              {invalidSrtFile && (
                <Stack direction="horizontal" gap={2} className="align-items-center text-danger-500">
                  <Icon src={ErrorIcon} size="xs" />
                  <span>{intl.formatMessage(messages.invalidSrtFormat)}</span>
                </Stack>
              )}

              {!selectedFile && <div className="small text-gray-500">{intl.formatMessage(messages.uploadHelpText)}
              </div>}

              <Stack direction="horizontal" gap={3} className="justify-content-end">
                <Button
                  variant="tertiary"
                  disabled={isSubmittingNewTranscript}
                  onClick={() => {
                    setIsAddingTranscript(false);
                    setSelectedFile(null);
                    setPendingFileName('');
                    setIsSubmittingNewTranscript(false);
                    setShowAddTranscriptError(false);
                    setInvalidSrtFile(false);
                  }}
                >
                  {intl.formatMessage(messages.cancelButtonLabel)}
                </Button>
                <Button
                  disabled={!selectedFile || !newLanguage || isSubmittingNewTranscript}
                  onClick={handleSubmitNewTranscript}
                >
                  {intl.formatMessage(messages.addTranscriptButtonLabel)}
                </Button>
              </Stack>

              <FileInput
                key="new-transcript-input"
                fileInput={addTranscriptFileInput}
                supportedFileFormats={['.srt']}
                allowMultiple={false}
              />
            </Stack>
          ) :
          (
            <>
              {previousSelection.map((transcript, idx) => (
                <Transcript
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  {...{
                    languages,
                    transcript,
                    previousSelection,
                    handleTranscript,
                    video,
                    transcriptSettings: videoTranscriptSettings,
                  }}
                />
              ))}
            </>
          )}
      </div>
      {!isAddingTranscript && (
        <div className="border-top border-light-400">
          <Button
            variant="link"
            iconBefore={Add}
            size="sm"
            className="text-primary-500 justify-content-start pl-0 pt-3"
            onClick={() => setIsAddingTranscript(true)}
            disabled={availableLanguages.length === 0}
          >
            {intl.formatMessage(messages.uploadButtonLabel)}
          </Button>
        </div>
      )}
      <Toast show={showAddedToast} onClose={() => setShowAddedToast(false)}>
        {intl.formatMessage(messages.newTranscriptAddedLabel)}
      </Toast>
    </Stack>
  );
};

export default TranscriptTab;
