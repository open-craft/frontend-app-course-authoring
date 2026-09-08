import React, { useState } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  Button,
  Icon,
  IconButton,
  ModalPopup,
  Menu,
  MenuItem,
  useToggle,
} from '@openedx/paragon';
import { MoreHoriz } from '@openedx/paragon/icons';

import messages from './messages';

type TranscriptActionMenuProps = {
  language: string;
  launchDeleteConfirmation: () => void;
  handleTranscript: (data: { language: string; }, action: 'download') => void;
  input: { click: () => void; };
  onEdit?: (language: string) => void;
};

export const TranscriptActionMenu = ({
  language,
  launchDeleteConfirmation,
  handleTranscript,
  input,
  onEdit = () => {},
}: TranscriptActionMenuProps) => {
  const [isOpen, , close, toggle] = useToggle();
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <IconButton
        src={MoreHoriz}
        iconAs={Icon}
        onClick={toggle}
        ref={setTarget}
        alt="Actions dropdown"
        data-testid={`${language}-transcript-menu`}
      />
      <ModalPopup
        placement="bottom-end"
        positionRef={target}
        isOpen={isOpen}
        onClose={close}
        onEscapeKey={close}
      >
        <Menu className="transcript-menu overflow-hidden">
          <MenuItem
            as={Button}
            variant="tertiary"
            onClick={() => {
              onEdit(language);
              close();
            }}
          >
            <FormattedMessage {...messages.editTranscript} />
          </MenuItem>
          <MenuItem
            as={Button}
            variant="tertiary"
            onClick={() => {
              input.click();
              close();
            }}
          >
            <FormattedMessage {...messages.replaceTranscript} />
          </MenuItem>
          <MenuItem
            as={Button}
            variant="tertiary"
            onClick={() => handleTranscript({ language }, 'download')}
          >
            <FormattedMessage {...messages.downloadTranscript} />
          </MenuItem>
          <hr className="my-2" />
          <MenuItem
            as={Button}
            variant="tertiary"
            onClick={launchDeleteConfirmation}
          >
            <FormattedMessage {...messages.deleteTranscript} />
          </MenuItem>
        </Menu>
      </ModalPopup>
    </>
  );
};

export default TranscriptActionMenu;
