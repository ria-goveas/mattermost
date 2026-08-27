// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createBrowserHistory} from 'history';
import type {History} from 'history';

import {isDesktopApp, getDesktopVersion} from '@mattermost/shared/utils/user_agent';

import {getModule} from 'module_registry';
import DesktopApp from 'utils/desktop_api';
import {isServerVersionGreaterThanOrEqualTo} from 'utils/server_version';

const b = createBrowserHistory({basename: window.basename});
const isDesktop = isDesktopApp() && isServerVersionGreaterThanOrEqualTo(getDesktopVersion(), '5.0.0');
const browserHistory = {
    ...b,
    push: (path: string | {pathname: string}, ...args: string[]) => {
        if (isDesktop) {
            DesktopApp.doBrowserHistoryPush(typeof path === 'object' ? path.pathname : path);
        } else {
            b.push(path, ...args);
        }
    },
};

if (isDesktop) {
    DesktopApp.onBrowserHistoryPush((pathName) => b.push(pathName));
}

/**
 * Returns the current history object.
 *
 * Non-React code (Redux actions, utils) should keep using this helper so the
 * desktop push override stays in effect. React components should use
 * useNavigate from utils/react_router_v6 instead of calling getHistory() or
 * useHistory().
 */
export function getHistory() {
    return getModule<History>('utils/browser_history') ?? browserHistory;
}
