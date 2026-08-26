// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';
import {connect} from 'react-redux';
import {Route, Switch} from 'react-router-dom';
import type {RouteComponentProps} from 'react-router-dom';
import {CompatRoute} from 'react-router-dom-v5-compat';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TEAM_NAME_PATH_PATTERN} from 'utils/path';

type ChildProps = RouteComponentProps<{team: string}>;

function RouteDependentChild(props: ChildProps) {
    return (
        <div data-testid='route-dependent-child'>
            {props.match.params.team}
        </div>
    );
}

const ConnectedRouteDependentChild = connect(() => ({}))(RouteDependentChild);

function RhsPopoutShell() {
    return (
        <CompatRoute
            path='/_popout/rhs/:team/search'
            component={ConnectedRouteDependentChild}
        />
    );
}

describe('RhsPopout route prop contract', () => {
    it('preserves injected v5 match props for connected descendants via CompatRoute', () => {
        renderWithContext(
            <Switch>
                <Route
                    path={`/_popout/rhs/:team(${TEAM_NAME_PATH_PATTERN})`}
                    render={() => <RhsPopoutShell/>}
                />
            </Switch>,
            {},
            {history: createMemoryHistory({initialEntries: ['/_popout/rhs/router-test-org/search?q=test']})},
        );

        expect(screen.getByTestId('route-dependent-child')).toHaveTextContent('router-test-org');
    });
});
