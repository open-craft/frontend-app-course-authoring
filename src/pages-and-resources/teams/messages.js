import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  heading: {
    id: 'course-authoring.pages-resources.teams.heading',
    defaultMessage: 'Configure teams',
  },
  enable_teams_label: {
    id: 'course-authoring.pages-resources.teams.enable-teams.label',
    defaultMessage: 'Teams',
  },
  enable_teams_help: {
    id: 'course-authoring.pages-resources.teams.enable-teams.help',
    defaultMessage: `Define the structure of teams in your course by adding
    team-sets; groups focussed around specific topics you create`,
  },
  enable_teams_link: {
    id: 'course-authoring.pages-resources.teams.enable-teams.link',
    defaultMessage: 'Learn more about the teams',
  },
  team_sets: {
    id: 'course-authoring.pages-resources.teams.team-sets.heading',
    defaultMessage: 'Team-sets',
  },
  configure_team_set: {
    id: 'course-authoring.pages-resources.teams.configure-team-set.heading',
    defaultMessage: 'Configure team-set',
  },
  team_set_form_name_label: {
    id: 'course-authoring.pages-resources.teams.team-set.name.label',
    defaultMessage: 'Name',
  },
  team_set_form_name_help: {
    id: 'course-authoring.pages-resources.teams.team-set.name.help',
    defaultMessage: 'The name learners will see when interacting with your team-set',
  },
  team_set_form_description_label: {
    id: 'course-authoring.pages-resources.teams.team-set.description.label',
    defaultMessage: 'Description',
  },
  team_set_form_description_help: {
    id: 'course-authoring.pages-resources.teams.team-set.description.help',
    defaultMessage: 'Details about your team-set, displayed below the team-set name.',
  },
  team_set_form_type_label: {
    id: 'course-authoring.pages-resources.teams.team-set.type.label',
    defaultMessage: 'Type',
  },
  team_set_form_type_help: {
    id: 'course-authoring.pages-resources.teams.team-set.type.help',
    defaultMessage: 'Control who can see, create and join teams',
  },
  team_set_type_open: {
    id: 'course-authoring.pages-resources.teams.team-set.types.open',
    defaultMessage: 'Open',
  },
  team_set_type_public_managed: {
    id: 'course-authoring.pages-resources.teams.team-set.types.public_managed',
    defaultMessage: 'Public Managed',
  },
  team_set_type_private_managed: {
    id: 'course-authoring.pages-resources.teams.team-set.types.private_managed',
    defaultMessage: 'Private Managed',
  },
  team_set_form_max_size_label: {
    id: 'course-authoring.pages-resources.teams.team-set.max-size.label',
    defaultMessage: 'Max team size',
  },
  team_set_form_max_size_help: {
    id: 'course-authoring.pages-resources.teams.team-set.max-size.help',
    defaultMessage: 'The maximum number of learners that can join a team',
  },
  add_team_set: {
    id: 'course-authoring.pages-resources.teams.add-team-set.button',
    defaultMessage: 'Add team-set',
  },
  delete: {
    id: 'course-authoring.pages-resources.teams.delete-team-set.delete.button',
    defaultMessage: 'Delete',
  },
  cancel: {
    id: 'course-authoring.pages-resources.teams.delete-team-set.cancel-delete.button',
    defaultMessage: 'Cancel',
  },
  team_set_delete_heading: {
    id: 'course-authoring.pages-resources.teams.delete-team-set.heading',
    defaultMessage: 'Delete team-set?',
  },
  team_set_delete_body: {
    id: 'course-authoring.pages-resources.teams.delete-team-set.heading',
    defaultMessage: `EdX recommends that you do not delete team-sets once your
    course is running. Your team-set will no longer be visible in the LMS and
    learners will not be able to leave teams associated with it. Please delete
    learners from teams before deleting the associated team-set.`,
  },
});

export default messages;
