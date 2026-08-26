// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Route, Routes} from 'react-router-dom-v5-compat';

import type {AuthChangeResponse} from '@mattermost/types/users';

import type {ActionResult} from 'mattermost-redux/types/actions';

import EmailToLDAP from 'components/claim/components/email_to_ldap';
import EmailToOAuth from 'components/claim/components/email_to_oauth';
import LDAPToEmail from 'components/claim/components/ldap_to_email';
import OAuthToEmail from 'components/claim/components/oauth_to_email';
import BackButton from 'components/common/back_button';

import logoImage from 'images/logo.png';

export interface PasswordConfig {
    minimumLength: number;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
}

type Location = {
    search: string;
};

export type Props = {
    location: Location;
    siteName?: string;
    ldapLoginFieldName?: string;
    passwordConfig?: PasswordConfig;
    match: {
        url: string;
    };
    actions: {
        switchLdapToEmail: (ldapPassword: string, email: string, emailPassword: string, mfaCode?: string) => Promise<ActionResult<AuthChangeResponse>>;
    };
};

export default class ClaimController extends React.PureComponent<Props> {
    render(): JSX.Element {
        const email = (new URLSearchParams(this.props.location.search)).get('email');
        const newType = (new URLSearchParams(this.props.location.search)).get('new_type');
        const currentType = (new URLSearchParams(this.props.location.search)).get('old_type');

        return (
            <div>
                <BackButton/>
                <div className='col-sm-12'>
                    <div className='signup-team__container'>
                        <img
                            alt={'signup logo'}
                            className='signup-team-logo'
                            src={logoImage}
                        />
                        <div id='claim'>
                            <Routes>
                                <Route
                                    path={`${this.props.match.url}/oauth_to_email`}
                                    element={(
                                        <OAuthToEmail
                                            currentType={currentType || ''}
                                            email={email || ''}
                                            siteName={this.props.siteName}
                                            passwordConfig={this.props.passwordConfig}
                                        />
                                    )}
                                />
                                <Route
                                    path={`${this.props.match.url}/email_to_oauth`}
                                    element={(
                                        <EmailToOAuth
                                            newType={newType || ''}
                                            email={email || ''}
                                            siteName={this.props.siteName}
                                        />
                                    )}
                                />
                                <Route
                                    path={`${this.props.match.url}/ldap_to_email`}
                                    element={(
                                        <LDAPToEmail
                                            email={email}
                                            passwordConfig={this.props.passwordConfig}
                                            switchLdapToEmail={this.props.actions.switchLdapToEmail}
                                        />
                                    )}
                                />
                                <Route
                                    path={`${this.props.match.url}/email_to_ldap`}
                                    element={(
                                        <EmailToLDAP
                                            email={email}
                                            siteName={this.props.siteName}
                                            ldapLoginFieldName={this.props.ldapLoginFieldName}
                                        />
                                    )}
                                />
                            </Routes>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
