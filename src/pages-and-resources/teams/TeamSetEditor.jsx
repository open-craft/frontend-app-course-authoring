import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import * as Yup from 'yup';

import {
  Button, Collapsible, TransitionReplace, Form,
} from '@edx/paragon';
import { useFormik } from 'formik';
import messages from './messages';

function TeamSetEditor({
  intl, teamSet, onDelete,
}) {
  const [isDeleting, setDeleting] = useState(false);
  const initiateDeletion = () => setDeleting(true);
  const cancelDeletion = () => setDeleting(false);

  const {
    handleChange,
    handleBlur,
    values,
    // errors,
  } = useFormik({
    initialValues: teamSet,
    validationSchema: Yup.object().shape({
      name: Yup.string().required(),
      description: Yup.string(),
      type: Yup.mixed().oneOf(['open', 'public_managed', 'private_managed']).required(),
      max_team_size: Yup.number().required(),
    }),
    // onSubmit,
  });

  return (
    <Collapsible
      title={(
        <div className="d-flex flex-column small">
          <span>Open</span>
          <span className="h4">{teamSet.name}</span>
          <span>{teamSet.description}</span>
        </div>
    )}
    >
      <TransitionReplace>
        {isDeleting
          ? (
            <div className="d-flex flex-column m-4" key="isDeleting">
              <h3>{intl.formatMessage(messages.team_set_delete_heading)}</h3>
              <p>{intl.formatMessage(messages.team_set_delete_body)}</p>
              <div className="d-flex flex-row justify-content-end">
                <Button variant="muted" size="sm" onClick={() => onDelete(teamSet)}>
                  {intl.formatMessage(messages.delete)}
                </Button>
                <Button variant="muted" size="sm" onClick={cancelDeletion}>
                  {intl.formatMessage(messages.cancel)}
                </Button>
              </div>
            </div>
          )
          : (
            <React.Fragment key="isConfiguring">
              <Form.Group key="isConfiguring">
                <Form.Control
                  floatingLabel={intl.formatMessage(messages.team_set_form_name_label)}
                  defaultValue={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <Form.Text>{intl.formatMessage(messages.team_set_form_name_help)}</Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Control
                  floatingLabel={intl.formatMessage(messages.team_set_form_description_label)}
                  defaultValue={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <Form.Text>{intl.formatMessage(messages.team_set_form_description_help)}</Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Control
                  as="select"
                  floatingLabel={intl.formatMessage(messages.team_set_form_type_label)}
                  defaultValue={values.type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="open">
                    {intl.formatMessage(messages.team_set_type_open)}
                  </option>
                  <option value="public_managed">{intl.formatMessage(messages.team_set_type_public_managed)}</option>
                  <option value="private_managed">{intl.formatMessage(messages.team_set_type_private_managed)}</option>
                </Form.Control>
                <Form.Text>{intl.formatMessage(messages.team_set_form_type_help)}</Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Control
                  floatingLabel={intl.formatMessage(messages.team_set_form_max_size_label)}
                  defaultValue={values.max_team_size}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <Form.Text>{intl.formatMessage(messages.team_set_form_max_size_help)}</Form.Text>
              </Form.Group>
              {onDelete && (
              <>
                <hr style={{ marginLeft: '-0.75rem', marginRight: '-0.5rem' }} />
                <Button variant="muted" className="p-0" onClick={initiateDeletion}>
                  {intl.formatMessage(messages.delete)}
                </Button>
              </>
              )}
            </React.Fragment>
          )}
      </TransitionReplace>
    </Collapsible>
  );
}

export const teamSetShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  max_team_size: PropTypes.number.isRequired,
});

TeamSetEditor.propTypes = {
  intl: intlShape.isRequired,
  teamSet: teamSetShape.isRequired,
  onDelete: PropTypes.func,
};

TeamSetEditor.defaultProps = {
  onDelete: null,
};

export default injectIntl(TeamSetEditor);
