import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button, TransitionReplace } from '@edx/paragon';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useModel } from '../../generic/model-store';
import AppSettingsModal from '../app-settings-modal/AppSettingsModal';
import messages from './messages';
import TeamSetEditor from './TeamSetEditor';

function TeamSettings({
  intl,
  onClose,
}) {
  const settings = useModel('pages', 'teams');
  const [newTeamSet, updateNewTeamSet] = useState(null);
  const handleDelete = (deletedTeamSet) => console.log(deletedTeamSet);
  const handleAddNewTeamSet = () => {
    updateNewTeamSet({
      name: '',
      description: '',
      type: 'open',
      max_team_size: 5,
      id: '',
    });
  };

  const teams = settings.teamSets || [
    {
      name: 'test',
      description: 'asdfasdfsd adfasdfsd',
      type: 'open',
      max_team_size: 10,
      id: 'test',
    },
    {
      name: 'test2',
      description: 'rpasdfsad',
      type: 'private_managed',
      max_team_size: 10,
      id: 'test2',
    },
  ];
  return (
    <AppSettingsModal
      title={intl.formatMessage(messages.heading)}
      enableAppHelp={intl.formatMessage(messages.enable_teams_help)}
      enableAppLabel={intl.formatMessage(messages.enable_teams_label)}
      learnMoreText={intl.formatMessage(messages.enable_teams_link)}
      settings={settings}
      onClose={onClose}
    >
      <h5>{intl.formatMessage(messages.team_sets)}</h5>
      {teams.map(team => (
        <TeamSetEditor teamSet={team} onDelete={handleDelete} />
      ))}

      <TransitionReplace>
        {
          newTeamSet
            ? (
              <TeamSetEditor teamSet={newTeamSet} key="adding-new-team-set" />
            ) : (
              <Button key="not-adding-new-team-set" variant="plain" onClick={handleAddNewTeamSet}>
                <FontAwesomeIcon icon={faPlus} /> {intl.formatMessage(messages.add_team_set)}
              </Button>
            )
        }
      </TransitionReplace>

    </AppSettingsModal>
  );
}

TeamSettings.propTypes = {
  intl: intlShape.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default injectIntl(TeamSettings);
