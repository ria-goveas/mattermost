// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import ClaimController from './claim_controller';

jest.mock('components/claim/components/email_to_ldap', () => () => <div>{'email to ldap'}</div>);
jest.mock('components/claim/components/email_to_oauth', () => () => <div>{'email to oauth'}</div>);
jest.mock('components/claim/components/ldap_to_email', () => () => <div>{'ldap to email'}</div>);
jest.mock('components/claim/components/oauth_to_email', () => () => <div>{'oauth to email'}</div>);
jest.mock('components/common/back_button', () => () => <div>{'back'}</div>);
jest.mock('images/logo.png', () => 'logo.png');

const baseProps = {
    location: {search: '?email=test%40example.com&new_type=gitlab&old_type=google'},
    match: {url: '/claim'},
    actions: {
        switchLdapToEmail: jest.fn(),
    },
};

describe('ClaimController routes', () => {
    it.each([
        ['/claim/oauth_to_email', 'oauth to email'],
        ['/claim/email_to_oauth', 'email to oauth'],
        ['/claim/ldap_to_email', 'ldap to email'],
        ['/claim/email_to_ldap', 'email to ldap'],
    ])('renders %s', (path, expected) => {
        const history = createMemoryHistory({initialEntries: [path]});

        renderWithContext(<ClaimController {...baseProps}/>, {}, {history});

        expect(screen.getByText(expected)).toBeInTheDocument();
    });
});
