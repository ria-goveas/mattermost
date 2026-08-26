// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getHistory} from 'utils/browser_history';
import DesktopApp from 'utils/desktop_api';

jest.unmock('utils/browser_history');

jest.mock('utils/desktop_api', () => ({
    __esModule: true,
    default: {
        doBrowserHistoryPush: jest.fn(),
        onBrowserHistoryPush: jest.fn(),
    },
}));

jest.mock('@mattermost/shared/utils/user_agent', () => ({
    isDesktopApp: jest.fn(() => true),
    getDesktopVersion: jest.fn(() => '5.0.0'),
}));

describe('utils/browser_history', () => {
    it('forwards query params when pushing a location object on desktop', () => {
        getHistory().push({
            pathname: '/team/integrations/confirm',
            search: '?type=commands&id=cmd123',
        });

        expect(DesktopApp.doBrowserHistoryPush).toHaveBeenCalledWith(
            '/team/integrations/confirm?type=commands&id=cmd123',
        );
    });

    it('forwards a string path including query params on desktop', () => {
        getHistory().push('/team/integrations/confirm?type=oauth2-apps&id=app123');

        expect(DesktopApp.doBrowserHistoryPush).toHaveBeenCalledWith(
            '/team/integrations/confirm?type=oauth2-apps&id=app123',
        );
    });
});
