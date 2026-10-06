// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import type {MouseEvent} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import {Constants} from 'utils/constants';

import ChannelInfoButton from './channel_info_button';
import CollapseLhsButton from './collapse_lhs_button';
import CollapseRhsButton from './collapse_rhs_button';
import ShowSearchButton from './show_search_button';
import UnmuteChannelButton from './unmute_channel_button';

import ChannelHeaderMenu from '../channel_header_menu/channel_header_menu';
import MobileChannelHeaderPlugins from '../channel_header_menu/menu_items/mobile_channel_header_plugins';

type Props = {
    channel?: Channel;

    inGlobalThreads?: boolean;
    inDrafts?: boolean;
    isMobileView: boolean;
    isMuted?: boolean;
    isRHSOpen?: boolean;
    user: UserProfile;
    actions: {
        closeLhs: () => void;
        closeRhs: () => void;
        closeRhsMenu: () => void;
    };
};

type State = {
    purposeExpanded: boolean;
};

type PurposeButtonProps = {
    purpose: string;
    expanded: boolean;
    onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
};

function MobileChannelPurposeButton({purpose, expanded, onToggle}: PurposeButtonProps) {
    const {formatMessage} = useIntl();
    const label = formatMessage(
        {id: 'channel_header.channelPurpose', defaultMessage: 'Channel purpose: {purpose}'},
        {purpose},
    );

    return (
        <button
            type='button'
            id='mobileChannelHeaderPurpose'
            className='mobile-channel-header__purpose'
            aria-label={label}
            aria-expanded={expanded}
            onClick={onToggle}
        >
            {purpose}
        </button>
    );
}

function channelShowsPurpose(channel?: Channel): channel is Channel {
    return Boolean(
        channel?.purpose &&
        channel.type !== Constants.DM_CHANNEL &&
        channel.type !== Constants.GM_CHANNEL,
    );
}

export default class MobileChannelHeader extends React.PureComponent<Props, State> {
    state: State = {
        purposeExpanded: false,
    };

    componentDidMount() {
        document.querySelector('.inner-wrap')?.addEventListener('click', this.hideSidebars);
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.channel?.id !== this.props.channel?.id && this.state.purposeExpanded) {
            this.setState({purposeExpanded: false});
        }
    }

    componentWillUnmount() {
        document.querySelector('.inner-wrap')?.removeEventListener('click', this.hideSidebars);
    }

    togglePurpose = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        this.setState((prevState) => ({purposeExpanded: !prevState.purposeExpanded}));
    };

    hideSidebars = (e: Event) => {
        if (this.props.isMobileView) {
            if (this.props.isRHSOpen) {
                this.props.actions.closeRhs();
            }

            const target = e.target as HTMLElement | undefined;

            if (target && target.className !== 'navbar-toggle' && target.className !== 'icon-bar') {
                this.props.actions.closeLhs();
                this.props.actions.closeRhsMenu();
            }
        }
    };

    render() {
        const {user, channel, isMuted, inGlobalThreads, inDrafts} = this.props;

        let heading;
        if (inGlobalThreads) {
            heading = (
                <FormattedMessage
                    id='globalThreads.heading'
                    defaultMessage='Followed threads'
                />
            );
        } else if (inDrafts) {
            heading = (
                <FormattedMessage
                    id='drafts.heading'
                    defaultMessage='Drafts'
                />
            );
        } else if (channel) {
            const channelHeading = (
                <>
                    <ChannelHeaderMenu
                        isMobile={true}
                    />

                    {isMuted && (
                        <UnmuteChannelButton
                            user={user}
                            channel={channel}
                        />
                    )}
                </>
            );

            if (channelShowsPurpose(channel)) {
                heading = (
                    <div className='mobile-channel-header__titles'>
                        <div className='mobile-channel-header__name'>
                            {channelHeading}
                        </div>
                        <MobileChannelPurposeButton
                            purpose={channel.purpose}
                            expanded={this.state.purposeExpanded}
                            onToggle={this.togglePurpose}
                        />
                    </div>
                );
            } else {
                heading = channelHeading;
            }
        }

        return (
            <div className='row header'>
                <div id='navbar_wrapper'>
                    <nav
                        id='navbar'
                        className='navbar navbar-default navbar-fixed-top'
                        role='navigation'
                    >
                        <div className='container-fluid theme'>
                            <div className='navbar-header'>
                                <CollapseLhsButton/>
                                <div className={classNames('navbar-brand', {GlobalThreads___title: inGlobalThreads})}>
                                    {heading}
                                </div>
                                <div className='spacer'/>
                                {channel && (
                                    <ChannelInfoButton
                                        channel={channel}
                                    />
                                )}
                                {channel && (
                                    <MobileChannelHeaderPlugins
                                        channel={channel}
                                        isDropdown={false}
                                    />
                                )}
                                <ShowSearchButton/>
                                <CollapseRhsButton/>
                            </div>
                        </div>
                    </nav>
                    {channelShowsPurpose(channel) && this.state.purposeExpanded && (
                        <div
                            id='mobileChannelPurposeCard'
                            className='mobile-channel-header__purpose-card'
                        >
                            {channel.purpose}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
