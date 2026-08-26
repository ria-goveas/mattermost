// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {ComponentType} from 'react';
import {
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom-v5-compat';

import type {Command} from '@mattermost/types/integrations';
import type {Team} from '@mattermost/types/teams';
import type {UserProfile} from '@mattermost/types/users';
import type {RelationOneToOne} from '@mattermost/types/utilities';

import type {ActionResult} from 'mattermost-redux/types/actions';

import AddCommand from 'components/integrations/add_command';
import ConfirmIntegration from 'components/integrations/confirm_integration';
import EditCommand from 'components/integrations/edit_command';
import InstalledCommands from 'components/integrations/installed_commands';

type CommandExtraProps = {
    loading: boolean;
    commands: Command[];
    users?: RelationOneToOne<UserProfile, UserProfile>;
    team?: Team;
    user?: UserProfile;
};

type CommandRouteProps = {
    component: ComponentType<any>;
    extraProps: CommandExtraProps;
};

const CommandRouteElement = ({component: Component, extraProps}: CommandRouteProps) => {
    const location = useLocation();

    return (
        <Component
            {...extraProps}
            location={location}
        />
    );
};

const renderCommandRoute = (path: string, component: ComponentType<any>, extraProps: CommandExtraProps) => (
    <Route
        key={path}
        path={path}
        element={
            <CommandRouteElement
                component={component}
                extraProps={extraProps}
            />
        }
    />
);

type CommandsRoutesProps = {
    extraProps: CommandExtraProps;
};

const CommandsRoutes = ({extraProps}: CommandsRoutesProps) => {
    return (
        <Routes>
            <Route
                index={true}
                element={<Navigate to='installed' replace={true}/>}
            />
            {renderCommandRoute('installed', InstalledCommands, extraProps)}
            {renderCommandRoute('add', AddCommand, extraProps)}
            {renderCommandRoute('edit', EditCommand, extraProps)}
            {renderCommandRoute('confirm', ConfirmIntegration, extraProps)}
        </Routes>
    );
};

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
                <CommandsRoutes extraProps={extraProps}/>
            </div>
        );
    }
}
