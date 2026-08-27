// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useLocation} from 'react-router-dom';

import type {AuthChangeResponse} from '@mattermost/types/users';

import type {ActionResult} from 'mattermost-redux/types/actions';

import EmailToLDAP from 'components/claim/components/email_to_ldap';
import EmailToOAuth from 'components/claim/components/email_to_oauth';
import LDAPToEmail from 'components/claim/components/ldap_to_email';
import OAuthToEmail from 'components/claim/components/oauth_to_email';
import BackButton from 'components/common/back_button';

import logoImage from 'images/logo.png';
import {CompatRoute, Routes, useMatch} from 'utils/react_router_compat';

export interface PasswordConfig {
    minimumLength: number;
    requireLowercase: boolean;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
}

export type Props = {
    siteName?: string;
    ldapLoginFieldName?: string;
    passwordConfig?: PasswordConfig;
    actions: {
        switchLdapToEmail: (ldapPassword: string, email: string, emailPassword: string, mfaCode?: string) => Promise<ActionResult<AuthChangeResponse>>;
    };
};

export default function ClaimController(props: Props) {
    const location = useLocation();
    const match = useMatch('/claim');
    const baseUrl = match?.url ?? '/claim';

    const email = (new URLSearchParams(location.search)).get('email');
    const newType = (new URLSearchParams(location.search)).get('new_type');
    const currentType = (new URLSearchParams(location.search)).get('old_type');

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
                            <CompatRoute
                                path={`${baseUrl}/oauth_to_email`}
                                element={(
                                    <OAuthToEmail
                                        currentType={currentType || ''}
                                        email={email || ''}
                                        siteName={props.siteName}
                                        passwordConfig={props.passwordConfig}
                                    />
                                )}
                            />
                            <CompatRoute
                                path={`${baseUrl}/email_to_oauth`}
                                element={(
                                    <EmailToOAuth
                                        newType={newType || ''}
                                        email={email || ''}
                                        siteName={props.siteName}
                                    />
                                )}
                            />
                            <CompatRoute
                                path={`${baseUrl}/ldap_to_email`}
                                element={(
                                    <LDAPToEmail
                                        email={email}
                                        passwordConfig={props.passwordConfig}
                                        switchLdapToEmail={props.actions.switchLdapToEmail}
                                    />
                                )}
                            />
                            <CompatRoute
                                path={`${baseUrl}/email_to_ldap`}
                                element={(
                                    <EmailToLDAP
                                        email={email}
                                        siteName={props.siteName}
                                        ldapLoginFieldName={props.ldapLoginFieldName}
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
