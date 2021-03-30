import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import * as Yup from 'yup';
import FormSwitchGroup from '../../generic/FormSwitchGroup';
import AppSettingsModal from '../app-settings-modal/AppSettingsModal';

import messages from './messages';

function ProgressSettings({ intl, onClose }) {
  // TODO: Save settings using APIs here
  const handleSettingsSave = () => null;
  return (
    <AppSettingsModal
      appId="progress"
      title={intl.formatMessage(messages.heading)}
      enableAppHelp={intl.formatMessage(messages.enableProgressHelp)}
      enableAppLabel={intl.formatMessage(messages.enableProgressLabel)}
      learnMoreText={intl.formatMessage(messages.enableProgressLink)}
      onClose={onClose}
      // TODO: fetch these values from the redux store, via APIs
      initialValues={{ enableProgressGraph: false }}
      validationSchema={{ enableProgressGraph: Yup.boolean() }}
      onSettingsSave={handleSettingsSave}
    >
      {
        ({ handleChange, handleBlur, values }) => (
          <FormSwitchGroup
            id="enable-progress-graph"
            name="enableProgressGraph"
            label={intl.formatMessage(messages.enableGraphLabel)}
            helpText={intl.formatMessage(messages.enableGraphHelp)}
            onChange={handleChange}
            onBlur={handleBlur}
            checked={values.enableProgressGraph}
          />
        )
      }
    </AppSettingsModal>
  );
}

ProgressSettings.propTypes = {
  intl: intlShape.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default injectIntl(ProgressSettings);
