import { SEOFragment, SEOType } from "@/shared/graphql";
import { IPost } from "@/shared/types";
import { gql } from "@apollo/client";

export type CategoryData = {
    category: {
        seo: SEOType
        link: string
    };
    posts: {
        edges: Array<{
            node: IPost
        }>
        pageInfo: {
            offsetPagination: {
                total: number
                hasMore: boolean
                hasPrevious: boolean
            }
        }
    }
}

export const GET_NEWS_ARCHIVE_DATA = gql`
    query GET_NEWS_ARCHIVE_BY_ID($id: ID!, $size: Int = 10, $offset: Int = 0, $categoryIn: [ID]) {
        category(id: $id) {
            ${SEOFragment}
            link
        }
        posts(where: {status: PUBLISH, offsetPagination: {size: $size, offset: $offset}, categoryIn: $categoryIn}) {
            edges {
                node {
                    id
                    link
                    title
                    date
                    excerpt
                    featuredImage {
                        node {
                            sourceUrl(size: LARGE)
                            altText
                        }
                    }
                    categories {
                        edges {
                            node {
                                link
                                name
                            }
                        }
                    }
                    postMeta {
                        views
                        proUserOnly
                    }
                    rating
                }
            }
            pageInfo {
                offsetPagination {
                    total
                    hasMore
                    hasPrevious
                }
            }
        }
    }
`