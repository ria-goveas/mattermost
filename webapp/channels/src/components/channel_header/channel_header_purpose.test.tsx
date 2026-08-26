// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {Channel} from '@mattermost/types/channels';

import * as channelsSelectors from 'mattermost-redux/selectors/entities/channels';
import * as rolesSelectors from 'mattermost-redux/selectors/entities/roles';

import * as modalActions from 'actions/views/modals';

import EditChannelPurposeModal from 'components/edit_channel_purpose_modal';

import {fireEvent, renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {ModalIdentifiers} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import ChannelHeaderPurpose from './channel_header_purpose';

describe('ChannelHeaderPurpose', () => {
    let getCurrentChannelMock: jest.SpyInstance;
    let haveIChannelPermissionMock: jest.SpyInstance;
    let openModalSpy: jest.SpyInstance;

    const publicChannel: Channel = TestHelper.getChannelMock({
        id: 'channel_id',
        name: 'town-square',
        display_name: 'Town Square',
        type: 'O',
        purpose: 'Discuss team-wide updates',
        delete_at: 0,
    });

    const privateChannel: Channel = TestHelper.getChannelMock({
        ...publicChannel,
        id: 'private_channel_id',
        type: 'P',
        name: 'secret',
        display_name: 'Secret',
    });

    beforeEach(() => {
        getCurrentChannelMock = jest.spyOn(channelsSelectors, 'getCurrentChannel');
        haveIChannelPermissionMock = jest.spyOn(rolesSelectors, 'haveIChannelPermission');
        openModalSpy = jest.spyOn(modalActions, 'openModal');

        getCurrentChannelMock.mockReturnValue(publicChannel);
        haveIChannelPermissionMock.mockReturnValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function renderComponent() {
        return renderWithContext(<ChannelHeaderPurpose/>);
    }

    test('should render nothing for a direct message', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            type: 'D',
        }));

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should render nothing for a group message', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            type: 'G',
        }));

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should render nothing when there is no current channel', () => {
        getCurrentChannelMock.mockReturnValue(undefined);

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should show truncated purpose and a pencil when the user can edit', () => {
        renderComponent();

        expect(screen.getByTestId('channelHeaderPurpose')).toBeInTheDocument();
        expect(screen.getByText('Discuss team-wide updates')).toBeInTheDocument();
        expect(screen.getByText('Discuss team-wide updates')).toHaveClass('ChannelHeaderPurpose__text');
        expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
    });

    test('should open the existing purpose modal when the pencil is clicked', async () => {
        renderComponent();

        await userEvent.click(screen.getByRole('button', {name: 'Edit'}));

        expect(openModalSpy).toHaveBeenCalledWith({
            modalId: ModalIdentifiers.EDIT_CHANNEL_PURPOSE,
            dialogType: EditChannelPurposeModal,
            dialogProps: {channel: publicChannel},
        });
    });

    test('should open the existing purpose modal with Enter or Space on the pencil', async () => {
        renderComponent();

        const editButton = screen.getByRole('button', {name: 'Edit'});
        editButton.focus();
        expect(editButton).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        expect(openModalSpy).toHaveBeenCalledTimes(1);

        openModalSpy.mockClear();
        editButton.focus();
        await userEvent.keyboard(' ');
        expect(openModalSpy).toHaveBeenCalledTimes(1);
    });

    test('should show purpose text without a pencil when the user cannot edit', () => {
        haveIChannelPermissionMock.mockReturnValue(false);

        renderComponent();

        expect(screen.getByText('Discuss team-wide updates')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Edit'})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Add a channel purpose'})).not.toBeInTheDocument();
    });

    test('should show an add-purpose control when purpose is empty and the user can edit', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            purpose: '',
        }));

        renderComponent();

        expect(screen.getByRole('button', {name: 'Add a channel purpose'})).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Edit'})).not.toBeInTheDocument();
    });

    test('should open the purpose modal with an empty field from the add control', async () => {
        const emptyPurposeChannel = TestHelper.getChannelMock({
            ...publicChannel,
            purpose: '',
        });
        getCurrentChannelMock.mockReturnValue(emptyPurposeChannel);

        renderComponent();

        await userEvent.click(screen.getByRole('button', {name: 'Add a channel purpose'}));

        expect(openModalSpy).toHaveBeenCalledWith({
            modalId: ModalIdentifiers.EDIT_CHANNEL_PURPOSE,
            dialogType: EditChannelPurposeModal,
            dialogProps: {channel: emptyPurposeChannel},
        });
    });

    test('should render nothing when purpose is empty and the user cannot edit', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            purpose: '',
        }));
        haveIChannelPermissionMock.mockReturnValue(false);

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should treat whitespace-only purpose as empty', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            purpose: '   ',
        }));
        haveIChannelPermissionMock.mockReturnValue(false);

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should show purpose as read-only on an archived channel', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            delete_at: 1234,
        }));

        renderComponent();

        expect(screen.getByText('Discuss team-wide updates')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Edit'})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Add a channel purpose'})).not.toBeInTheDocument();
    });

    test('should render nothing on an archived channel with no purpose', () => {
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            purpose: '',
            delete_at: 1234,
        }));

        const {container} = renderComponent();

        expect(container).toBeEmptyDOMElement();
    });

    test('should request private-channel properties permission for private channels', () => {
        getCurrentChannelMock.mockReturnValue(privateChannel);

        renderComponent();

        expect(haveIChannelPermissionMock).toHaveBeenCalledWith(
            expect.anything(),
            privateChannel.team_id,
            privateChannel.id,
            'manage_private_channel_properties',
        );
    });

    test('should request public-channel properties permission for public channels', () => {
        renderComponent();

        expect(haveIChannelPermissionMock).toHaveBeenCalledWith(
            expect.anything(),
            publicChannel.team_id,
            publicChannel.id,
            'manage_public_channel_properties',
        );
    });

    test('should keep a 250-character purpose on one truncated line', () => {
        const longPurpose = 'a'.repeat(250);
        getCurrentChannelMock.mockReturnValue(TestHelper.getChannelMock({
            ...publicChannel,
            purpose: longPurpose,
        }));

        renderComponent();

        const text = screen.getByText(longPurpose);
        expect(text).toHaveClass('ChannelHeaderPurpose__text');
        expect(text).toHaveAttribute('title', longPurpose);
    });

    test('should keep the purpose text selectable rather than making it a click target', async () => {
        renderComponent();

        await userEvent.click(screen.getByText('Discuss team-wide updates'));

        expect(openModalSpy).not.toHaveBeenCalled();
    });

    test('should show the pencil when the edit control is focused', () => {
        renderComponent();

        const editButton = screen.getByRole('button', {name: 'Edit'});
        fireEvent.focus(editButton);

        expect(editButton).toHaveFocus();
        expect(screen.getByTestId('channelHeaderPurpose')).toContainElement(editButton);
    });
});
