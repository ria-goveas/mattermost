// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react';
import type {ComponentType} from 'react';
import {
    CompatRouter,
    Route,
    Routes,
    useLocation,
    useMatch,
} from 'react-router-dom-v5-compat';
import {createGlobalStyle} from 'styled-components';

import type {Team} from '@mattermost/types/teams';
import type {UserProfile} from '@mattermost/types/users';

import Emoji from 'components/emoji';
import AddEmoji from 'components/emoji/add_emoji';
import Integrations from 'components/integrations';
import AddIncomingWehook from 'components/integrations/add_incoming_webhook';
import AddOauthApp from 'components/integrations/add_oauth_app';
import AddOutgoingWebhook from 'components/integrations/add_outgoing_webhook';
import Bots from 'components/integrations/bots';
import AddBot from 'components/integrations/bots/add_bot';
import CommandsContainer from 'components/integrations/commands_container';
import ConfirmIntegration from 'components/integrations/confirm_integration';
import EditIncomingWebhook from 'components/integrations/edit_incoming_webhook';
import EditOauthApp from 'components/integrations/edit_oauth_app';
import EditOutgoingWebhook from 'components/integrations/edit_outgoing_webhook';
import InstalledIncomingWebhooks from 'components/integrations/installed_incoming_webhooks';
import InstalledOauthApps from 'components/integrations/installed_oauth_apps';
import InstalledOutgoingWebhooks from 'components/integrations/installed_outgoing_webhooks';
import AddOutgoingOAuthConnection from 'components/integrations/outgoing_oauth_connections/add_outgoing_oauth_connection';
import EditOutgoingOAuthConnection from 'components/integrations/outgoing_oauth_connections/edit_outgoing_oauth_connection';
import InstalledOutgoingOAuthConnections from 'components/integrations/outgoing_oauth_connections/installed_outgoing_oauth_connections';

import Pluggable from 'plugins/pluggable';

import BackstageNavbar from './components/backstage_navbar';
import BackstageSidebar from './components/backstage_sidebar';

type ExtraProps = Pick<Props, 'user' | 'team'> & {scrollToTop: () => void};

type BackstageRouteProps = {
    component: ComponentType<any>;
    extraProps: ExtraProps;
};

const BackstageRouteElement = ({component: Component, extraProps}: BackstageRouteProps) => {
    const location = useLocation();

    return (
        <Component
            {...extraProps}
            location={location}
        />
    );
};

const renderBackstageRoute = (path: string, component: ComponentType<any>, extraProps: ExtraProps) => (
    <Route
        key={path}
        path={path}
        element={
            <BackstageRouteElement
                component={component}
                extraProps={extraProps}
            />
        }
    />
);

type Props = {

    /**
     * Current user.
     */
    user: UserProfile;

    /**
     * Current team.
     */
    team?: Team;

    siteName?: string;
    enableCustomEmoji: boolean;
    enableIncomingWebhooks: boolean;
    enableOutgoingWebhooks: boolean;
    enableCommands: boolean;
    enableOAuthServiceProvider: boolean;
    enableOutgoingOAuthConnections: boolean;
    canCreateOrDeleteCustomEmoji: boolean;
    canManageIntegrations: boolean;
};

function useBackstageBaseUrl(): string {
    const integrationsMatch = useMatch('/:team/integrations/*');
    const emojiMatch = useMatch('/:team/emoji/*');
    const integrationsExactMatch = useMatch('/:team/integrations');
    const emojiExactMatch = useMatch('/:team/emoji');

    const match = integrationsMatch ?? emojiMatch ?? integrationsExactMatch ?? emojiExactMatch;

    return match?.pathnameBase ?? '';
}

type BackstageRoutesProps = {
    extraProps: ExtraProps;
};

const BackstageRoutes = ({extraProps}: BackstageRoutesProps) => {
    const baseUrl = useBackstageBaseUrl();

    return (
        <Routes>
            {renderBackstageRoute('/:team/integrations', Integrations, extraProps)}
            {renderBackstageRoute(`${baseUrl}/incoming_webhooks`, InstalledIncomingWebhooks, extraProps)}
            {renderBackstageRoute(`${baseUrl}/incoming_webhooks/add`, AddIncomingWehook, extraProps)}
            {renderBackstageRoute(`${baseUrl}/incoming_webhooks/edit`, EditIncomingWebhook, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing_webhooks`, InstalledOutgoingWebhooks, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing_webhooks/add`, AddOutgoingWebhook, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing_webhooks/edit`, EditOutgoingWebhook, extraProps)}
            {renderBackstageRoute(`${baseUrl}/commands/*`, CommandsContainer, extraProps)}
            {renderBackstageRoute(`${baseUrl}/oauth2-apps`, InstalledOauthApps, extraProps)}
            {renderBackstageRoute(`${baseUrl}/oauth2-apps/add`, AddOauthApp, extraProps)}
            {renderBackstageRoute(`${baseUrl}/oauth2-apps/edit`, EditOauthApp, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing-oauth2-connections`, InstalledOutgoingOAuthConnections, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing-oauth2-connections/add`, AddOutgoingOAuthConnection, extraProps)}
            {renderBackstageRoute(`${baseUrl}/outgoing-oauth2-connections/edit`, EditOutgoingOAuthConnection, extraProps)}
            {renderBackstageRoute(`${baseUrl}/confirm`, ConfirmIntegration, extraProps)}
            {renderBackstageRoute('/:team/emoji', Emoji, extraProps)}
            {renderBackstageRoute(`${baseUrl}/add`, AddEmoji, extraProps)}
            {renderBackstageRoute(`${baseUrl}/bots/add`, AddBot, extraProps)}
            {renderBackstageRoute(`${baseUrl}/bots/edit`, AddBot, extraProps)}
            {renderBackstageRoute(`${baseUrl}/bots`, Bots, extraProps)}
        </Routes>
    );
};

const BackstageController = (props: Props) => {
    const listRef = useRef<HTMLDivElement>(null);

    const scrollToTop = () => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    };

    if (!props.team || !props.user) {
        return null;
    }
    const extraProps = {
        team: props.team,
        user: props.user,
        scrollToTop,
    };
    return (
        <>
            <BackstageNavbar
                team={props.team}
                siteName={props.siteName}
            />
            <div
                className='backstage-body'
                ref={listRef}
            >
                <Pluggable pluggableName='Root'/>
                <BackstageSidebar
                    team={props.team}
                    enableCustomEmoji={props.enableCustomEmoji}
                    enableIncomingWebhooks={props.enableIncomingWebhooks}
                    enableOutgoingWebhooks={props.enableOutgoingWebhooks}
                    enableCommands={props.enableCommands}
                    enableOAuthServiceProvider={props.enableOAuthServiceProvider}
                    enableOutgoingOAuthConnections={props.enableOutgoingOAuthConnections}
                    canCreateOrDeleteCustomEmoji={props.canCreateOrDeleteCustomEmoji}
                    canManageIntegrations={props.canManageIntegrations}
                />
                <CompatRouter>
                    <BackstageRoutes extraProps={extraProps}/>
                </CompatRouter>
            </div>
            <BackstageGlobalStyle/>
        </>
    );
};

export default BackstageController;

const BackstageGlobalStyle = createGlobalStyle`
    #root {
        > #global-header,
        > .team-sidebar,
        > .main-wrapper .sidebar--right,
        > .app-bar {
            display: none;
        }
    }
`;
