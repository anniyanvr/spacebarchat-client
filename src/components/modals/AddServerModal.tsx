import { useModals } from "@mattjennings/react-modal-stack";
import styled from "styled-components";
import Icon from "../Icon";
import CreateServerModal from "./CreateServerModal";
import JoinServerModal from "./JoinServerModal";
import {
	Modal,
	ModalActionItem,
	ModalCloseWrapper,
	ModalHeaderText,
	ModalSubHeaderText,
	ModelContentContainer,
} from "./ModalComponents";
import { AnimatedModalProps } from "./ModalRenderer";

export const ModalHeader = styled.div`
	padding: 16px;
`;

const CreateButton = styled(ModalActionItem)`
	transition: background-color 0.2s ease-in-out;
	margin-bottom: 8px;
	font-size: 16px;
	font-weight: var(--font-weight-medium);

	&:hover {
		background-color: var(--primary-light);
	}
`;

const JoinButton = styled(ModalActionItem)`
	transition: background-color 0.2s ease-in-out;
	margin-bottom: 8px;
	font-size: 16px;
	font-weight: var(--font-weight-medium);

	&:hover {
		background-color: var(--background-secondary-highlight);
	}
`;

function AddServerModal(props: AnimatedModalProps) {
	const { openModal, closeModal } = useModals();

	return (
		<Modal {...props}>
			<ModalCloseWrapper>
				<button
					onClick={closeModal}
					style={{
						background: "none",
						border: "none",
						outline: "none",
					}}
				>
					<Icon
						icon="mdiClose"
						size={1}
						style={{
							cursor: "pointer",
							color: "var(--text)",
						}}
					/>
				</button>
			</ModalCloseWrapper>

			<ModalHeader>
				<ModalHeaderText>Add a Guild</ModalHeaderText>
				<ModalSubHeaderText>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</ModalSubHeaderText>
			</ModalHeader>

			<ModelContentContainer>
				<CreateButton
					variant="filled"
					size="med"
					onClick={() => {
						openModal(CreateServerModal);
					}}
				>
					Create a Guild
				</CreateButton>

				<JoinButton
					variant="outlined"
					size="med"
					onClick={() => {
						openModal(JoinServerModal);
					}}
				>
					Join a Guild
				</JoinButton>
			</ModelContentContainer>
		</Modal>
	);
}

export default AddServerModal;
