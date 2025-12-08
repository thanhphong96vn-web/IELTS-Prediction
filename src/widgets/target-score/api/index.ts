import { gql } from "@apollo/client";

export const UPDATE_TARGET_SCORE = gql`
    mutation ($id: ID!, $listening: Float = null, $reading: Float = null, $speaking: Float = null, $writing: Float = null) {
        updateUserTargetScore(
            input: {id: $id, listening: $listening, reading: $reading, speaking: $speaking, writing: $writing}
        ) {
            clientMutationId
        }
    }
`;

export const UPDATE_EXAM_DATE = gql`
    mutation ($id: ID!, $examDate: String = null) {
        updateUserTargetScore(
            input: {id: $id, examDate: $examDate}
        ) {
            clientMutationId
        }
    }
`;