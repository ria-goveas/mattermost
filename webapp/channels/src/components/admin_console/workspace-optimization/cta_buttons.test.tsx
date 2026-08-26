// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createMemoryHistory} from 'history';
import React from 'react';

import CtaButtons from 'components/admin_console/workspace-optimization/cta_buttons';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

describe('components/admin_console/workspace-optimization/cta_buttons', () => {
    const baseProps = {
        learnMoreLink: '/learn_more',
        learnMoreText: 'Learn More',
        actionLink: '/action_link',
        actionText: 'Action Text',
    };

    test('should match snapshot', () => {
        const {container} = renderWithContext(<CtaButtons {...baseProps}/>);
        expect(container).toMatchSnapshot();
    });

    test('test ctaButtons list lenght is 2 as defined in baseProps', () => {
        renderWithContext(<CtaButtons {...baseProps}/>);
        const ctaButtons = screen.getAllByRole('button');

        expect(ctaButtons.length).toBe(2);
    });

    test('navigates to internal links', async () => {
        const history = createMemoryHistory();
        renderWithContext(<CtaButtons {...baseProps}/>, {}, {history});

        await userEvent.click(screen.getByRole('button', {name: baseProps.actionText}));

        expect(history.location.pathname).toBe(baseProps.actionLink);
    });
});
