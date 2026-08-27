// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {Command} from '@mattermost/types/integrations';
import type {Team} from '@mattermost/types/teams';
import type {UserProfile} from '@mattermost/types/users';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import type {ActionResult} from 'mattermost-redux/types/actions';

import AddCommand from 'components/integrations/add_command';
import ConfirmIntegration from 'components/integrations/confirm_integration';
import EditCommand from 'components/integrations/edit_command';
import InstalledCommands from 'components/integrations/installed_commands';

import {Navigate, Route, Routes} from 'utils/react_router_v6';

type Props = {

    /**
     * The team data needed to pass into child components
     */
    team?: Team;

    /**
     * The user data needed to pass into child components
     */
    user?: UserProfile;

    /**
     * The users collection
     */
    users?: RelationOneToOne<UserProfile, UserProfile>;

    /**
     * Installed slash commands to display
     */
    commands: Command[];

    /**
     * Object from react-router
     */
    match: {
        url: string;
    };

    actions: {

        /**
         * The function to call to fetch team commands
         */
        loadCommandsAndProfilesForTeam: (teamId: string) => Promise<ActionResult>;
    };

    /**
     * Whether or not commands are enabled.
     */
    enableCommands?: boolean;
};

type State = {
    loading: boolean;
};

export default class CommandsContainer extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: true,
        };
    }

    componentDidMount() {
        if (this.props.enableCommands) {
            this.props.actions.loadCommandsAndProfilesForTeam(this.props.team?.id || '').then(
                () => this.setState({loading: false}),
            );
        }
    }

    render() {
        const extraProps = {
            loading: this.state.loading,
            commands: this.props.commands || [],
            users: this.props.users,
            team: this.props.team,
            user: this.props.user,
        };
        return (
            <div>
                <Routes>
                    <Route
                        path={`${this.props.match.url}/`}
                        element={
                            <Navigate
                                to={`${this.props.match.url}/installed`}
                                replace={true}
                            />
                        }
                    />
                    <Route
                        path={`${this.props.match.url}/installed`}
                        element={
                            <InstalledCommands
                                {...extraProps}
                            />
                        }
                    />
                    <Route
                        path={`${this.props.match.url}/add`}
                        element={
                            <AddCommand
                                {...extraProps}
                            />
                        }
                    />
                    <Route
                        path={`${this.props.match.url}/edit`}
                        render={(routeProps) => (
                            <EditCommand
                                {...extraProps}
                                {...routeProps}
                            />
                        )}
                    />
                    <Route
                        path={`${this.props.match.url}/confirm`}
                        render={(routeProps) => (
                            <ConfirmIntegration
                                {...extraProps}
                                {...routeProps}
                            />
                        )}
                    />
                </Routes>
            </div>
        );
    }
}
