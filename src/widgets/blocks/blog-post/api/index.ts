import { gql } from "@apollo/client";

export const GET_POSTS = gql`
    query ($first: Int = 10, $categoryIds: [ID] = null, $tagIds: [ID] = null, $size: MediaItemSizeEnum = MEDIUM) {
    posts(where: {categoryIn: $categoryIds, tagIn: $tagIds}, first: $first) {
        edges {
        node {
            featuredImage {
            node {
                altText
                sourceUrl(size: $size)
            }
            }
            title
            link
            excerpt
        }
        }
    }
    }
`;

export type IPost = {
    title: string;
    link: string;
    excerpt: string;
    featuredImage?: {
        node: {
            altText: string;
            sourceUrl: string;
        };
    };
};

export type IPostResponse = {
    posts: {
        edges: {
            node: IPost;
        }[];
    };
};