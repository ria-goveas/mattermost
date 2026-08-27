// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import TrialBenefitsModalStepMore from 'components/trial_benefits_modal/trial_benefits_modal_step_more';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

describe('components/trial_benefits_modal/trial_benefits_modal_step_more', () => {
    const props = {
        id: 'thing',
        route: '/test/page',
        message: 'Test Message',
    };

    test('should match snapshot', () => {
        const {baseElement} = renderWithContext(
            <TrialBenefitsModalStepMore {...props}/>,
        );
        expect(baseElement).toMatchSnapshot();
    });

    test('should handle on click', async () => {
        const mockOnClick = jest.fn();

        renderWithContext(
            <TrialBenefitsModalStepMore
                {...props}
                onClick={mockOnClick}
            />,
        );

        await userEvent.click(screen.getByText('Test Message'));

        expect((global as any).historyMock.push).toHaveBeenCalledWith(props.route);
        expect(mockOnClick).toHaveBeenCalled();
    });
});
