// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {FormattedMessage} from 'react-intl';

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

export default class MobileChannelHeader extends React.PureComponent<Props, State> {
    state: State = {
        purposeExpanded: false,
    };

    componentDidMount() {
        document.querySelector('.inner-wrap')?.addEventListener('click', this.hideSidebars);
    }

    componentDidUpdate(prevProps: Props) {
        if (this.state.purposeExpanded && prevProps.channel?.id !== this.props.channel?.id) {
            this.setState({purposeExpanded: false});
        }
    }

    componentWillUnmount() {
        document.querySelector('.inner-wrap')?.removeEventListener('click', this.hideSidebars);
    }

    togglePurpose = () => {
        this.setState((prevState) => ({purposeExpanded: !prevState.purposeExpanded}));
    };

    getVisiblePurpose = () => {
        const {channel, inDrafts, inGlobalThreads} = this.props;
        if (!channel || inDrafts || inGlobalThreads) {
            return '';
        }
        if (channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) {
            return '';
        }
        return (channel.purpose ?? '').trim();
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
        const channelPurpose = this.getVisiblePurpose();

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
            const channelMenu = (
                <ChannelHeaderMenu
                    isMobile={true}
                />
            );
            heading = (
                <>
                    {channelPurpose ? (
                        <div className='navbar-brand__channel'>
                            {channelMenu}
                            <button
                                type='button'
                                className={classNames('channel-header__purpose', {
                                    'channel-header__purpose--expanded': this.state.purposeExpanded,
                                })}
                                aria-expanded={this.state.purposeExpanded}
                                onClick={this.togglePurpose}
                            >
                                {channelPurpose}
                            </button>
                        </div>
                    ) : channelMenu}
                    {isMuted && (
                        <UnmuteChannelButton
                            user={user}
                            channel={channel}
                        />
                    )}
                </>
            );
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
                </div>
            </div>
        );
    }
}
