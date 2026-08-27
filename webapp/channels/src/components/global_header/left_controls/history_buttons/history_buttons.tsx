// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import styled from 'styled-components';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import IconButton from 'components/global_header/header_icon_button';
import KeyboardShortcutSequence, {
    KEYBOARD_SHORTCUTS,
} from 'components/keyboard_shortcuts/keyboard_shortcuts_sequence';
import type {
    KeyboardShortcutDescriptor} from 'components/keyboard_shortcuts/keyboard_shortcuts_sequence';

import DesktopApp from 'utils/desktop_api';
import {useNavigate} from 'utils/react_router_v6';

const HistoryButtonsContainer = styled.nav`
    display: flex;
    align-items: center;

    > :first-child {
           margin-right: 1px;
    }
`;

const HistoryButtons = (): JSX.Element => {
    const navigate = useNavigate();
    const intl = useIntl();

    const [canGoBack, setCanGoBack] = useState(true);
    const [canGoForward, setCanGoForward] = useState(true);

    const getTooltip = (shortcut: KeyboardShortcutDescriptor) => (
        <KeyboardShortcutSequence
            shortcut={shortcut}
            hoistDescription={true}
            isInsideTooltip={true}
        />
    );

    const goBack = () => {
        navigate(-1);
        requestButtons();
    };

    const goForward = () => {
        navigate(1);
        requestButtons();
    };

    const requestButtons = async () => {
        const {canGoBack, canGoForward} = await DesktopApp.getBrowserHistoryStatus();
        updateButtons(canGoBack, canGoForward);
    };

    const updateButtons = (enableBack: boolean, enableForward: boolean) => {
        setCanGoBack(enableBack);
        setCanGoForward(enableForward);
    };

    useEffect(() => {
        const off = DesktopApp.onBrowserHistoryStatusUpdated(updateButtons);
        return off;
    }, []);

    return (
        <HistoryButtonsContainer>
            <WithTooltip
                title={getTooltip(KEYBOARD_SHORTCUTS.browserChannelPrev)}
            >
                <IconButton
                    icon={'arrow-left'}
                    onClick={goBack}
                    disabled={!canGoBack}
                    aria-label={intl.formatMessage({id: 'sidebar_left.channel_navigator.goBackLabel', defaultMessage: 'Back'})}
                />
            </WithTooltip>
            <WithTooltip
                title={getTooltip(KEYBOARD_SHORTCUTS.browserChannelNext)}
            >
                <IconButton
                    icon={'arrow-right'}
                    onClick={goForward}
                    disabled={!canGoForward}
                    aria-label={intl.formatMessage({id: 'sidebar_left.channel_navigator.goForwardLabel', defaultMessage: 'Forward'})}
                />
            </WithTooltip>
        </HistoryButtonsContainer>
    );
};

export default HistoryButtons;
