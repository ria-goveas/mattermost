// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createBrowserHistory, createPath} from 'history';
import type {History, LocationDescriptorObject} from 'history';

import {isDesktopApp, getDesktopVersion} from '@mattermost/shared/utils/user_agent';

import {getModule} from 'module_registry';
import DesktopApp from 'utils/desktop_api';
import {isServerVersionGreaterThanOrEqualTo} from 'utils/server_version';

const b = createBrowserHistory({basename: window.basename});
const isDesktop = isDesktopApp() && isServerVersionGreaterThanOrEqualTo(getDesktopVersion(), '5.0.0');
const browserHistory = {
    ...b,
    push: (path: string | LocationDescriptorObject, ...args: string[]) => {
        if (isDesktop) {
            // Desktop IPC takes a single path string. Compat useNavigate() pushes a
            // location object, so forwarding only pathname would drop search/hash.
            DesktopApp.doBrowserHistoryPush(typeof path === 'object' ? createPath(path) : path);
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
 * If you're calling this from within a React component, consider using the useHistory hook from react-router-dom.
 */
export function getHistory() {
    return getModule<History>('utils/browser_history') ?? browserHistory;
}
