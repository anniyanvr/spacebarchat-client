import React, { useCallback, useEffect, useState } from "react";
import { Portal } from "react-portal";
import styled, { css } from "styled-components";
import Button, { Props as ButtonProps } from "../Button";
import Icon from "../Icon";
import { animationFadeIn, animationFadeOut, animationZoomIn, animationZoomOut } from "../common/animations";

export type ModalAction = Omit<React.HTMLAttributes<HTMLButtonElement>, "as"> &
	Omit<ButtonProps, "onClick"> & {
		confirmation?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onClick: () => any | Promise<any>;
	};

interface ModalProps {
	children: React.ReactNode;
	onClose?: (force: boolean) => void;
	signal?: "close" | "confirm" | "cancel";
	title?: string;
	description?: React.ReactNode;
	transparent?: boolean;
	nonDismissable?: boolean;
	maxWidth?: string;
	maxHeight?: string;
	padding?: string;
	actions?: ModalAction[];
	disabled?: boolean;
	withEmptyActionBar?: boolean;
}

/**
 * Main container for all modals, handles the background overlay and positioning
 */
export const ModalBase = styled.div<{ closing?: boolean }>`
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;

	z-index: 9999;
	position: fixed;

	max-height: 100%;
	user-select: none;

	animation-duration: 0.2s;
	animation-fill-mode: forwards;

	display: grid;
	overflow-y: auto;
	place-items: center;

	color: var(--text);
	background: rgba(0, 0, 0, 0.8);

	${(props) =>
		props.closing
			? css`
					animation-name: ${animationFadeOut};

					> div {
						animation-name: ${animationZoomOut};
					}
			  `
			: css`
					animation-name: ${animationFadeIn};
			  `}
`;

/**
 * Wrapper for modal content, handles the sizing and positioning
 */
export const ModalWrapper = styled.div<
	Pick<ModalProps, "transparent" | "maxWidth" | "maxHeight"> & { actions: boolean }
>`
	min-height: 200px;
	max-width: min(calc(100vw - 20px), ${(props) => props.maxWidth ?? "450px"});
	max-height: min(calc(100vh - 20px), ${(props) => props.maxHeight ?? "650px"});

	margin: 20px;
	display: flex;
	flex-direction: column;

	animation-name: ${animationZoomIn};
	animation-duration: 0.25s;
	animation-timing-function: cubic-bezier(0.3, 0.3, 0.18, 1.1);

	${(props) =>
		!props.maxWidth &&
		css`
			width: 100%;
		`}

	${(props) =>
		!props.transparent &&
		css`
			overflow: hidden;
			background: var(--background-secondary);
			border-radius: 8px;
		`}
`;

export const ModalHeader = styled.div`
	padding: 16px;
	flex-shrink: 0;
	word-break: break-word;
	gap: 8px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`;

export const ModalContentContainer = styled.div<Pick<ModalProps, "transparent" | "padding">>`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	padding-top: 0;
	padding: ${(props) => props.padding ?? "0 16px 16px"};

	overflow-y: auto;
	font-size: 0.9375rem;

	${(props) =>
		!props.transparent &&
		css`
			background: var(--background-secondary);
		`}
`;

const Actions = styled.div`
	gap: 8px;
	display: flex;
	padding: 16px;
	flex-direction: row-reverse;
	background: var(--background-primary);
	border-radius: 0 0 4px 4px;
`;

export const ModalSubHeaderText = styled.div`
	font-size: 16px;
	font-weight: var(--font-weight-regular);
	color: var(--text-header-secondary);
	margin-top: 8px;
`;

export const ModalHeaderText = styled.div`
	font-size: 24px;
	font-weight: var(--font-weight-bold);
	color: var(--text);
	margin: 0;
	padding: 0;
`;

export const InputContainer = styled.div`
	margin-top: 24px;
	display: flex;
	flex-direction: column;
`;

/**
 * Wrapper for modal close button
 */
export const ModalCloseWrapper = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	padding: 10px;
	cursor: pointer;
	color: var(--text-disabled);

	&:hover {
		color: var(--text);
	}
`;

export function Modal(props: ModalProps) {
	const [closing, setClosing] = useState(false);

	const closeModal = useCallback(() => {
		setClosing(true);
		if (!closing) setTimeout(() => props.onClose?.(true), 2e2);
	}, [closing, props]);

	const confirm = useCallback(async () => {
		if (await props.actions?.find((x) => x.confirmation)?.onClick?.()) {
			closeModal();
		}
	}, [props.actions]);

	useEffect(() => {
		if (props.signal === "confirm") {
			confirm();
		} else if (props.signal) {
			if (props.signal === "close" && props.nonDismissable) {
				return;
			}

			closeModal();
		}
	}, [props.signal]);

	return (
		<Portal>
			<ModalBase closing={closing} onClick={() => !props.nonDismissable && closeModal()}>
				<ModalWrapper {...props} onClick={(e) => e.stopPropagation()} actions={false}>
					<div style={{ position: "relative" }}>
						{!props.nonDismissable && (
							<ModalCloseWrapper onClick={closeModal}>
								<Icon icon="mdiClose" size={1} />
							</ModalCloseWrapper>
						)}
					</div>
					{(props.title || props.description) && (
						<ModalHeader>
							{props.title && typeof props.title === "string" ? (
								<ModalHeaderText>{props.title}</ModalHeaderText>
							) : (
								props.title
							)}
							{props.description && typeof props.description === "string" ? (
								<ModalSubHeaderText>{props.description}</ModalSubHeaderText>
							) : (
								props.description
							)}
						</ModalHeader>
					)}
					<ModalContentContainer {...props}>{props.children}</ModalContentContainer>
					{props.actions && props.actions.length > 0 && (
						<Actions>
							{props.actions.map((x, index) => (
								<Button
									disabled={props.disabled}
									key={index}
									{...x}
									onClick={async () => {
										if (await x.onClick()) {
											closeModal();
										}
									}}
								/>
							))}
						</Actions>
					)}
				</ModalWrapper>
			</ModalBase>
		</Portal>
	);
}
