import React from 'react';
import { Helmet } from 'react-helmet';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Container } from '@openedx/paragon';
import { AgreementGated } from '@src/constants';
import { AlertAgreementGatedFeature } from '@src/generic/agreement-gated-feature';
import Placeholder from '@src/editors/Placeholder';
import getPageHeadTitle from '@src/generic/utils';
import EditVideoAlertsSlot from '@src/plugin-slots/EditVideoAlertsSlot';
import CourseVideosSlot from '@src/plugin-slots/CourseVideosSlot';
import { useCourseAuthoringContext } from '@src/CourseAuthoringContext';
import { EditFileErrors } from '../generic';
import messages from './messages';
import VideosPageProvider, { useVideosPageContext } from './VideosPageProvider';

const VideosPageContent = () => {
  const intl = useIntl();
  const { courseDetails } = useCourseAuthoringContext();
  const {
    errors,
    resetErrors,
    loadingStatus,
    addingStatus,
    deletingStatus,
    updatingStatus,
  } = useVideosPageContext();

  return (
    <>
      <Helmet>
        <title>{getPageHeadTitle(courseDetails?.name || '', intl.formatMessage(messages.heading))}</title>
      </Helmet>
      <Container size="xl" className="p-4 pt-4.5">
        <EditFileErrors
          resetErrors={resetErrors}
          errorMessages={errors}
          addFileStatus={addingStatus}
          deleteFileStatus={deletingStatus}
          updateFileStatus={updatingStatus}
          loadingStatus={loadingStatus}
        />
        <AlertAgreementGatedFeature
          gatingTypes={[AgreementGated.UPLOAD, AgreementGated.UPLOAD_VIDEOS]}
        />
        <EditVideoAlertsSlot />
        <h2>{intl.formatMessage(messages.heading)}</h2>
        <CourseVideosSlot />
      </Container>
    </>
  );
};

const VideosPage = () => {
  const { courseId } = useCourseAuthoringContext();

  return (
    <VideosPageProvider courseId={courseId}>
      <VideosPageDeniedBoundary>
        <VideosPageContent />
      </VideosPageDeniedBoundary>
    </VideosPageProvider>
  );
};

const VideosPageDeniedBoundary = ({ children }: { children: React.ReactNode; }) => {
  const { pageQuery } = useVideosPageContext();
  const status = (pageQuery.error as { response?: { status?: number; }; })?.response?.status;
  if (status === 403) {
    return (
      <div data-testid="under-construction-placeholder" className="row justify-contnt-center m-6">
        <Placeholder />
      </div>
    );
  }
  return <>{children}</>;
};

export default VideosPage;
